package exchanges

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"arbitrase/price-worker/internal/market"
)

type Indodax struct {
	client *http.Client
}

type indodaxTickerAllResponse struct {
	Tickers    map[string]indodaxTicker `json:"tickers"`
	ServerTime jsonNumber               `json:"server_time"`
}

type indodaxTicker struct {
	Buy        jsonNumber `json:"buy"`
	Sell       jsonNumber `json:"sell"`
	Last       jsonNumber `json:"last"`
	ServerTime jsonNumber `json:"server_time"`
	Timestamp  jsonNumber `json:"timestamp"`
}

func NewIndodax(client *http.Client) *Indodax {
	return &Indodax{client: client}
}

func (i *Indodax) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	var response indodaxTickerAllResponse
	if err := getJSON(ctx, i.client, "https://indodax.com/api/ticker_all", &response); err != nil {
		return errorTicks(pairs, "indodax_ticker_all", err.Error())
	}

	ticks := make([]market.MarketTick, 0, len(pairs))
	fetchedAt := market.NowMillis()
	for _, pair := range pairs {
		ticker, ok := response.Tickers[strings.ToLower(pair.Symbol)]
		if !ok {
			ticks = append(ticks, emptyTick(pair, "indodax_ticker_all", "pair not found", fetchedAt))
			continue
		}

		bid := ticker.Buy.FloatPtr()
		ask := ticker.Sell.FloatPtr()
		last := ticker.Last.FloatPtr()
		mid := market.MidFromBidAsk(bid, ask)
		if mid == nil && last != nil {
			mid = market.FloatPtr(*last)
		}

		timestamp := normalizeTimestamp(ticker.ServerTime.Int64(), fetchedAt)
		if timestamp == fetchedAt {
			timestamp = normalizeTimestamp(ticker.Timestamp.Int64(), fetchedAt)
		}
		if timestamp == fetchedAt {
			timestamp = normalizeTimestamp(response.ServerTime.Int64(), fetchedAt)
		}

		status := "success"
		var errPtr *string
		if bid == nil && ask == nil && last == nil {
			status = "empty"
			errPtr = market.StringPtr("ticker has no numeric price")
		}

		ticks = append(ticks, market.MarketTick{
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
			Source:         "indodax_ticker_all",
			Status:         status,
			Error:          errPtr,
			PriceTimestamp: timestamp,
			FetchedAt:      fetchedAt,
		})
	}

	return ticks
}

type jsonNumber string

func (n *jsonNumber) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		*n = ""
		return nil
	}

	var asString string
	if err := json.Unmarshal(data, &asString); err == nil {
		*n = jsonNumber(asString)
		return nil
	}

	var asFloat float64
	if err := json.Unmarshal(data, &asFloat); err == nil {
		*n = jsonNumber(strconv.FormatFloat(asFloat, 'f', -1, 64))
		return nil
	}

	*n = ""
	return nil
}

func (n jsonNumber) FloatPtr() *float64 {
	value := strings.TrimSpace(string(n))
	if value == "" {
		return nil
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return nil
	}
	return market.FloatPtr(parsed)
}

func (n jsonNumber) Int64() int64 {
	value := strings.TrimSpace(string(n))
	if value == "" {
		return 0
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err == nil {
		return parsed
	}
	floatValue, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0
	}
	return int64(floatValue)
}

func normalizeTimestamp(value int64, fallback int64) int64 {
	if value <= 0 {
		return fallback
	}
	if value < 10000000000 {
		return value * 1000
	}
	return value
}

func errorTicks(pairs []market.TokenPair, source string, message string) []market.MarketTick {
	fetchedAt := market.NowMillis()
	ticks := make([]market.MarketTick, 0, len(pairs))
	for _, pair := range pairs {
		ticks = append(ticks, market.MarketTick{
			ExchangeID:     pair.ExchangeID,
			ExchangeName:   pair.ExchangeName,
			PairID:         pair.ID,
			Symbol:         pair.Symbol,
			BaseSymbol:     pair.BaseToken.Symbol,
			QuoteSymbol:    pair.QuoteToken.Symbol,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         source,
			Status:         "error",
			Error:          market.StringPtr(message),
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		})
	}
	return ticks
}

func emptyTick(pair market.TokenPair, source string, message string, fetchedAt int64) market.MarketTick {
	return market.MarketTick{
		ExchangeID:     pair.ExchangeID,
		ExchangeName:   pair.ExchangeName,
		PairID:         pair.ID,
		Symbol:         pair.Symbol,
		BaseSymbol:     pair.BaseToken.Symbol,
		QuoteSymbol:    pair.QuoteToken.Symbol,
		NativeCurrency: pair.QuoteToken.Symbol,
		Source:         source,
		Status:         "empty",
		Error:          market.StringPtr(message),
		PriceTimestamp: fetchedAt,
		FetchedAt:      fetchedAt,
	}
}
