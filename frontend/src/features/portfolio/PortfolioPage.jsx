import CoinIcon from '../../components/CoinIcon';
import ExchangeIcon from '../../components/ExchangeIcon';
import { TX_STEPS } from '../../constants/transactions';
import { formatRupiah } from '../../utils/formatters';

function PortfolioPage(props) {
  const {
    compactMode,
    usdToIdrRate,
    activeTab,
    filter,
    hoveredExchange,
    setHoveredExchange,
    coinAssets,
    searchQueryPortfolio,
    setSearchQueryPortfolio,
  } = props;

  return (
    <>
      {activeTab === 'portfolio' && (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar Aset Koin & Estimasi Portofolio</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Nilai total kepemilikan koin dari seluruh bursa yang terintegrasi beserta alokasi distribusinya.
              </p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari koin/kategori..."
                value={searchQueryPortfolio}
                onChange={(e) => setSearchQueryPortfolio(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  fontSize: '12px',
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
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Koin</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Kategori</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Harga Pasar (USD)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Total Saldo</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Total Nilai Aset</th>
                </tr>
              </thead>
              <tbody>
                {coinAssets
                  .filter(coin => {
                    const q = searchQueryPortfolio.toLowerCase().trim();
                    if (!q) return true;
                    return coin.symbol.toLowerCase().includes(q) || 
                           coin.name.toLowerCase().includes(q) ||
                           (coin.category && coin.category.toLowerCase().includes(q));
                  })
                  .map((coin) => {
                  const totalValUsd = coin.total * coin.price;
                  const hoverKey = `coin-${coin.symbol}`;

                  return (
                    <tr
                      key={coin.symbol}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Koin Name */}
                      <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CoinIcon symbol={coin.symbol} size={compactMode ? 20 : 28} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{coin.symbol}</span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>{coin.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          fontSize: '9px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          backgroundColor: coin.category === 'MICIN' ? 'rgba(244,63,94,0.15)' : coin.category === 'STABLE' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                          color: coin.category === 'MICIN' ? '#f43f5e' : coin.category === 'STABLE' ? '#10b981' : '#3b82f6'
                        }}>
                          {coin.category}
                        </span>
                      </td>

                      {/* Harga Pasar */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span>${coin.price >= 0.01 ? coin.price.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : coin.price.toFixed(7)}</span>
                          <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {formatRupiah(coin.price, usdToIdrRate)}
                          </span>
                        </div>
                      </td>

                      {/* Total Saldo */}
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600' }}>
                        {coin.total.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {coin.symbol}
                      </td>

                      {/* Total Nilai Aset + Tooltip Info Icon */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: '700', color: 'var(--md-sys-color-primary)' }}>
                              ${totalValUsd.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {formatRupiah(totalValUsd, usdToIdrRate)}
                            </span>
                          </div>

                          {/* Tooltip Info Trigger Icon */}
                          <span
                            style={{
                              position: 'relative',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'help',
                              color: 'var(--md-sys-color-primary)',
                              backgroundColor: 'rgba(0, 176, 255, 0.1)',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '10px',
                              fontWeight: '700',
                              userSelect: 'none'
                            }}
                            onMouseEnter={() => setHoveredExchange(hoverKey)}
                            onMouseLeave={() => setHoveredExchange(null)}
                          >
                            i

                            {/* Floating Tooltip Box */}
                            <div style={{
                              position: 'absolute',
                              bottom: '120%',
                              right: '0',
                              transform: hoveredExchange === hoverKey ? 'translateY(-4px)' : 'translateY(8px)',
                              opacity: hoveredExchange === hoverKey ? 1 : 0,
                              visibility: hoveredExchange === hoverKey ? 'visible' : 'hidden',
                              transition: 'all 0.2s ease',
                              backgroundColor: '#1b1d26',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: 'var(--md-shape-corner-medium)',
                              padding: '12px',
                              width: '260px',
                              zIndex: 1000,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                              pointerEvents: 'none',
                              textTransform: 'none',
                              letterSpacing: 'normal'
                            }}>
                              <div style={{ fontWeight: '700', fontSize: '11px', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', textAlign: 'left' }}>
                                Alokasi Bursa ({coin.symbol})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                                {coin.breakdown.map((item) => {
                                  const itemUsd = item.amount * coin.price;
                                  return (
                                    <div key={item.exName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ffffff' }}>
                                      <span style={{ fontWeight: '600' }}>{item.exName}</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span>{item.amount.toLocaleString('id-ID')} {coin.symbol}</span>
                                        <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                          {formatRupiah(itemUsd, usdToIdrRate)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </>
  );
}

export default PortfolioPage;
