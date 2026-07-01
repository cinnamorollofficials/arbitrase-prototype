package exchanges

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"arbitrase/price-worker/internal/market"
)

type Bittime struct {
	client      *http.Client
	concurrency int
}

type bittimeDepthResponse struct {
	LastUpdateID jsonNumber          `json:"lastUpdateId"`
	CurrentSeqID jsonNumber          `json:"currentSeqId"`
	Bids         [][]json.RawMessage `json:"bids"`
	Asks         [][]json.RawMessage `json:"asks"`
}

func NewBittime(client *http.Client, concurrency int) *Bittime {
	if concurrency < 1 {
		concurrency = 1
	}
	return &Bittime{client: client, concurrency: concurrency}
}

func (b *Bittime) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	ticks := make([]market.MarketTick, len(pairs))
	sem := make(chan struct{}, b.concurrency)
	var wg sync.WaitGroup

	for index, pair := range pairs {
		index := index
		pair := pair
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			ticks[index] = b.fetchPair(ctx, pair)
		}()
	}

	wg.Wait()
	return ticks
}

func (b *Bittime) fetchPair(ctx context.Context, pair market.TokenPair) market.MarketTick {
	nativeSymbol := bittimeNativeSymbol(pair)
	endpoint := fmt.Sprintf("https://openapi.bittime.com/api/v1/depth?symbol=%s&limit=5", url.QueryEscape(nativeSymbol))
	var response bittimeDepthResponse
	fetchedAt := market.NowMillis()
	if err := getJSON(ctx, b.client, endpoint, &response); err != nil {
		return market.MarketTick{
			ExchangeID:     pair.ExchangeID,
			ExchangeName:   pair.ExchangeName,
			PairID:         pair.ID,
			Symbol:         pair.Symbol,
			BaseSymbol:     pair.BaseToken.Symbol,
			QuoteSymbol:    pair.QuoteToken.Symbol,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         "bittime_depth",
			Status:         "error",
			Error:          market.StringPtr(err.Error()),
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		}
	}

	bid := parseBittimeDepthNumber(response.Bids, 0)
	bidQty := parseBittimeDepthNumber(response.Bids, 1)
	ask := parseBittimeDepthNumber(response.Asks, 0)
	askQty := parseBittimeDepthNumber(response.Asks, 1)
	mid := market.MidFromBidAsk(bid, ask)

	timestamp := normalizeTimestamp(response.LastUpdateID.Int64(), fetchedAt)
	if timestamp == fetchedAt {
		timestamp = normalizeTimestamp(response.CurrentSeqID.Int64(), fetchedAt)
	}

	status := "success"
	var errPtr *string
	if bid == nil && ask == nil {
		status = "empty"
		errPtr = market.StringPtr("order book has no numeric bid or ask")
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
		Source:         "bittime_depth",
		Status:         status,
		Error:          errPtr,
		PriceTimestamp: timestamp,
		FetchedAt:      fetchedAt,
	}
}

func bittimeNativeSymbol(pair market.TokenPair) string {
	base := strings.ToUpper(strings.TrimSpace(pair.BaseToken.Symbol))
	quote := strings.ToUpper(strings.TrimSpace(pair.QuoteToken.Symbol))
	if base != "" && quote != "" {
		return base + quote
	}
	return strings.ReplaceAll(strings.ToUpper(strings.TrimSpace(pair.Symbol)), "_", "")
}

func parseBittimeDepthNumber(rows [][]json.RawMessage, index int) *float64 {
	if len(rows) == 0 || len(rows[0]) <= index {
		return nil
	}

	var asString string
	if err := json.Unmarshal(rows[0][index], &asString); err == nil {
		parsed, err := strconv.ParseFloat(strings.TrimSpace(asString), 64)
		if err != nil {
			return nil
		}
		return market.FloatPtr(parsed)
	}

	var asFloat float64
	if err := json.Unmarshal(rows[0][index], &asFloat); err == nil {
		return market.FloatPtr(asFloat)
	}

	return nil
}
