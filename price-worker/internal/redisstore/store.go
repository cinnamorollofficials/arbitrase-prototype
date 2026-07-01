package redisstore

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"arbitrase/price-worker/internal/market"
	"github.com/redis/go-redis/v9"
)

type Store struct {
	client                *redis.Client
	historyTTL            time.Duration
	historySampleInterval time.Duration
	historyMaxPoints      int64
}

func New(ctx context.Context, redisURL string, historyTTL time.Duration, historySampleInterval time.Duration, historyMaxPoints int64) (*Store, error) {
	options, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	client := redis.NewClient(options)
	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, err
	}
	return &Store{
		client:                client,
		historyTTL:            historyTTL,
		historySampleInterval: historySampleInterval,
		historyMaxPoints:      historyMaxPoints,
	}, nil
}

func (s *Store) Close() error {
	return s.client.Close()
}

func LatestKey(exchangeID, pairID int64) string {
	return fmt.Sprintf("market:latest:%d:%d", exchangeID, pairID)
}

func HistoryKey(exchangeID, pairID int64) string {
	return fmt.Sprintf("market:history:%d:%d", exchangeID, pairID)
}

func (s *Store) SaveTick(ctx context.Context, tick market.MarketTick) error {
	latestPayload, err := json.Marshal(tick)
	if err != nil {
		return err
	}

	pipe := s.client.TxPipeline()
	pipe.Set(ctx, LatestKey(tick.ExchangeID, tick.PairID), latestPayload, s.historyTTL)

	if tick.Status == "success" {
		if price, ok := market.PriceForHistory(tick); ok {
			point := market.HistoryPoint{
				T:     tick.PriceTimestamp,
				Price: price,
				Bid:   tick.Bid,
				Ask:   tick.Ask,
			}
			historyPayload, err := json.Marshal(point)
			if err != nil {
				return err
			}
			historyKey := HistoryKey(tick.ExchangeID, tick.PairID)
			if s.shouldSaveHistoryPoint(ctx, historyKey, point.T) {
				pipe.LPush(ctx, historyKey, historyPayload)
				pipe.LTrim(ctx, historyKey, 0, s.historyMaxPoints-1)
				pipe.Expire(ctx, historyKey, s.historyTTL)
			}
		}
	}

	_, err = pipe.Exec(ctx)
	return err
}

func (s *Store) shouldSaveHistoryPoint(ctx context.Context, historyKey string, timestamp int64) bool {
	if s.historySampleInterval <= 0 {
		return true
	}

	latestPayload, err := s.client.LIndex(ctx, historyKey, 0).Result()
	if err == redis.Nil || err != nil {
		return true
	}

	var latest market.HistoryPoint
	if err := json.Unmarshal([]byte(latestPayload), &latest); err != nil {
		return true
	}

	if latest.T <= 0 || timestamp <= 0 {
		return true
	}

	return timestamp-latest.T >= s.historySampleInterval.Milliseconds()
}
