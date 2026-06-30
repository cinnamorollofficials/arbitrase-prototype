package exchanges

import (
	"context"
	"net/http"
	"strings"

	"arbitrase/price-worker/internal/market"
)

type Reku struct {
	client *http.Client
}

type rekuBidAsk struct {
	AccountID jsonNumber `json:"accid"`
	Code      string     `json:"code"`
	Bid       jsonNumber `json:"bid"`
	Ask       jsonNumber `json:"ask"`
}

func NewReku(client *http.Client) *Reku {
	return &Reku{client: client}
}

func (r *Reku) Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick {
	var response []rekuBidAsk
	if err := getJSON(ctx, r.client, "https://api.reku.id/v2/bidask", &response); err != nil {
		return errorTicks(pairs, "reku_bidask", err.Error())
	}

	quoteByCode := make(map[string]rekuBidAsk, len(response))
	for _, row := range response {
		code := strings.ToUpper(strings.TrimSpace(row.Code))
		if code == "" {
			continue
		}
		quoteByCode[code] = row
	}

	ticks := make([]market.MarketTick, 0, len(pairs))
	fetchedAt := market.NowMillis()
	for _, pair := range pairs {
		row, ok := quoteByCode[strings.ToUpper(pair.BaseToken.Symbol)]
		if !ok {
			ticks = append(ticks, emptyTick(pair, "reku_bidask", "pair not found", fetchedAt))
			continue
		}

		bid := row.Bid.FloatPtr()
		ask := row.Ask.FloatPtr()
		mid := market.MidFromBidAsk(bid, ask)

		status := "success"
		var errPtr *string
		if bid == nil && ask == nil {
			status = "empty"
			errPtr = market.StringPtr("bidask has no numeric bid or ask")
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
			Mid:            mid,
			NativeCurrency: pair.QuoteToken.Symbol,
			Source:         "reku_bidask",
			Status:         status,
			Error:          errPtr,
			PriceTimestamp: fetchedAt,
			FetchedAt:      fetchedAt,
		})
	}

	return ticks
}
