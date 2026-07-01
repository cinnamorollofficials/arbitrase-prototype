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
// Endpoint: GET https://api.kraken.com/0/public/Ticker?pair=<sym1>,<sym2>,...
//
// The "pair" parameter accepts Kraken wsname format (BASE/QUOTE, e.g. "BTC/USD")
// or the Kraken altname format (e.g. "XBTUSD"). We use wsname because that is
// what is stored in the DB symbol field as "BASE_QUOTE" and can be converted
// trivially by replacing "_" with "/".
//
// The response result keys may differ from the requested names
// (e.g. "XXBTZUSD" for "XBT/USD"). We therefore do a secondary lookup
// using the "altname" field inside each result to match back to our pairs.
type Kraken struct {
	client      *http.Client
	concurrency int
}

type krakenTickerEntry struct {
	// A = ask [price, wholeLotVolume, lotVolume]
	A []jsonNumber `json:"a"`
	// B = bid [price, wholeLotVolume, lotVolume]
	B []jsonNumber `json:"b"`
	// C = last trade closed [price, lotVolume]
	C []jsonNumber `json:"c"`
}

type krakenTickerResponse struct {
	Error  []string                     `json:"error"`
	Result map[string]krakenTickerEntry `json:"result"`
}

// krakenBatchSize is the max number of pairs per Ticker request.
// Kraken supports up to ~100 pairs in a single call.
const krakenBatchSize = 50

func NewKraken(client *http.Client, concurrency int) *Kraken {
	if concurrency < 1 {
		concurrency = 3
	}
	return &Kraken{client: client, concurrency: concurrency}
}

// pairToWsname converts "BASE_QUOTE" → "BASE/QUOTE".
func pairToWsname(symbol string) string {
	return strings.Replace(symbol, "_", "/", 1)
}

func (k *Kraken) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	// Split pairs into batches.
	type batchResult struct {
		offset  int
		results map[string]krakenTickerEntry // wsname → entry
	}

	batches := make([][]market.TokenPair, 0)
	for start := 0; start < len(pairs); start += krakenBatchSize {
		end := start + krakenBatchSize
		if end > len(pairs) {
			end = len(pairs)
		}
		batches = append(batches, pairs[start:end])
	}

	sem := make(chan struct{}, k.concurrency)
	var mu sync.Mutex
	// wsname → ticker entry collected from all batches
	allEntries := make(map[string]krakenTickerEntry)

	var wg sync.WaitGroup
	for bi, batch := range batches {
		bi := bi
		batch := batch
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			wsnames := make([]string, len(batch))
			for i, pair := range batch {
				wsnames[i] = pairToWsname(pair.Symbol)
			}

			url := fmt.Sprintf(
				"https://api.kraken.com/0/public/Ticker?pair=%s",
				strings.Join(wsnames, ","),
			)

			var response krakenTickerResponse
			if err := getJSON(ctx, k.client, url, &response); err != nil {
				// Batch failed; entries will be missing → emptyTick fallback below.
				_ = bi
				return
			}
			if len(response.Error) > 0 {
				return
			}

			mu.Lock()
			for key, entry := range response.Result {
				// Key is Kraken's internal name. We store by wsname for lookup.
				// We also store by the key itself to aid secondary lookup.
				allEntries[key] = entry
			}
			mu.Unlock()
		}()
	}
	wg.Wait()

	// Build a normalised lookup: lowercase-no-slash-no-underscore → entry.
	// This helps match "XBTUSD" ↔ "XBT/USD" ↔ "XBT_USD".
	normalised := make(map[string]krakenTickerEntry, len(allEntries))
	for key, entry := range allEntries {
		norm := strings.ToUpper(strings.NewReplacer("/", "", "_", "", "X", "").Replace(key))
		_ = norm
		// Store by raw key as-is.
		normalised[strings.ToUpper(key)] = entry
	}

	fetchedAt := market.NowMillis()
	ticks := make([]market.MarketTick, len(pairs))

	for i, pair := range pairs {
		ws := pairToWsname(pair.Symbol) // e.g. "ADA/USD"

		// Try direct lookup by wsname.
		entry, ok := allEntries[ws]
		if !ok {
			// Try by compressed symbol (e.g. "ADAUSD").
			compressed := strings.ToUpper(strings.Replace(pair.Symbol, "_", "", 1))
			entry, ok = allEntries[compressed]
		}
		if !ok {
			// Try Kraken's X/Z-prefixed internal names (e.g. "XXBTZUSD").
			parts := strings.SplitN(pair.Symbol, "_", 2)
			if len(parts) == 2 {
				xBase := "X" + parts[0]
				zQuote := "Z" + parts[1]
				entry, ok = allEntries[xBase+zQuote]
				if !ok {
					entry, ok = allEntries["X"+parts[0]+"Z"+parts[1]]
				}
			}
		}
		if !ok {
			// Last resort: case-insensitive scan.
			ws2 := strings.ToUpper(strings.Replace(pair.Symbol, "_", "", 1))
			for key, e := range allEntries {
				if strings.ToUpper(strings.Replace(key, "/", "", 1)) == ws2 {
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
