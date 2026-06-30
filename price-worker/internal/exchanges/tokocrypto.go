package exchanges

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"sync"

	"arbitrase/price-worker/internal/market"
)

type Tokocrypto struct {
	client      *http.Client
	concurrency int
}

type tokocryptoDepthResponse struct {
	Data struct {
		Bids [][]string `json:"bids"`
		Asks [][]string `json:"asks"`
		Time jsonNumber `json:"time"`
		Ts   jsonNumber `json:"ts"`
	} `json:"data"`
	Timestamp jsonNumber `json:"timestamp"`
	Ts        jsonNumber `json:"ts"`
}

func NewTokocrypto(client *http.Client, concurrency int) *Tokocrypto {
	if concurrency < 1 {
		concurrency = 1
	}
	return &Tokocrypto{client: client, concurrency: concurrency}
}

func (t *Tokocrypto) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	ticks := make([]market.MarketTick, len(pairs))
	sem := make(chan struct{}, t.concurrency)
	var wg sync.WaitGroup

	for index, pair := range pairs {
		index := index
		pair := pair
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			ticks[index] = t.fetchPair(ctx, pair)
		}()
	}

	wg.Wait()
	return ticks
}

func (t *Tokocrypto) fetchPair(ctx context.Context, pair market.TokenPair) market.MarketTick {
	endpoint := fmt.Sprintf("https://www.tokocrypto.com/open/v1/market/depth?symbol=%s&limit=5", url.QueryEscape(pair.Symbol))
	var response tokocryptoDepthResponse
	fetchedAt := market.NowMillis()
	if err := getJSON(ctx, t.client, endpoint, &response); err != nil {
		return market.MarketTick{
			ExchangeID:     pair.ExchangeID,
			ExchangeName:   pair.ExchangeName,
			PairID:         pair.ID,
			Symbol:         pair.Symbol,
			BaseSymbol:     pair.BaseToken.Symbol,
			QuoteSymbol:    pair.QuoteToken.Symbol,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         "tokocrypto_depth",
			Status:         "error",
			Error:          market.StringPtr(err.Error()),
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		}
	}

	bid := parseDepthNumber(response.Data.Bids, 0)
	bidQty := parseDepthNumber(response.Data.Bids, 1)
	ask := parseDepthNumber(response.Data.Asks, 0)
	askQty := parseDepthNumber(response.Data.Asks, 1)
	mid := market.MidFromBidAsk(bid, ask)

	timestamp := normalizeTimestamp(response.Data.Time.Int64(), fetchedAt)
	if timestamp == fetchedAt {
		timestamp = normalizeTimestamp(response.Data.Ts.Int64(), fetchedAt)
	}
	if timestamp == fetchedAt {
		timestamp = normalizeTimestamp(response.Timestamp.Int64(), fetchedAt)
	}
	if timestamp == fetchedAt {
		timestamp = normalizeTimestamp(response.Ts.Int64(), fetchedAt)
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
		Source:         "tokocrypto_depth",
		Status:         status,
		Error:          errPtr,
		PriceTimestamp: timestamp,
		FetchedAt:      fetchedAt,
	}
}

func parseDepthNumber(rows [][]string, index int) *float64 {
	if len(rows) == 0 || len(rows[0]) <= index {
		return nil
	}
	parsed, err := strconv.ParseFloat(rows[0][index], 64)
	if err != nil {
		return nil
	}
	return market.FloatPtr(parsed)
}
