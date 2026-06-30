package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	DatabaseURL           string
	RedisURL              string
	PollInterval          time.Duration
	HistoryTTL            time.Duration
	HistoryMaxPoints      int64
	StaleAfter            time.Duration
	TokocryptoConcurrency int
	HTTPTimeout           time.Duration
}

func Load() Config {
	return Config{
		DatabaseURL:           databaseURL(),
		RedisURL:              envString("REDIS_URL", "redis://127.0.0.1:6379"),
		PollInterval:          time.Duration(envInt("POLL_INTERVAL_SECONDS", 10)) * time.Second,
		HistoryTTL:            time.Duration(envInt("HISTORY_TTL_SECONDS", 3600)) * time.Second,
		HistoryMaxPoints:      int64(envInt("HISTORY_MAX_POINTS", 360)),
		StaleAfter:            time.Duration(envInt("STALE_AFTER_SECONDS", 30)) * time.Second,
		TokocryptoConcurrency: envInt("TOKOCRYPTO_CONCURRENCY", 5),
		HTTPTimeout:           time.Duration(envInt("HTTP_TIMEOUT_SECONDS", 5)) * time.Second,
	}
}

func databaseURL() string {
	if value := os.Getenv("DATABASE_URL"); value != "" {
		return value
	}

	user := envString("DB_USER", "postgres")
	password := os.Getenv("DB_PASSWORD")
	host := envString("DB_HOST", "127.0.0.1")
	port := envString("DB_PORT", "5432")
	name := envString("DB_NAME", "arbitrage_db")
	sslMode := "disable"
	if os.Getenv("DB_SSL") == "true" {
		sslMode = "require"
	}

	if password == "" {
		return fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=%s", user, host, port, name, sslMode)
	}
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", user, password, host, port, name, sslMode)
}

func envString(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func envInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
