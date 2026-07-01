import CoinIcon from '../../components/CoinIcon';
import ExchangeIcon from '../../components/ExchangeIcon';
import { TX_STEPS } from '../../constants/transactions';
import { formatRupiah } from '../../utils/formatters';

function TransactionsPage(props) {
  const {
    error,
    loading,
    compactMode,
    usdToIdrRate,
    capital,
    activeTab,
    transactions,
    filter,
    searchQueryQueue,
    setSearchQueryQueue,
    expandedTxId,
    setExpandedTxId,
  } = props;

  return (
    <>
      {activeTab === 'queue' && (
        <div className="md3-card table-card">
          <div className="table-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Antrean Eksekusi Transaksi</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Daftar eksekusi arbitrase yang telah Anda setujui dan dikirim ke antrean sistem.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQueryQueue}
                  onChange={(e) => setSearchQueryQueue(e.target.value)}
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

              {transactions.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus semua transaksi di antrean?')) {
                      setTransactions([]);
                      localStorage.removeItem('arbitrage_transactions');
                    }
                  }}
                  className="tab-btn"
                  style={{
                    backgroundColor: 'var(--md-sys-color-error-container)',
                    color: 'var(--md-sys-color-on-error-container)',
                    fontSize: '12px',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: 'var(--md-shape-corner-full)',
                    padding: '6px 14px',
                    cursor: 'pointer'
                  }}
                >
                  Hapus Semua
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📥</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Antrean transaksi kosong.</span>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Silakan eksekusi rute arbitrase yang menguntungkan dari tab sebelah.</p>
              </div>
            ) : (
              <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>ID Transaksi</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal & Waktu</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Aset</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Rute</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Modal Kerja</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Net Profit</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Status</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter(tx => {
                      const q = searchQueryQueue.toLowerCase().trim();
                      if (!q) return true;
                      return tx.id.toLowerCase().includes(q) ||
                             tx.symbol.toLowerCase().includes(q) ||
                             tx.buyExchange.toLowerCase().includes(q) ||
                             tx.sellExchange.toLowerCase().includes(q) ||
                             tx.status.toLowerCase().includes(q);
                    })
                    .map(tx => {
                    const isExpanded = expandedTxId === tx.id;
                    const currentStep = tx.stepIndex !== undefined ? tx.stepIndex : 0;
                    return (
                      <React.Fragment key={tx.id}>
                        <tr
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '12px 8px', fontWeight: '700', fontFamily: 'monospace' }}>{tx.id}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {new Date(tx.timestamp).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <CoinIcon symbol={tx.symbol} size={compactMode ? 16 : 20} />
                              {tx.symbol}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ fontWeight: '600' }}>{tx.buyEx}</span>
                            <span style={{ margin: '0 4px', color: 'var(--md-sys-color-outline)' }}>➔</span>
                            <span style={{ fontWeight: '600' }}>{tx.sellEx}</span>
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                            ${tx.capital.toLocaleString()} USDC
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: tx.netProfit > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
                            {tx.netProfit >= 0 ? '+' : ''}${tx.netProfit.toFixed(2)}
                            <div style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '400', marginTop: '1px' }}>
                              {formatRupiah(tx.netProfit, usdToIdrRate)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--md-shape-corner-full)',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: tx.status === 'Selesai' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(0, 176, 255, 0.15)',
                              color: tx.status === 'Selesai' ? 'var(--color-profit-green)' : 'var(--md-sys-color-primary)',
                              border: tx.status === 'Selesai' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(0, 176, 255, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span className={`status-indicator ${tx.status !== 'Selesai' ? 'loading' : ''}`} style={{ width: '6px', height: '6px' }}></span>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const updated = transactions.filter(t => t.id !== tx.id);
                                setTransactions(updated);
                                localStorage.setItem('arbitrage_transactions', JSON.stringify(updated));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--md-sys-color-error)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px'
                              }}
                              title="Hapus dari antrean"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible Pipeline Detail Sub-row */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} onClick={(e) => e.stopPropagation()}>
                            <td colSpan={8} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--md-sys-color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>🚀 Pipeline Alur Eksekusi ({tx.id})</span>
                                  {tx.status !== 'Selesai' && (
                                    <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '400' }}>
                                      Proses berjalan secara otomatis...
                                    </span>
                                  )}
                                </div>

                                {/* Stepper Graphics */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  position: 'relative',
                                  marginTop: '16px',
                                  padding: '0 20px',
                                  minHeight: '80px',
                                  overflowX: 'auto'
                                }}>
                                  {/* Line behind bubbles */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '13px',
                                    left: '50px',
                                    right: '50px',
                                    height: '3px',
                                    background: 'rgba(255,255,255,0.08)',
                                    zIndex: 1
                                  }} />

                                  {/* Green completed line */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '13px',
                                    left: '50px',
                                    width: `${(currentStep / 5) * 88}%`,
                                    height: '3px',
                                    background: 'var(--color-profit-green)',
                                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 2
                                  }} />

                                  {TX_STEPS.map((step, idx) => {
                                    const isCompleted = idx < currentStep;
                                    const isActive = idx === currentStep;

                                    let bubbleBg = 'var(--md-sys-color-surface-container-high)';
                                    let bubbleBorder = '1px solid rgba(255,255,255,0.1)';
                                    let textColor = 'var(--md-sys-color-on-surface-variant)';

                                    if (isCompleted) {
                                      bubbleBg = 'var(--color-profit-green)';
                                      bubbleBorder = '1px solid var(--color-profit-green)';
                                      textColor = '#ffffff';
                                    } else if (isActive) {
                                      bubbleBg = 'var(--md-sys-color-primary-container)';
                                      bubbleBorder = '2px solid var(--md-sys-color-primary)';
                                      textColor = 'var(--md-sys-color-primary)';
                                    }

                                    return (
                                      <div key={idx} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        zIndex: 3,
                                        width: '80px',
                                        textAlign: 'center',
                                        flexShrink: 0
                                      }}>
                                        {/* Step Circle */}
                                        <div style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          background: bubbleBg,
                                          border: bubbleBorder,
                                          color: textColor,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: '700',
                                          fontSize: '11px',
                                          transition: 'all 0.3s ease',
                                          boxShadow: isActive ? '0 0 12px rgba(0, 176, 255, 0.4)' : 'none'
                                        }}>
                                          {isCompleted ? '✓' : idx + 1}
                                        </div>

                                        {/* Step Label */}
                                        <div style={{
                                          fontSize: '11px',
                                          fontWeight: isActive ? '800' : '600',
                                          color: isActive ? 'var(--md-sys-color-primary)' : isCompleted ? '#ffffff' : 'var(--md-sys-color-on-surface-variant)',
                                          marginTop: '10px',
                                          lineHeight: '1.2'
                                        }}>
                                          {step.label}
                                        </div>

                                        {/* Step Description */}
                                        <div style={{
                                          fontSize: '9px',
                                          color: 'var(--md-sys-color-on-surface-variant)',
                                          marginTop: '3px',
                                          lineHeight: '1.1'
                                        }}>
                                          {step.desc}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}


    </>
  );
}

export default TransactionsPage;
