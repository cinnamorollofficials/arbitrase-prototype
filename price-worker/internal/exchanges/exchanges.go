package exchanges

import (
	"context"
	"net/http"

	"arbitrase/price-worker/internal/market"
)

type Fetcher interface {
	Fetch(ctx context.Context, pairs []market.TokenPair) []market.MarketTick
}

func SupportedFetchers(client *http.Client, tokocryptoConcurrency int) map[string]Fetcher {
	return map[string]Fetcher{
		"Indodax":    NewIndodax(client),
		"Tokocrypto": NewTokocrypto(client, tokocryptoConcurrency),
	}
}

func UnsupportedTick(pair market.TokenPair, source string, message string) market.MarketTick {
	now := market.NowMillis()
	return market.MarketTick{
		ExchangeID:     pair.ExchangeID,
		ExchangeName:   pair.ExchangeName,
		PairID:         pair.ID,
		Symbol:         pair.Symbol,
		BaseSymbol:     pair.BaseToken.Symbol,
		QuoteSymbol:    pair.QuoteToken.Symbol,
		NativeCurrency: pair.QuoteToken.Symbol,
		Source:         source,
		Status:         "unsupported",
		Error:          market.StringPtr(message),
		PriceTimestamp: now,
		FetchedAt:      now,
	}
}
