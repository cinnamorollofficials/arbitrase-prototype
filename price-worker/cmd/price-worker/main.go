package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"arbitrase/price-worker/internal/config"
	"arbitrase/price-worker/internal/db"
	"arbitrase/price-worker/internal/redisstore"
	"arbitrase/price-worker/internal/scheduler"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()

	dbStore, err := db.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect postgres failed: %v", err)
	}
	defer dbStore.Close()

	redisStore, err := redisstore.New(ctx, cfg.RedisURL, cfg.HistoryTTL, cfg.HistoryMaxPoints)
	if err != nil {
		log.Fatalf("connect redis failed: %v", err)
	}
	defer redisStore.Close()

	log.Printf("price worker started poll_interval=%s history_ttl=%s", cfg.PollInterval, cfg.HistoryTTL)
	scheduler.New(cfg, dbStore, redisStore).Run(ctx)
	log.Printf("price worker stopped")
}
