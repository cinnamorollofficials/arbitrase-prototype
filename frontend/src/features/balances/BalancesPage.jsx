import CoinIcon from '../../components/CoinIcon';
import ExchangeIcon from '../../components/ExchangeIcon';
import { TX_STEPS } from '../../constants/transactions';
import { formatRupiah } from '../../utils/formatters';

function BalancesPage(props) {
  const {
    compactMode,
    usdToIdrRate,
    activeTab,
    filter,
    hoveredExchange,
    setHoveredExchange,
    searchQueryBalances,
    setSearchQueryBalances,
    exchangeBalances,
  } = props;

  return (
    <>
      {activeTab === 'balances' && (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar Bursa & Saldo Dompet</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Informasi saldo modal, jaringan, latensi, dan fee transaksi yang terintegrasi secara otonom.
              </p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari bursa/jaringan..."
                value={searchQueryBalances}
                onChange={(e) => setSearchQueryBalances(e.target.value)}
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
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Bursa</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Jaringan</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Status API / Latency</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Biaya (Fee)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Saldo Utama (USDC)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(exchangeBalances)
                  .filter(([exName, info]) => {
                    const q = searchQueryBalances.toLowerCase().trim();
                    if (!q) return true;
                    return exName.toLowerCase().includes(q) || 
                           (info.network && info.network.toLowerCase().includes(q)) ||
                           (info.type && info.type.toLowerCase().includes(q));
                  })
                  .map(([exName, info]) => (
                    <tr
                    key={exName}
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
                    {/* Bursa Name & Badge */}
                    <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ExchangeIcon name={exName} size={compactMode ? 20 : 28} />
                        <span>{exName}</span>
                        <span className={`badge ${info.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                          {info.type}
                        </span>
                      </div>
                    </td>

                    {/* Jaringan */}
                    <td style={{ padding: '16px 20px', color: '#ffffff' }}>{info.network}</td>

                    {/* Status API / Latency */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: '600' }}>{info.apiStatus}</span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--color-profit-green)',
                          backgroundColor: 'rgba(52,211,153,0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          ⚡ {info.latency}
                        </span>
                      </div>
                    </td>

                    {/* Biaya (Fee) */}
                    <td style={{ padding: '16px 20px', color: 'var(--color-profit-green)', fontWeight: '600' }}>{info.fee}</td>

                    {/* Saldo Utama (USDC) + Tooltip Info Icon */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: '700' }}>{info.USDC.toLocaleString('id-ID', { minimumFractionDigits: 2 })} USDC</span>
                          <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {formatRupiah(info.USDC, usdToIdrRate)}
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
                          onMouseEnter={() => setHoveredExchange(exName)}
                          onMouseLeave={() => setHoveredExchange(null)}
                        >
                          i

                          {/* Floating Tooltip Box */}
                          <div style={{
                            position: 'absolute',
                            bottom: '120%',
                            right: '0',
                            transform: hoveredExchange === exName ? 'translateY(-4px)' : 'translateY(8px)',
                            opacity: hoveredExchange === exName ? 1 : 0,
                            visibility: hoveredExchange === exName ? 'visible' : 'hidden',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#1b1d26',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 'var(--md-shape-corner-medium)',
                            padding: '12px',
                            width: '250px',
                            zIndex: 1000,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none',
                            textTransform: 'none',
                            letterSpacing: 'normal'
                          }}>
                            <div style={{ fontWeight: '700', fontSize: '11px', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', textAlign: 'left' }}>
                              Detail Saldo Koin ({exName})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                              {Object.entries(info).map(([asset, val]) => {
                                if (['USDC', 'status', 'latency', 'type', 'network', 'apiStatus', 'fee'].includes(asset)) return null;

                                let tokenPriceInUsd = 1.0;
                                if (asset === 'SOL') tokenPriceInUsd = 145.20;
                                else if (asset === 'ETH') tokenPriceInUsd = 3450.00;
                                else if (asset === 'BNB') tokenPriceInUsd = 580.00;
                                else if (asset === 'PEPE') tokenPriceInUsd = 0.0000125;
                                else if (asset === 'BONK') tokenPriceInUsd = 0.0000215;
                                else if (asset === 'POPCAT') tokenPriceInUsd = 0.85;
                                else if (asset === 'RENDER') tokenPriceInUsd = 7.45;
                                else if (asset === 'W') tokenPriceInUsd = 0.35;
                                else if (asset === 'FLOKI') tokenPriceInUsd = 0.000175;

                                const valueInUsd = val * tokenPriceInUsd;

                                return (
                                  <div key={asset} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ffffff', marginTop: '2px' }}>
                                    <span style={{ fontWeight: '700' }}>
                                      {val.toLocaleString('id-ID')} {asset}
                                    </span>
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '10px' }}>
                                      {formatRupiah(valueInUsd, usdToIdrRate)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </span>
                      </div>
                    </td>

                    {/* Aksi Deposit / Withdraw */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => alert(`Fitur Deposit otomatis ke ${exName} disimulasikan.`)}
                          className="tab-btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => alert(`Fitur Penarikan (Withdraw) dari ${exName} disimulasikan.`)}
                          className="tab-btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portofolio Koin Tab */}

    </>
  );
}

export default BalancesPage;
