import { useState } from 'react';
import CoinIcon from '../../components/CoinIcon';
import PriceChartModal from '../../components/modals/PriceChartModal';
import PriceSparkline from '../../components/PriceSparkline';
import { formatMarketPriceTimestamp, formatNativeMarketPrice } from '../../utils/market';

function ExchangeMarketTable({
  currentExchange,
  exchangesDb,
  compactMode,
  selectedExchangeFiatPairs,
  filteredExchangeFiatPairs,
  sortedExchangeFiatPairs,
  exchangeMarketSearchQuery,
  setExchangeMarketSearchQuery,
  selectedExchangeMarketPairs,
  exchangeMarketRefreshCycle,
  errorExchangeMarketData,
  loadingExchangeMarketData,
  allVisibleExchangeMarketRowsSelected,
  selectedExchangeMarketRows,
  onExportMarketCsv,
  onMarketSort,
  getMarketSortIndicator,
  getMarketRow,
  getMarketRowKey,
  onToggleMarketRow,
  onToggleAllVisibleMarketRows
}) {
  const [priceChartContext, setPriceChartContext] = useState(null);
  const handleExportExchangeMarketCsv = onExportMarketCsv;
  const handleExchangeMarketSort = onMarketSort;
  const getExchangeMarketSortIndicator = getMarketSortIndicator;
  const getExchangeMarketRow = getMarketRow;
  const getExchangeMarketRowKey = getMarketRowKey;
  const toggleExchangeMarketRowSelection = onToggleMarketRow;
  const toggleAllVisibleExchangeMarketRows = onToggleAllVisibleMarketRows;

  return (
    <>
              {/* Fiat Pairs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pair Token / Fiat dari Database
                    </h4>
                    <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: '800' }}>
                      {filteredExchangeFiatPairs.length}/{selectedExchangeFiatPairs.length} pair
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={exchangeMarketSearchQuery}
                      onChange={(e) => setExchangeMarketSearchQuery(e.target.value)}
                      placeholder="Search pair/token/status..."
                      style={{
                        width: '220px',
                        maxWidth: '42vw',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                    {selectedExchangeMarketPairs.length > 0 && (
                      <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontWeight: '800' }}>
                        {selectedExchangeMarketPairs.length} selected
                      </span>
                    )}
                    <button
                      onClick={handleExportExchangeMarketCsv}
                      disabled={selectedExchangeMarketPairs.length === 0}
                      className="tab-btn"
                      style={{
                        padding: '7px 10px',
                        fontSize: '12px',
                        backgroundColor: selectedExchangeMarketPairs.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.14)',
                        color: selectedExchangeMarketPairs.length === 0 ? 'var(--md-sys-color-on-surface-variant)' : '#10b981',
                        border: selectedExchangeMarketPairs.length === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,185,129,0.25)',
                        cursor: selectedExchangeMarketPairs.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '800'
                      }}
                    >
                      Export CSV
                    </button>
                    <div
                      key={exchangeMarketRefreshCycle}
                      title="Auto refresh setiap 10 detik"
                      style={{
                        width: '30px',
                        height: '30px',
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <svg viewBox="0 0 32 32" style={{ width: '30px', height: '30px' }}>
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="3"
                        />
                        <circle
                          className="market-refresh-ring-progress"
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="var(--md-sys-color-primary)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="75.4"
                          strokeDashoffset="75.4"
                        />
                      </svg>
                      <span style={{
                        position: 'absolute',
                        fontSize: '8px',
                        fontWeight: '800',
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        10s
                      </span>
                    </div>
                  </div>
                </div>
                {errorExchangeMarketData && (
                  <div style={{ padding: '10px 12px', marginBottom: '8px', border: '1px solid var(--md-sys-color-error)', borderRadius: '8px', color: 'var(--md-sys-color-error)', fontSize: '12px', backgroundColor: 'rgba(239,83,80,0.08)' }}>
                    Gagal memuat harga market: {errorExchangeMarketData}
                  </div>
                )}
                {selectedExchangeFiatPairs.length === 0 ? (
                  <div style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    Tidak ada pair token / fiat yang terdaftar di database untuk bursa ini.
                  </div>
                ) : filteredExchangeFiatPairs.length === 0 ? (
                  <div style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    Tidak ada pair yang cocok dengan pencarian.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <table className={`exchange-market-table ${compactMode ? 'compact-table' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '10px 12px', width: '36px' }}>
                            <input
                              type="checkbox"
                              checked={allVisibleExchangeMarketRowsSelected}
                              onChange={toggleAllVisibleExchangeMarketRows}
                              aria-label="Select all visible market rows"
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('baseToken')}>Base Token {getExchangeMarketSortIndicator('baseToken')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('last')}>Last / Mid {getExchangeMarketSortIndicator('last')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', minWidth: '132px' }}>1 Jam</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('bid')}>Bid {getExchangeMarketSortIndicator('bid')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('ask')}>Ask {getExchangeMarketSortIndicator('ask')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('quantity')}>Bid / Ask Qty {getExchangeMarketSortIndicator('quantity')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('timestamp')}>Waktu Harga {getExchangeMarketSortIndicator('timestamp')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedExchangeFiatPairs.map((pair) => {
                          const market = getExchangeMarketRow(pair);
                          const marketStatus = market?.status || (loadingExchangeMarketData ? 'loading' : 'pending');
                          const hasUsableMarketPrice = market && (marketStatus === 'success' || marketStatus === 'stale');
                          const quoteSymbol = market?.nativeCurrency || pair.quoteToken?.symbol || 'IDR';
                          const lastOrMid = hasUsableMarketPrice ? (market?.mid ?? market?.last ?? market?.price ?? null) : null;
                          const bid = hasUsableMarketPrice ? (market?.bid ?? market?.nativeBid ?? null) : null;
                          const ask = hasUsableMarketPrice ? (market?.ask ?? market?.nativeAsk ?? null) : null;
                          const priceTimestamp = market?.priceTimestamp || market?.timestamp || null;
                          const rowKey = getExchangeMarketRowKey(pair);
                          const isSelected = selectedExchangeMarketRows.has(rowKey);
                          const statusLabel = marketStatus === 'loading'
                            ? '...'
                            : marketStatus === 'success'
                              ? null
                              : marketStatus;
                          const statusTitle = market?.message || market?.error || marketStatus;

                          return (
                          <tr key={pair.id || pair.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: isSelected ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExchangeMarketRowSelection(pair)}
                                aria-label={`Select ${pair.symbol}`}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div className="exchange-market-token-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', fontWeight: '700' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <CoinIcon symbol={pair.baseToken?.symbol} size={18} />
                                  <span>{pair.baseToken?.symbol || '-'}</span>
                                  <span className="exchange-market-token-name" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500', fontSize: '11px' }}>
                                    {pair.baseToken?.name || ''}
                                  </span>
                                </div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  color: '#ffffff',
                                  fontFamily: 'Consolas, Monaco, monospace',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  lineHeight: 1.4,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {pair.symbol}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#ffffff' }}>
                              {loadingExchangeMarketData && !market ? '...' : (
                                statusLabel ? (
                                  <span title={statusTitle} style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '11px', textTransform: 'uppercase' }}>
                                    {statusLabel}
                                  </span>
                                ) : formatNativeMarketPrice(lastOrMid, quoteSymbol)
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {loadingExchangeMarketData && !market ? '...' : (
                                <button
                                  type="button"
                                  className="price-sparkline-button"
                                  onClick={() => setPriceChartContext({
                                    pair,
                                    market,
                                    quoteSymbol,
                                    currentExchange,
                                    exchangesDb
                                  })}
                                  aria-label={`Buka detail chart harga ${pair.symbol}`}
                                  title={`Buka detail chart harga ${pair.symbol}`}
                                >
                                  <PriceSparkline history={hasUsableMarketPrice ? market?.history : []} />
                                </button>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-primary)', fontWeight: '700' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatNativeMarketPrice(bid, quoteSymbol)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-profit-green)', fontWeight: '700' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatNativeMarketPrice(ask, quoteSymbol)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '11px' }}>
                              {hasUsableMarketPrice ? `${market.bidQty ?? '-'} / ${market.askQty ?? '-'}` : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatMarketPriceTimestamp(priceTimestamp)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <PriceChartModal
                context={priceChartContext}
                onClose={() => setPriceChartContext(null)}
              />
    </>
  );
}

export default ExchangeMarketTable;
