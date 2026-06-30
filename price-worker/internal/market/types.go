package market

import "time"

type Token struct {
	ID     int64  `json:"id"`
	Symbol string `json:"symbol"`
	Name   string `json:"name"`
}

type TokenPair struct {
	ID           int64  `json:"id"`
	ExchangeID   int64  `json:"exchangeId"`
	ExchangeName string `json:"exchangeName"`
	Symbol       string `json:"symbol"`
	BaseToken    Token  `json:"baseToken"`
	QuoteToken   Token  `json:"quoteToken"`
}

type MarketTick struct {
	ExchangeID     int64    `json:"exchangeId"`
	ExchangeName   string   `json:"exchangeName"`
	PairID         int64    `json:"pairId"`
	Symbol         string   `json:"symbol"`
	BaseSymbol     string   `json:"baseSymbol"`
	QuoteSymbol    string   `json:"quoteSymbol"`
	Bid            *float64 `json:"bid"`
	Ask            *float64 `json:"ask"`
	Last           *float64 `json:"last"`
	Mid            *float64 `json:"mid"`
	BidQty         *float64 `json:"bidQty"`
	AskQty         *float64 `json:"askQty"`
	NativeCurrency string   `json:"nativeCurrency"`
	Source         string   `json:"source"`
	Status         string   `json:"status"`
	Error          *string  `json:"error"`
	PriceTimestamp int64    `json:"priceTimestamp"`
	FetchedAt      int64    `json:"fetchedAt"`
}

type HistoryPoint struct {
	T     int64    `json:"t"`
	Price float64  `json:"price"`
	Bid   *float64 `json:"bid"`
	Ask   *float64 `json:"ask"`
}

func NowMillis() int64 {
	return time.Now().UnixMilli()
}

func FloatPtr(value float64) *float64 {
	return &value
}

func StringPtr(value string) *string {
	return &value
}

func MidFromBidAsk(bid, ask *float64) *float64 {
	if bid == nil || ask == nil {
		return nil
	}
	return FloatPtr((*bid + *ask) / 2)
}

func PriceForHistory(tick MarketTick) (float64, bool) {
	if tick.Mid != nil && *tick.Mid > 0 {
		return *tick.Mid, true
	}
	if tick.Last != nil && *tick.Last > 0 {
		return *tick.Last, true
	}
	return 0, false
}
