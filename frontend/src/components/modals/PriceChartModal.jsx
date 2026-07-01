import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatMarketPriceTimestamp, formatNativeMarketPrice } from '../../utils/market';

function normalizeHistory(history) {
  return Array.isArray(history)
    ? history
        .map((point) => ({
          t: Number(point.t),
          price: Number(point.price)
        }))
        .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.price) && point.price > 0)
        .sort((a, b) => a.t - b.t)
    : [];
}

function PriceChartModal({ context, onClose }) {
  const points = useMemo(() => normalizeHistory(context?.market?.history), [context]);

  useEffect(() => {
    if (!context) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [context]);

  useEffect(() => {
    if (!context) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [context, onClose]);

  if (!context) return null;

  const { pair, market, quoteSymbol } = context;
  const prices = points.map((point) => point.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const range = maxPrice && minPrice ? maxPrice - minPrice || Math.max(maxPrice * 0.0001, 1) : 1;
  const firstPrice = points[0]?.price ?? null;
  const latestPrice = points[points.length - 1]?.price ?? null;
  const averagePrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
  const changePct = firstPrice && latestPrice ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
  const trendColor = changePct > 0 ? '#10b981' : changePct < 0 ? '#ef5350' : '#94a3b8';
  const startedAt = points[0]?.t ? new Date(points[0].t).toLocaleString('id-ID') : '-';
  const endedAt = points[points.length - 1]?.t ? new Date(points[points.length - 1].t).toLocaleString('id-ID') : '-';
  const latestTimestamp = market?.priceTimestamp || market?.timestamp || points[points.length - 1]?.t || null;
  const latestValue = market?.mid ?? market?.last ?? market?.price ?? latestPrice;

  const metrics = [
    ['Last / Mid', formatNativeMarketPrice(latestValue, quoteSymbol)],
    ['Bid', formatNativeMarketPrice(market?.bid ?? market?.nativeBid ?? null, quoteSymbol)],
    ['Ask', formatNativeMarketPrice(market?.ask ?? market?.nativeAsk ?? null, quoteSymbol)],
    ['High', formatNativeMarketPrice(maxPrice, quoteSymbol)],
    ['Low', formatNativeMarketPrice(minPrice, quoteSymbol)],
    ['Average', formatNativeMarketPrice(averagePrice, quoteSymbol)]
  ];

  const modalContent = (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        overscrollBehavior: 'contain',
        touchAction: 'none'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-chart-modal-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(920px, 100%)',
          maxHeight: '88vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          touchAction: 'auto',
          boxSizing: 'border-box',
          backgroundColor: '#111827',
          color: '#f8fafc',
          border: '1px solid rgba(148, 163, 184, 0.24)',
          borderRadius: '14px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.55)',
          padding: '22px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(148, 163, 184, 0.18)' }}>
          <div>
            <h2 id="price-chart-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              Detail Chart Harga {pair?.symbol || '-'}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              {pair?.baseToken?.symbol || '-'} / {pair?.quoteToken?.symbol || quoteSymbol || '-'} · {points.length} titik harga · {startedAt} - {endedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail chart harga"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              backgroundColor: '#1f2937',
              color: '#ffffff',
              fontSize: '20px',
              lineHeight: 1,
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px', marginTop: '16px' }}>
          {metrics.map(([label, value]) => (
            <div key={label} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ marginTop: '5px', fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#0b1120', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
          {points.length < 2 ? (
            <div style={{ minHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Belum ada cukup titik harga untuk menampilkan chart detail.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '12px', color: '#94a3b8', fontSize: '11px' }}>
                <span>High {formatNativeMarketPrice(maxPrice, quoteSymbol)}</span>
                <span>Low {formatNativeMarketPrice(minPrice, quoteSymbol)}</span>
              </div>
              <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '12px 0', borderTop: '1px solid rgba(148, 163, 184, 0.12)', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', pointerEvents: 'none' }}>
                {points.map((point, index) => {
                  const heightPct = 10 + ((point.price - minPrice) / range) * 90;
                  const isLast = index === points.length - 1;

                  return (
                    <div
                      key={`${point.t}-${index}`}
                      style={{
                        flex: '1 1 0',
                        minWidth: '4px',
                        height: `${heightPct}%`,
                        borderRadius: '6px 6px 2px 2px',
                        backgroundColor: isLast ? trendColor : 'rgba(96, 165, 250, 0.58)',
                        boxShadow: isLast ? `0 0 0 1px ${trendColor}` : 'none'
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '10px', color: '#94a3b8', fontSize: '11px' }}>
                <span>{startedAt}</span>
                <span>{endedAt}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
          <span style={{ color: trendColor, fontWeight: 800 }}>
            Perubahan: {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
          </span>
          <span>Update terakhir: {formatMarketPriceTimestamp(latestTimestamp)}</span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default PriceChartModal;
