import CoinIcon from '../../components/CoinIcon';
import ExchangeIcon from '../../components/ExchangeIcon';
import { TX_STEPS } from '../../constants/transactions';
import { formatRupiah } from '../../utils/formatters';

function PricesPage(props) {
  const {
    activeSymbol,
    handleAssetChange,
    error,
    loading,
    prices,
    compactMode,
    stats,
    usdToIdrRate,
    capital,
    setShowConfirmModal,
    activeTab,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    sortedPrices,
    handleSort,
    getSortIndicator,
    setSelectedExchange,
    setShowExchangeModal,
    handleInspectRawPrice,
    filteredOpportunities,
  } = props;

  return (
    <>
      {/* Main Table Section */}
      {activeTab === 'prices' && (
        <div className="md3-card table-card">
          <div className="table-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h2 className="table-title" style={{ margin: 0 }}>Perbandingan Order Book CEX & DEX</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={filter === 'PROFITABLE' ? "Cari koin/bursa..." : "Cari bursa/pair..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    fontSize: '13px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    color: '#ffffff',
                    outline: 'none',
                    width: '180px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.width = '240px';
                    e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.width = '180px';
                    e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                <svg 
                  style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>

              {/* Filter Tabs */}
              <div className="tabs-container" style={{ margin: 0 }}>
                <button
                  className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setFilter('ALL')}
                >
                  Semua
                </button>
                <button
                  className={`tab-btn ${filter === 'CEX' ? 'active' : ''}`}
                  onClick={() => setFilter('CEX')}
                >
                  CEX
                </button>
                <button
                  className={`tab-btn ${filter === 'DEX' ? 'active' : ''}`}
                  onClick={() => setFilter('DEX')}
                >
                  DEX
                </button>
                <button
                  className={`tab-btn ${filter === 'LOCAL' ? 'active' : ''}`}
                  onClick={() => setFilter('LOCAL')}
                >
                  Indonesia
                </button>
                <button
                  className={`tab-btn ${filter === 'PROFITABLE' ? 'active' : ''}`}
                  onClick={() => setFilter('PROFITABLE')}
                >
                  Paling Untung
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className={`table-wrapper ${compactMode ? 'compact-table' : ''}`}>
            {filter === 'PROFITABLE' ? (
              <table className="md3-table">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Aset Koin</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Kategori</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Beli di Bursa Murah</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Jual di Bursa Mahal</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Spread Kotor</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Estimasi Net Profit</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500' }}>
                        <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔍</span>
                        Tidak ada peluang arbitrase yang menghasilkan profit dari seluruh koin saat ini.
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map(opp => {
                      const coinInfo = COIN_META_LOOKUP[opp.symbol] || { name: opp.symbol, category: 'FLUKTUATIF' };
                      const netProfit = (capital * (opp.spread / 100)) - (capital * 0.002); // gross - approx 0.2% buy/sell fees

                      return (
                        <tr key={opp.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          {/* Coin symbol & icon */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <CoinIcon symbol={opp.symbol} size={compactMode ? 20 : 28} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{opp.symbol}</span>
                                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>{coinInfo.name}</span>
                              </div>
                            </div>
                          </td>
                          {/* Category badge */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              backgroundColor: coinInfo.category === 'MICIN' ? 'rgba(244,63,94,0.15)' : coinInfo.category === 'STABLE' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                              color: coinInfo.category === 'MICIN' ? '#f43f5e' : coinInfo.category === 'STABLE' ? '#10b981' : '#3b82f6'
                            }}>
                              {coinInfo.category}
                            </span>
                          </td>
                          {/* Buy route */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '700', color: 'var(--md-sys-color-on-surface)' }}>{opp.buyEx}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>${opp.buyPrice.toFixed(5)}</span>
                            </div>
                          </td>
                          {/* Sell route */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '700', color: 'var(--md-sys-color-on-surface)' }}>{opp.sellEx}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>${opp.sellPrice.toFixed(5)}</span>
                            </div>
                          </td>
                          {/* Spread */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'right', fontWeight: '800', color: 'var(--color-profit-green)', fontSize: '14px' }}>
                            +{opp.spread.toFixed(2)}%
                          </td>
                          {/* Net profit estimate */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'right', fontWeight: '800', color: netProfit > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)', fontSize: '14px' }}>
                            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                            <div style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {formatRupiah(netProfit, usdToIdrRate)}
                            </div>
                          </td>
                          {/* Action button */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                handleAssetChange(opp.symbol);
                                setTimeout(() => setShowConfirmModal(true), 250);
                              }}
                              className="tab-btn"
                              style={{
                                backgroundColor: 'var(--md-sys-color-primary)',
                                color: 'var(--md-sys-color-on-primary)',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 14px',
                                borderRadius: 'var(--md-shape-corner-medium)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Eksekusi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="md3-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                      Bursa / Exchange {getSortIndicator('name')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pair')}>
                      Pasangan {getSortIndicator('pair')}
                    </th>
                    <th>
                      Sumber Data
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('ask')}>
                      Beli (Ask) {getSortIndicator('ask')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('bid')}>
                      Jual (Bid) {getSortIndicator('bid')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('deviation')}>
                      Deviasi Rata-Rata (Last) {getSortIndicator('deviation')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                      Status {getSortIndicator('status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && prices.length === 0 ? (
                    // Table Loading Skeletons
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '70px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '18px' }}></div></td>
                        <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                      </tr>
                    ))
                  ) : sortedPrices.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500' }}>
                        🔍 Tidak ada peluang arbitrase yang menghasilkan profit untuk koin {activeSymbol} saat ini.
                      </td>
                    </tr>
                  ) : (
                    sortedPrices.map((item) => {
                      const isLowestAsk = stats.lowestAsk && stats.lowestAsk.name === item.name;
                      const isHighestBid = stats.highestBid && stats.highestBid.name === item.name;

                      // Calculate deviation of last price from average
                      let deviation = 0;
                      if (item.price && stats.average) {
                        deviation = ((item.price - stats.average) / stats.average) * 100;
                      }

                      return (
                        <tr
                          key={item.name}
                          style={{
                            backgroundColor: isLowestAsk
                              ? 'rgba(52, 211, 153, 0.03)'
                              : isHighestBid
                                ? 'rgba(248, 113, 113, 0.03)'
                                : 'transparent'
                          }}
                        >
                          {/* Exchange Name & Type */}
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                              <button
                                onClick={() => {
                                  setSelectedExchange(item.name);
                                  setShowExchangeModal(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  font: 'inherit',
                                  color: 'var(--md-sys-color-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  textDecoration: 'underline'
                                }}
                              >
                                {item.name}
                              </button>
                              <span className={`badge ${item.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {item.type}
                              </span>
                            </div>
                          </td>

                          {/* Trading Pair */}
                          <td style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {item.pair}
                          </td>

                          {/* Data Source */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {item.source === 'direct' ? (
                                  <span style={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}>Direct API</span>
                                ) : item.source === 'coingecko' ? (
                                  <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '12px' }}>CoinGecko</span>
                                ) : item.source === 'dexscreener' ? (
                                  <span style={{ color: '#3b82f6', fontWeight: '600', fontSize: '12px' }}>DexScreener</span>
                                ) : (
                                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>-</span>
                                )}
                                <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.85 }}>
                                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : (lastUpdated ? lastUpdated.toLocaleTimeString() : '-')}
                                </span>
                              </div>
                              {item.status === 'success' && (
                                <button
                                  onClick={() => handleInspectRawPrice(item.name, activeSymbol)}
                                  title="Lihat Detail JSON Mentah (Redis)"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = 1}
                                  onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                >
                                  📄
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Ask Price (Buy Price) */}
                          <td>
                            {item.status === 'success' && item.ask !== null ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {item.nativeCurrency === 'IDR' ? (
                                  <>
                                    <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit', fontWeight: '700' }}>
                                      Rp {item.nativeAsk?.toLocaleString('id-ID')}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      ${item.ask.toFixed(5)} USD
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit', fontWeight: '700' }}>
                                      ${item.ask.toFixed(5)}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      {formatRupiah(item.ask, usdToIdrRate)}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--md-sys-color-error)', fontStyle: 'italic' }}>
                                Error
                              </span>
                            )}
                          </td>

                          {/* Bid Price (Sell Price) */}
                          <td>
                            {item.status === 'success' && item.bid !== null ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {item.nativeCurrency === 'IDR' ? (
                                  <>
                                    <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit', fontWeight: '700' }}>
                                      Rp {item.nativeBid?.toLocaleString('id-ID')}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      ${item.bid.toFixed(5)} USD
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit', fontWeight: '700' }}>
                                      ${item.bid.toFixed(5)}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      {formatRupiah(item.bid, usdToIdrRate)}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--md-sys-color-error)', fontStyle: 'italic' }}>
                                Error
                              </span>
                            )}
                          </td>

                          {/* Average Deviation */}
                          <td>
                            {item.status === 'success' && item.price !== null ? (
                              <span className={`deviation-tag ${deviation >= 0 ? 'positive' : 'negative'}`}>
                                {deviation >= 0 ? '+' : ''}{deviation.toFixed(4)}%
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Action / Indicators */}
                          <td>
                            {item.status === 'success' ? (
                              isLowestAsk ? (
                                <span className="price-badge lowest">Beli Terendah (Ask)</span>
                              ) : isHighestBid ? (
                                <span className="price-badge highest">Jual Tertinggi (Bid)</span>
                              ) : (
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Stabil</span>
                              )
                            ) : (
                              <span style={{ color: 'var(--md-sys-color-error)', fontSize: '12px' }} title={item.message}>
                                Offline
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Antrean Transaksi Tab Content */}

    </>
  );
}

export default PricesPage;
