package scheduler

import (
	"context"
	"log"
	"net/http"
	"sort"
	"time"

	"arbitrase/price-worker/internal/config"
	"arbitrase/price-worker/internal/db"
	"arbitrase/price-worker/internal/exchanges"
	"arbitrase/price-worker/internal/market"
	"arbitrase/price-worker/internal/redisstore"
)

type Scheduler struct {
	config   config.Config
	db       *db.Store
	redis    *redisstore.Store
	fetchers map[string]exchanges.Fetcher
}

func New(cfg config.Config, dbStore *db.Store, redisStore *redisstore.Store) *Scheduler {
	client := &http.Client{Timeout: cfg.HTTPTimeout}
	return &Scheduler{
		config:   cfg,
		db:       dbStore,
		redis:    redisStore,
		fetchers: exchanges.SupportedFetchers(client, cfg.TokocryptoConcurrency, cfg.MobeeAPIKey, cfg.MobeeConcurrency),
	}
}

func (s *Scheduler) Run(ctx context.Context) {
	s.poll(ctx)

	ticker := time.NewTicker(s.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.poll(ctx)
		}
	}
}

func (s *Scheduler) poll(ctx context.Context) {
	pairs, err := s.db.LoadFiatPairs(ctx)
	if err != nil {
		log.Printf("load fiat pairs failed: %v", err)
		return
	}

	grouped := groupByExchange(pairs)
	exchangeNames := make([]string, 0, len(grouped))
	for exchangeName := range grouped {
		exchangeNames = append(exchangeNames, exchangeName)
	}
	sort.Strings(exchangeNames)

	totalSaved := 0
	for _, exchangeName := range exchangeNames {
		pairs := grouped[exchangeName]
		fetcher, ok := s.fetchers[exchangeName]
		if !ok {
			continue
		}

		ticks := fetcher.Fetch(ctx, pairs)
		for _, tick := range ticks {
			if err := s.redis.SaveTick(ctx, tick); err != nil {
				log.Printf("save tick failed exchange=%s pair=%s: %v", tick.ExchangeName, tick.Symbol, err)
				continue
			}
			totalSaved++
		}
	}

	log.Printf("poll complete supported_exchanges=%d ticks_saved=%d", len(s.fetchers), totalSaved)
}

func groupByExchange(pairs []market.TokenPair) map[string][]market.TokenPair {
	grouped := make(map[string][]market.TokenPair)
	for _, pair := range pairs {
		grouped[pair.ExchangeName] = append(grouped[pair.ExchangeName], pair)
	}
	return grouped
}
