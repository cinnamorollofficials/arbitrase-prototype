package exchanges

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"arbitrase/price-worker/internal/market"
)

type Mobee struct {
	client      *http.Client
	apiKey      string
	apiSecret   string
	concurrency int
}

type mobeeBidAskResponse map[string]any

func NewMobee(client *http.Client, apiKey string, apiSecret string, concurrency int) *Mobee {
	if concurrency < 1 {
		concurrency = 1
	}
	return &Mobee{
		client:      client,
		apiKey:      strings.TrimSpace(apiKey),
		apiSecret:   strings.TrimSpace(apiSecret),
		concurrency: concurrency,
	}
}

func (m *Mobee) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	if m.apiKey == "" {
		return unsupportedMobeeTicks(pairs, "MOBEE_API_KEY is not configured")
	}
	if m.apiSecret == "" {
		return unsupportedMobeeTicks(pairs, "MOBEE_API_SECRET is not configured")
	}

	ticks := make([]market.MarketTick, len(pairs))
	sem := make(chan struct{}, m.concurrency)
	var wg sync.WaitGroup

	for index, pair := range pairs {
		index := index
		pair := pair
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			ticks[index] = m.fetchPair(ctx, pair)
		}()
	}

	wg.Wait()
	return ticks
}

func (m *Mobee) fetchPair(ctx context.Context, pair market.TokenPair) market.MarketTick {
	mobeePair := strings.ReplaceAll(pair.Symbol, "_", "-")
	path := fmt.Sprintf("/v1/markets/%s/bid-ask-price", url.PathEscape(mobeePair))
	endpoint := "https://open-api.mobee.io" + path
	var response mobeeBidAskResponse
	fetchedAt := market.NowMillis()

	if err := getJSONWithHeaders(ctx, m.client, endpoint, m.signedHeaders(http.MethodGet, path), &response); err != nil {
		return market.MarketTick{
			ExchangeID:     pair.ExchangeID,
			ExchangeName:   pair.ExchangeName,
			PairID:         pair.ID,
			Symbol:         pair.Symbol,
			BaseSymbol:     pair.BaseToken.Symbol,
			QuoteSymbol:    pair.QuoteToken.Symbol,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         "mobee_bid_ask_price",
			Status:         "error",
			Error:          market.StringPtr(err.Error()),
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		}
	}

	bid := firstJSONNumber(response, "bid", "highestBid", "highest_bid", "bestBid", "best_bid", "buy")
	ask := firstJSONNumber(response, "ask", "lowestAsk", "lowest_ask", "bestAsk", "best_ask", "sell")
	bidQty := firstJSONNumber(response, "bidQty", "bidQuantity", "bid_qty", "bidSize", "bid_size")
	askQty := firstJSONNumber(response, "askQty", "askQuantity", "ask_qty", "askSize", "ask_size")
	mid := market.MidFromBidAsk(bid, ask)

	status := "success"
	var errPtr *string
	if bid == nil && ask == nil {
		status = "empty"
		errPtr = market.StringPtr("bid ask response has no numeric bid or ask")
	}

	return market.MarketTick{
		ExchangeID:     pair.ExchangeID,
		ExchangeName:   pair.ExchangeName,
		PairID:         pair.ID,
		Symbol:         pair.Symbol,
		BaseSymbol:     pair.BaseToken.Symbol,
		QuoteSymbol:    pair.QuoteToken.Symbol,
		Bid:            bid,
		Ask:            ask,
		Mid:            mid,
		BidQty:         bidQty,
		AskQty:         askQty,
		NativeCurrency: pair.QuoteToken.Symbol,
		Source:         "mobee_bid_ask_price",
		Status:         status,
		Error:          errPtr,
		PriceTimestamp: fetchedAt,
		FetchedAt:      fetchedAt,
	}
}

func (m *Mobee) signedHeaders(method string, path string) map[string]string {
	timestamp := strconv.FormatInt(market.NowMillis()/1000, 10)
	payload := strings.Join([]string{method, path, timestamp}, "\n")
	mac := hmac.New(sha256.New, []byte(m.apiSecret))
	_, _ = mac.Write([]byte(payload))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	return map[string]string{
		"X-API-Key":           m.apiKey,
		"X-Request-Signature": signature,
		"X-Request-Timestamp": timestamp,
	}
}

func unsupportedMobeeTicks(pairs []market.TokenPair, message string) []market.MarketTick {
	ticks := make([]market.MarketTick, 0, len(pairs))
	for _, pair := range pairs {
		ticks = append(ticks, UnsupportedTick(pair, "mobee_bid_ask_price", message))
	}
	return ticks
}

func firstJSONNumber(value any, keys ...string) *float64 {
	normalized := make(map[string]struct{}, len(keys))
	for _, key := range keys {
		normalized[normalizeJSONKey(key)] = struct{}{}
	}
	return findJSONNumber(value, normalized)
}

func findJSONNumber(value any, keys map[string]struct{}) *float64 {
	switch typed := value.(type) {
	case map[string]any:
		for key, nested := range typed {
			if _, ok := keys[normalizeJSONKey(key)]; ok {
				if parsed := numberFromAny(nested); parsed != nil {
					return parsed
				}
			}
		}
		for _, nested := range typed {
			if parsed := findJSONNumber(nested, keys); parsed != nil {
				return parsed
			}
		}
	case []any:
		for _, nested := range typed {
			if parsed := findJSONNumber(nested, keys); parsed != nil {
				return parsed
			}
		}
	}
	return nil
}

func numberFromAny(value any) *float64 {
	switch typed := value.(type) {
	case float64:
		return market.FloatPtr(typed)
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(typed), 64)
		if err != nil {
			return nil
		}
		return market.FloatPtr(parsed)
	case jsonNumber:
		return typed.FloatPtr()
	default:
		return nil
	}
}

func normalizeJSONKey(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "_", "")
	value = strings.ReplaceAll(value, "-", "")
	return value
}
