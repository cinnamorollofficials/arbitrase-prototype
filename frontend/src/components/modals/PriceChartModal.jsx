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

function formatTimeLabel(timestamp) {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatDurationLabel(startTimestamp, endTimestamp) {
  if (!startTimestamp || !endTimestamp) return '0 jam';

  const durationMs = Math.max(0, endTimestamp - startTimestamp);
  const totalMinutes = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

function formatXAxisLabel(timestamp, durationMs) {
  if (!timestamp) return '-';
  const date = new Date(timestamp);

  if (durationMs >= 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short'
    });
  }

  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
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
  const firstTimestamp = points[0]?.t ?? null;
  const lastTimestamp = points[points.length - 1]?.t ?? null;
  const middleTimestamp = points[Math.floor(points.length / 2)]?.t ?? null;
  const durationMs = firstTimestamp && lastTimestamp ? Math.max(0, lastTimestamp - firstTimestamp) : 0;
  const durationLabel = formatDurationLabel(firstTimestamp, lastTimestamp);
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
  const chartWidth = 920;
  const chartHeight = 420;
  const chartPadding = { top: 18, right: 8, bottom: 86, left: 78 };
  const chartInnerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const chartInnerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const getChartX = (index) => chartPadding.left + (points.length > 1 ? (chartInnerWidth / (points.length - 1)) * index : chartInnerWidth / 2);
  const getChartY = (price) => chartPadding.top + chartInnerHeight - ((price - minPrice) / range) * chartInnerHeight;
  const wavePath = points.map((point, index) => {
    const x = getChartX(index).toFixed(2);
    const y = getChartY(point.price).toFixed(2);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: chartPadding.top + chartInnerHeight * ratio,
    price: maxPrice - range * ratio
  }));
  const tickCount = Math.min(7, points.length);
  const xAxisTicks = Array.from({ length: tickCount }, (_, index) => {
    const pointIndex = tickCount === 1 ? 0 : Math.round((index / (tickCount - 1)) * (points.length - 1));
    return {
      index: pointIndex,
      point: points[pointIndex]
    };
  }).filter((tick, index, ticks) => ticks.findIndex((item) => item.index === tick.index) === index);

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
          width: 'min(1080px, 100%)',
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

        <div style={{ marginTop: '16px', padding: '10px', borderRadius: '12px', backgroundColor: '#0b1120', border: '1px solid rgba(148, 163, 184, 0.14)' }}>
          {points.length < 2 ? (
            <div style={{ minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Belum ada cukup titik harga untuk menampilkan chart detail.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#94a3b8', fontSize: '11px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(148, 163, 184, 0.14)', fontWeight: 800 }}>
                    Rentang {durationLabel}
                  </span>
                  <span style={{ padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(15, 23, 42, 0.88)', border: '1px solid rgba(148, 163, 184, 0.14)', fontWeight: 800 }}>
                    {points.length} harga
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>High {formatNativeMarketPrice(maxPrice, quoteSymbol)}</span>
                  <span>Low {formatNativeMarketPrice(minPrice, quoteSymbol)}</span>
                </div>
              </div>
              <div style={{ height: '420px', padding: 0, pointerEvents: 'none' }}>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  aria-hidden="true"
                  style={{ display: 'block', width: '100%', height: '100%' }}
                >
                  <rect
                    x={chartPadding.left}
                    y={chartPadding.top}
                    width={chartInnerWidth}
                    height={chartInnerHeight}
                    fill="#111827"
                  />
                  {gridLines.map(({ y }) => (
                    <g key={y}>
                      <line
                        x1={chartPadding.left}
                        x2={chartWidth - chartPadding.right}
                        y1={y}
                        y2={y}
                        stroke="rgba(148, 163, 184, 0.13)"
                        strokeWidth="1"
                      />
                    </g>
                  ))}
                  <path
                    d={wavePath}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {xAxisTicks.map(({ index, point }) => {
                    const x = getChartX(index);
                    const y = chartPadding.top + chartInnerHeight + 28;

                    return (
                      <text
                        key={`${point.t}-${index}`}
                        x={x}
                        y={y}
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="end"
                        transform={`rotate(-45 ${x} ${y})`}
                      >
                        {formatXAxisLabel(point.t, durationMs)}
                      </text>
                    );
                  })}
                  {gridLines.map(({ y, price }) => (
                    <g key={`label-${y}`}>
                      <text
                        x={chartPadding.left - 8}
                        y={y + 3}
                        fill="#cbd5e1"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="end"
                      >
                        {formatNativeMarketPrice(price, quoteSymbol)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '4px', color: '#94a3b8', fontSize: '11px' }}>
                <span>Mulai {formatTimeLabel(firstTimestamp)}</span>
                <span>Tengah {formatTimeLabel(middleTimestamp)}</span>
                <span>Akhir {formatTimeLabel(lastTimestamp)}</span>
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
