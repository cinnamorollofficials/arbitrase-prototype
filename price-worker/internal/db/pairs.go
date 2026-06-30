package db

import (
	"context"

	"arbitrase/price-worker/internal/market"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) LoadFiatPairs(ctx context.Context) ([]market.TokenPair, error) {
	const query = `
		SELECT
			tp.id,
			tp.exchange_id,
			e.name,
			tp.symbol,
			bt.id,
			bt.symbol,
			bt.name,
			qt.id,
			qt.symbol,
			qt.name
		FROM token_pairs tp
		JOIN exchanges e ON e.id = tp.exchange_id
		JOIN tokens bt ON bt.id = tp.base_token_id
		JOIN tokens qt ON qt.id = tp.quote_token_id
		WHERE tp.is_active = TRUE
			AND e.is_active = TRUE
			AND qt.symbol IN ('IDR', 'USD')
		ORDER BY e.name ASC, tp.symbol ASC`

	rows, err := s.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pairs []market.TokenPair
	for rows.Next() {
		var pair market.TokenPair
		if err := rows.Scan(
			&pair.ID,
			&pair.ExchangeID,
			&pair.ExchangeName,
			&pair.Symbol,
			&pair.BaseToken.ID,
			&pair.BaseToken.Symbol,
			&pair.BaseToken.Name,
			&pair.QuoteToken.ID,
			&pair.QuoteToken.Symbol,
			&pair.QuoteToken.Name,
		); err != nil {
			return nil, err
		}
		pairs = append(pairs, pair)
	}

	return pairs, rows.Err()
}
