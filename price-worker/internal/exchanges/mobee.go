package exchanges

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"strconv"
	"strings"

	"arbitrase/price-worker/internal/market"
)

type Mobee struct {
	client      *http.Client
	apiKey      string
	apiSecret   string
	concurrency int
}

type mobeeSummaryResponse map[string]any

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

	const path = "/v1/markets/summary"
	var response mobeeSummaryResponse
	fetchedAt := market.NowMillis()

	if err := getJSONWithHeaders(ctx, m.client, "https://open-api.mobee.io"+path, m.signedHeaders(http.MethodGet, path), &response); err != nil {
		return errorTicks(pairs, "mobee_market_summary", err.Error())
	}

	marketByPair := make(map[string]any)
	for _, row := range extractMobeeSummaryRows(response) {
		pairSymbol := firstJSONString(row, "__pair", "pair", "symbol", "market", "marketSymbol", "market_symbol")
		if pairSymbol == "" {
			base := firstJSONString(row, "base", "baseAsset", "base_asset", "baseCurrency", "base_currency")
			quote := firstJSONString(row, "quote", "quoteAsset", "quote_asset", "quoteCurrency", "quote_currency")
			if base != "" && quote != "" {
				pairSymbol = base + "_" + quote
			}
		}
		if pairSymbol == "" {
			continue
		}
		marketByPair[normalizeMobeePair(pairSymbol)] = row
	}

	ticks := make([]market.MarketTick, 0, len(pairs))
	for _, pair := range pairs {
		row, ok := marketByPair[normalizeMobeePair(pair.Symbol)]
		if !ok {
			ticks = append(ticks, emptyTick(pair, "mobee_market_summary", "pair not found", fetchedAt))
			continue
		}
		ticks = append(ticks, m.tickFromSummary(pair, row, fetchedAt))
	}

	return ticks
}

func (m *Mobee) tickFromSummary(pair market.TokenPair, row any, fetchedAt int64) market.MarketTick {
	bid := firstJSONNumber(row, "bid", "highestBid", "highest_bid", "bestBid", "best_bid", "buy")
	ask := firstJSONNumber(row, "ask", "lowestAsk", "lowest_ask", "bestAsk", "best_ask", "sell")
	last := firstJSONNumber(row, "last", "price", "lastPrice", "last_price", "latestPrice", "latest_price", "close")
	bidQty := firstJSONNumber(row, "bidQty", "bidQuantity", "bid_qty", "bidSize", "bid_size")
	askQty := firstJSONNumber(row, "askQty", "askQuantity", "ask_qty", "askSize", "ask_size")
	mid := market.MidFromBidAsk(bid, ask)
	if mid == nil && last != nil {
		mid = market.FloatPtr(*last)
	}

	status := "success"
	var errPtr *string
	if bid == nil && ask == nil && last == nil {
		status = "empty"
		errPtr = market.StringPtr("summary has no numeric bid, ask, or last")
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
		Last:           last,
		Mid:            mid,
		BidQty:         bidQty,
		AskQty:         askQty,
		NativeCurrency: pair.QuoteToken.Symbol,
		Source:         "mobee_market_summary",
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
		ticks = append(ticks, UnsupportedTick(pair, "mobee_market_summary", message))
	}
	return ticks
}

func extractMobeeSummaryRows(value any) []any {
	switch typed := value.(type) {
	case []any:
		rows := make([]any, 0, len(typed))
		for _, item := range typed {
			rows = append(rows, extractMobeeSummaryRows(item)...)
		}
		return rows
	case map[string]any:
		if firstJSONString(typed, "__pair", "pair", "symbol", "market", "marketSymbol", "market_symbol") != "" {
			return []any{typed}
		}
		var rows []any
		for key, item := range typed {
			if nested, ok := item.(map[string]any); ok && looksLikeMobeePairKey(key) {
				row := make(map[string]any, len(nested)+1)
				for nestedKey, nestedValue := range nested {
					row[nestedKey] = nestedValue
				}
				row["__pair"] = key
				rows = append(rows, row)
				continue
			}
			rows = append(rows, extractMobeeSummaryRows(item)...)
		}
		return rows
	default:
		return nil
	}
}

func firstJSONString(value any, keys ...string) string {
	normalized := make(map[string]struct{}, len(keys))
	for _, key := range keys {
		normalized[normalizeJSONKey(key)] = struct{}{}
	}
	return findJSONString(value, normalized)
}

func findJSONString(value any, keys map[string]struct{}) string {
	switch typed := value.(type) {
	case map[string]any:
		for key, nested := range typed {
			if _, ok := keys[normalizeJSONKey(key)]; ok {
				if parsed, ok := nested.(string); ok {
					return strings.TrimSpace(parsed)
				}
			}
		}
		for _, nested := range typed {
			if parsed := findJSONString(nested, keys); parsed != "" {
				return parsed
			}
		}
	case []any:
		for _, nested := range typed {
			if parsed := findJSONString(nested, keys); parsed != "" {
				return parsed
			}
		}
	}
	return ""
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

func normalizeMobeePair(value string) string {
	normalized := strings.ReplaceAll(strings.ReplaceAll(strings.ToUpper(strings.TrimSpace(value)), "-", "_"), "/", "_")
	if strings.HasPrefix(normalized, "IDR_") {
		return strings.TrimPrefix(normalized, "IDR_") + "_IDR"
	}
	return normalized
}

func looksLikeMobeePairKey(value string) bool {
	normalized := strings.ReplaceAll(strings.ReplaceAll(strings.ToUpper(strings.TrimSpace(value)), "-", "_"), "/", "_")
	return strings.Contains(normalized, "_")
}
