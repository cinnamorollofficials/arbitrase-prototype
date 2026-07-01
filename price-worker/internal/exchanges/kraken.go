package exchanges

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"arbitrase/price-worker/internal/market"
)

// Kraken fetches spot ticker data using the public REST API.
//
// Endpoint: GET https://api.kraken.com/0/public/Ticker?pair=<p1>,<p2>,...
//
// Pair format accepted: altname (e.g. "XBTUSD", "ETHUSD", "ALEOUSD").
// Our internal symbol "BASE_QUOTE" is converted to altname by removing "_".
//
// Response result keys are always Kraken's internal altnames. Some legacy
// assets use X/Z prefixes (e.g. "XXBTZUSD" for "XBTUSD"). We handle this
// with a normalised fallback map.
//
// Important: Kraken may return non-empty error[] alongside a valid result{}.
// We always process result{} regardless of errors[].
type Kraken struct {
	client      *http.Client
	concurrency int
}

type krakenTickerEntry struct {
	A []jsonNumber `json:"a"` // ask [price, wholeLotVol, lotVol]
	B []jsonNumber `json:"b"` // bid [price, wholeLotVol, lotVol]
	C []jsonNumber `json:"c"` // last trade [price, lotVol]
}

type krakenTickerResponse struct {
	Error  []string                     `json:"error"`
	Result map[string]krakenTickerEntry `json:"result"`
}

// krakenBatchSize is the max pairs per request. Kraken supports ~100.
const krakenBatchSize = 50

func NewKraken(client *http.Client, concurrency int) *Kraken {
	if concurrency < 1 {
		concurrency = 3
	}
	return &Kraken{client: client, concurrency: concurrency}
}

// symbolToAltname converts internal "BASE_QUOTE" → "BASEQUOTE" (altname format).
// e.g. "ALEO_USD" → "ALEOUSD", "XBT_EUR" → "XBTEUR"
func symbolToAltname(symbol string) string {
	return strings.Replace(symbol, "_", "", 1)
}

// normaliseKey strips any single leading "X" or "Z" prefix that Kraken uses
// for legacy assets and returns an uppercase key for fuzzy matching.
// e.g. "XXBTZUSD" → "XBTUSD", "XETHZEUR" → "ETHEUR"
func normaliseKrakenKey(key string) string {
	upper := strings.ToUpper(key)
	// Kraken wraps legacy bases in "X" and legacy quotes in "Z".
	// This produces patterns like: X<BASE>Z<QUOTE>
	// Strip leading X and trailing Z-segment by trying common quote suffixes.
	// Simpler approach: just strip leading "X" from known prefixed pairs.
	if len(upper) > 6 && strings.HasPrefix(upper, "X") {
		// try removing leading X
		candidate := upper[1:]
		// and a trailing Z if the quote segment was Z-prefixed
		// e.g. "XBTZUSD" after stripping X → "BTZUSD" — strip Z before QUOTE
		// We'll handle this by also normalizing the lookup symbol the same way.
		return candidate
	}
	return upper
}

func (k *Kraken) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	// Map altname → pair index so we can match responses back to pairs.
	altnameToIdx := make(map[string]int, len(pairs))
	for i, pair := range pairs {
		altnameToIdx[symbolToAltname(pair.Symbol)] = i
	}

	// Split into batches.
	type batch struct {
		pairs    []market.TokenPair
		altnames []string
	}
	batches := make([]batch, 0)
	for start := 0; start < len(pairs); start += krakenBatchSize {
		end := start + krakenBatchSize
		if end > len(pairs) {
			end = len(pairs)
		}
		bp := pairs[start:end]
		alts := make([]string, len(bp))
		for i, p := range bp {
			alts[i] = symbolToAltname(p.Symbol)
		}
		batches = append(batches, batch{pairs: bp, altnames: alts})
	}

	var mu sync.Mutex
	// Store all ticker entries keyed by Kraken's raw response key (uppercase).
	rawEntries := make(map[string]krakenTickerEntry)

	sem := make(chan struct{}, k.concurrency)
	var wg sync.WaitGroup

	for _, b := range batches {
		b := b
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			url := fmt.Sprintf(
				"https://api.kraken.com/0/public/Ticker?pair=%s",
				strings.Join(b.altnames, ","),
			)

			var response krakenTickerResponse
			if err := getJSON(ctx, k.client, url, &response); err != nil {
				// Network / HTTP error — skip batch, pairs fall through to emptyTick.
				return
			}

			// NOTE: Do NOT bail on response.Error here.
			// Kraken returns warnings in error[] but still populates result{}.
			// e.g. unknown pairs yield an error entry but valid pairs still appear.

			mu.Lock()
			for key, entry := range response.Result {
				rawEntries[strings.ToUpper(key)] = entry
			}
			mu.Unlock()
		}()
	}
	wg.Wait()

	// Build a normalised lookup for fuzzy matching (strips X/Z legacy prefixes).
	// Key: uppercase altname without separators → entry
	normEntries := make(map[string]krakenTickerEntry, len(rawEntries))
	for key, entry := range rawEntries {
		// Exact key
		normEntries[key] = entry
		// Without leading X (e.g. XXBTZUSD → XBTZUSD)
		if strings.HasPrefix(key, "X") {
			normEntries[key[1:]] = entry
		}
		// Without trailing Z-quote prefix (e.g. XBTZUSD → XBTUSD)
		// We'll handle this in the per-pair lookup below.
	}

	fetchedAt := market.NowMillis()
	ticks := make([]market.MarketTick, len(pairs))

	for i, pair := range pairs {
		altname := strings.ToUpper(symbolToAltname(pair.Symbol)) // e.g. "ALEOUSD"

		// Strategy 1: exact altname match
		entry, ok := rawEntries[altname]

		// Strategy 2: Kraken prepends X to base (e.g. "XALEOUSD")
		if !ok {
			entry, ok = rawEntries["X"+altname]
		}

		// Strategy 3: Kraken legacy Z-quote (e.g. "XBTZUSD" for XBTUSD)
		// Split by known quote currencies and try inserting "Z"
		if !ok {
			for _, quote := range []string{"USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"} {
				if strings.HasSuffix(altname, quote) {
					base := altname[:len(altname)-len(quote)]
					// Try X<base>Z<quote> and X<base><quote>
					entry, ok = rawEntries["X"+base+"Z"+quote]
					if !ok {
						entry, ok = rawEntries[base+"Z"+quote]
					}
					if ok {
						break
					}
				}
			}
		}

		// Strategy 4: scan all raw keys for case-insensitive match
		if !ok {
			for key, e := range rawEntries {
				// Strip X/Z prefixes from key and compare to altname
				stripped := key
				if strings.HasPrefix(stripped, "X") {
					stripped = stripped[1:]
				}
				for _, quote := range []string{"ZUSD", "ZEUR", "ZGBP", "ZCAD", "ZAUD", "ZJPY", "ZCHF"} {
					if strings.HasSuffix(stripped, quote) {
						stripped = stripped[:len(stripped)-len(quote)] + quote[1:]
						break
					}
				}
				if stripped == altname {
					entry = e
					ok = true
					break
				}
			}
		}

		if !ok {
			ticks[i] = emptyTick(pair, "kraken_ticker", "pair not found in ticker response", fetchedAt)
			continue
		}

		var bid, ask, last *float64
		if len(entry.B) > 0 {
			bid = entry.B[0].FloatPtr()
		}
		if len(entry.A) > 0 {
			ask = entry.A[0].FloatPtr()
		}
		if len(entry.C) > 0 {
			last = entry.C[0].FloatPtr()
		}

		mid := market.MidFromBidAsk(bid, ask)
		if mid == nil && last != nil {
			mid = market.FloatPtr(*last)
		}

		status := "success"
		var errPtr *string
		if bid == nil && ask == nil && last == nil {
			status = "empty"
			errPtr = market.StringPtr("ticker has no numeric price")
		}

		ticks[i] = market.MarketTick{
			ExchangeID:     pair.ExchangeID,
			ExchangeName:   pair.ExchangeName,
			PairID:         pair.ID,
			Symbol:         pair.Symbol,
			BaseSymbol:     pair.BaseToken.Symbol,
			QuoteSymbol:    pair.QuoteToken.Symbol,
			Bid:            bid,
			Ask:            ask,
			Last:           last,
			Mid:            mid,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         "kraken_ticker",
			Status:         status,
			Error:          errPtr,
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		}
	}

	return ticks
}
