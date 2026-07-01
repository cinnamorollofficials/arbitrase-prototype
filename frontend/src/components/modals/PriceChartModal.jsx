import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getExchangeMarketData } from '../../api/exchanges';
import { formatMarketPriceTimestamp, formatNativeMarketPrice, normalizeMarketSymbol } from '../../utils/market';

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

const COMPARE_COLORS = ['#60a5fa', '#f59e0b', '#a78bfa', '#f472b6', '#22d3ee'];

function getPairKeyFromTokens(baseSymbol, quoteSymbol) {
  if (!baseSymbol || !quoteSymbol) return '';
  return `${String(baseSymbol).toUpperCase()}_${String(quoteSymbol).toUpperCase()}`;
}

function getPairKey(pair) {
  return getPairKeyFromTokens(pair?.baseToken?.symbol, pair?.quoteToken?.symbol)
    || normalizeMarketSymbol(pair?.symbol || '');
}

function getMatchingTokenPair(exchange, pair) {
  const targetKey = getPairKey(pair);
  return (exchange?.tokenPairs || []).find((candidatePair) => getPairKey(candidatePair) === targetKey) || null;
}

function getMatchingMarketRow(rows, pair) {
  const targetKey = getPairKey(pair);

  return (rows || []).find((row) => {
    if (getPairKey(row) === targetKey) return true;
    return normalizeMarketSymbol(row?.symbol || '') === normalizeMarketSymbol(pair?.symbol || '');
  }) || null;
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
  const [selectedCompareExchangeIds, setSelectedCompareExchangeIds] = useState([]);
  const [compareRowsByExchangeId, setCompareRowsByExchangeId] = useState({});
  const [loadingCompareByExchangeId, setLoadingCompareByExchangeId] = useState({});
  const [errorCompareByExchangeId, setErrorCompareByExchangeId] = useState({});
  const mountedRef = useRef(false);
  const pendingCompareRequestsRef = useRef(new Set());
  const latestCompareContextRef = useRef({ currentExchangeId: '', pairKey: '' });
  const currentExchangeId = context?.currentExchange?.id ? String(context.currentExchange.id) : '';
  const pairKey = getPairKey(context?.pair);

  const compareExchangeOptions = useMemo(() => {
    if (!context?.pair) return [];

    return (context?.exchangesDb || [])
      .filter((exchange) => String(exchange.id) !== currentExchangeId)
      .filter((exchange) => getMatchingTokenPair(exchange, context.pair))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id-ID', {
        sensitivity: 'base'
      }));
  }, [context, currentExchangeId]);

  useEffect(() => {
    latestCompareContextRef.current = { currentExchangeId, pairKey };
    pendingCompareRequestsRef.current.clear();
    setSelectedCompareExchangeIds([]);
    setCompareRowsByExchangeId({});
    setLoadingCompareByExchangeId({});
    setErrorCompareByExchangeId({});
  }, [currentExchangeId, pairKey]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  useEffect(() => {
    if (!context?.pair || selectedCompareExchangeIds.length === 0) return undefined;

    const missingExchangeIds = selectedCompareExchangeIds.filter((exchangeId) => {
      return !compareRowsByExchangeId[exchangeId] && !pendingCompareRequestsRef.current.has(exchangeId);
    });

    missingExchangeIds.forEach(async (exchangeId) => {
      const requestContext = { currentExchangeId, pairKey };
      pendingCompareRequestsRef.current.add(exchangeId);
      setLoadingCompareByExchangeId((current) => ({ ...current, [exchangeId]: true }));
      setErrorCompareByExchangeId((current) => {
        const next = { ...current };
        delete next[exchangeId];
        return next;
      });

      try {
        const data = await getExchangeMarketData(exchangeId);
        const rows = Array.isArray(data.data)
          ? data.data
          : (Array.isArray(data.marketData) ? data.marketData : []);
        const matchingRow = getMatchingMarketRow(rows, context.pair);

        if (
          !mountedRef.current
          || latestCompareContextRef.current.currentExchangeId !== requestContext.currentExchangeId
          || latestCompareContextRef.current.pairKey !== requestContext.pairKey
        ) {
          return;
        }

        setCompareRowsByExchangeId((current) => ({
          ...current,
          [exchangeId]: matchingRow || { status: 'pending', history: [] }
        }));
      } catch (err) {
        if (
          !mountedRef.current
          || latestCompareContextRef.current.currentExchangeId !== requestContext.currentExchangeId
          || latestCompareContextRef.current.pairKey !== requestContext.pairKey
        ) {
          return;
        }

        setErrorCompareByExchangeId((current) => ({
          ...current,
          [exchangeId]: err.message || 'Gagal memuat data pembanding'
        }));
      } finally {
        pendingCompareRequestsRef.current.delete(exchangeId);

        if (
          mountedRef.current
          && latestCompareContextRef.current.currentExchangeId === requestContext.currentExchangeId
          && latestCompareContextRef.current.pairKey === requestContext.pairKey
        ) {
          setLoadingCompareByExchangeId((current) => {
            const next = { ...current };
            delete next[exchangeId];
            return next;
          });
        }
      }
    });
  }, [compareRowsByExchangeId, context, currentExchangeId, pairKey, selectedCompareExchangeIds]);

  if (!context) return null;

  const { pair, market, quoteSymbol } = context;
  const primaryPrices = points.map((point) => point.price);
  const firstPrice = points[0]?.price ?? null;
  const latestPrice = points[points.length - 1]?.price ?? null;
  const primaryMinPrice = primaryPrices.length ? Math.min(...primaryPrices) : null;
  const primaryMaxPrice = primaryPrices.length ? Math.max(...primaryPrices) : null;
  const averagePrice = primaryPrices.length ? primaryPrices.reduce((sum, price) => sum + price, 0) / primaryPrices.length : null;
  const changePct = firstPrice && latestPrice ? ((latestPrice - firstPrice) / firstPrice) * 100 : 0;
  const trendColor = changePct > 0 ? '#10b981' : changePct < 0 ? '#ef5350' : '#94a3b8';
  const compareSeries = selectedCompareExchangeIds.map((exchangeId, index) => {
    const exchange = compareExchangeOptions.find((item) => String(item.id) === String(exchangeId));
    const row = compareRowsByExchangeId[exchangeId];

    return {
      id: exchangeId,
      name: exchange?.name || `Exchange ${exchangeId}`,
      color: COMPARE_COLORS[index % COMPARE_COLORS.length],
      points: normalizeHistory(row?.history),
      status: row?.status || 'pending',
      loading: Boolean(loadingCompareByExchangeId[exchangeId]),
      error: errorCompareByExchangeId[exchangeId] || null
    };
  });
  const allSeries = [
    {
      id: 'primary',
      name: context.currentExchange?.name || 'Exchange utama',
      color: trendColor,
      points,
      status: market?.status || 'success',
      loading: false,
      error: null
    },
    ...compareSeries
  ];
  const allPoints = allSeries.flatMap((series) => series.points);
  const prices = allPoints.map((point) => point.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const range = maxPrice !== null && minPrice !== null ? maxPrice - minPrice || Math.max(maxPrice * 0.0001, 1) : 1;
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
    ['High', formatNativeMarketPrice(primaryMaxPrice, quoteSymbol)],
    ['Low', formatNativeMarketPrice(primaryMinPrice, quoteSymbol)],
    ['Average', formatNativeMarketPrice(averagePrice, quoteSymbol)]
  ];
  const chartWidth = 920;
  const chartHeight = 420;
  const chartPadding = { top: 18, right: 8, bottom: 86, left: 78 };
  const chartInnerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const chartInnerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const getChartX = (index) => chartPadding.left + (points.length > 1 ? (chartInnerWidth / (points.length - 1)) * index : chartInnerWidth / 2);
  const getChartY = (price) => chartPadding.top + chartInnerHeight - ((price - minPrice) / range) * chartInnerHeight;
  const getSeriesX = (seriesPoints, index) => chartPadding.left + (seriesPoints.length > 1 ? (chartInnerWidth / (seriesPoints.length - 1)) * index : chartInnerWidth / 2);
  const getSeriesPath = (seriesPoints) => seriesPoints.map((point, index) => {
    const x = getSeriesX(seriesPoints, index).toFixed(2);
    const y = getChartY(point.price).toFixed(2);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: chartPadding.top + chartInnerHeight * ratio,
    price: (maxPrice ?? 0) - range * ratio
  }));
  const tickCount = Math.min(7, points.length);
  const xAxisTicks = Array.from({ length: tickCount }, (_, index) => {
    const pointIndex = tickCount === 1 ? 0 : Math.round((index / (tickCount - 1)) * (points.length - 1));
    return {
      index: pointIndex,
      point: points[pointIndex]
    };
  }).filter((tick, index, ticks) => ticks.findIndex((item) => item.index === tick.index) === index);
  const availableCompareOptions = compareExchangeOptions.filter((exchange) => {
    return !selectedCompareExchangeIds.includes(String(exchange.id));
  });
  const addCompareExchange = (exchangeId) => {
    if (!exchangeId) return;
    setSelectedCompareExchangeIds((current) => current.includes(exchangeId) ? current : [...current, exchangeId]);
  };
  const removeCompareExchange = (exchangeId) => {
    setSelectedCompareExchangeIds((current) => current.filter((id) => id !== exchangeId));
  };

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

        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', backgroundColor: '#0f172a', border: '1px solid rgba(148, 163, 184, 0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
              Compare
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '11px', fontWeight: 800 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: trendColor }} />
              {context.currentExchange?.name || 'Exchange utama'}
            </span>
            {compareSeries.map((series) => (
              <button
                key={series.id}
                type="button"
                onClick={() => removeCompareExchange(series.id)}
                title="Hapus compare"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '999px',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  backgroundColor: 'rgba(15, 23, 42, 0.88)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: series.color }} />
                {series.name}
                {series.loading ? ' (loading)' : ''}
                {series.error ? ' (error)' : ''}
                <span style={{ color: '#94a3b8' }}>×</span>
              </button>
            ))}
          </div>
          {compareExchangeOptions.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              Tidak ada exchange lain untuk pair ini.
            </span>
          ) : (
            <select
              value=""
              onChange={(event) => addCompareExchange(event.target.value)}
              disabled={availableCompareOptions.length === 0}
              style={{
                minWidth: '220px',
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                backgroundColor: '#111827',
                color: availableCompareOptions.length === 0 ? '#64748b' : '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                outline: 'none',
                cursor: availableCompareOptions.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="">{availableCompareOptions.length === 0 ? 'Semua exchange sudah dipilih' : 'Tambah exchange pembanding'}</option>
              {availableCompareOptions.map((exchange) => (
                <option key={exchange.id} value={String(exchange.id)}>
                  {exchange.name}
                </option>
              ))}
            </select>
          )}
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
                  {allSeries.map((series) => {
                    if (series.points.length < 2) return null;

                    return (
                      <path
                        key={series.id}
                        d={getSeriesPath(series.points)}
                        fill="none"
                        stroke={series.color}
                        strokeWidth={series.id === 'primary' ? '2.5' : '2'}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={series.id === 'primary' ? 1 : 0.88}
                      />
                    );
                  })}
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
