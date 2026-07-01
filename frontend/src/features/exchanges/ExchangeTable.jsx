import { formatCapital, getCapitalTier, getRatingStatus } from '../../utils/formatters';

function ExchangeTable({ exchanges, compactMode, onOpenExchange }) {
  const exchangesDb = exchanges;
  const openExchangeDbPage = onOpenExchange;

  return (
                <div style={{ overflowX: 'auto' }}>
                  <table className={`md3-table ${compactMode ? 'compact-table' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Bursa / Tipe</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Rating / Kredibilitas</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Reserved Capital / TVL</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Legalitas Indonesia</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Endpoint API / Router</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangesDb.map((ex) => {
                        const tradeFee = ex.fees?.find(f => f.fee_type === 'CEX_TRADE');
                        const apiAttribute = ex.attributes?.find(a => a.attribute_key === 'api_url' || a.attribute_key === 'factory_address');
                        const withdrawalFees = ex.fees?.filter(f => f.fee_type === 'WITHDRAWAL') || [];

                        return (
                          <tr
                            key={ex.id}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Bursa name & icon */}
                            <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => openExchangeDbPage(ex)}
                                title="Buka halaman detail bursa"
                              >
                                {ex.logoUrl ? (
                                  <img
                                    src={ex.logoUrl}
                                    alt={ex.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                    style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    display: ex.logoUrl ? 'none' : 'flex',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #455a64, #607d8b)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: '#fff'
                                  }}
                                >
                                  {ex.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{ex.name}</span>
                                    <span className={`badge ${ex.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                                      {ex.type}
                                    </span>
                                  </div>
                                  {ex.websiteUrl && (
                                    <a
                                      href={ex.websiteUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ fontSize: '10px', color: 'var(--md-sys-color-primary)', textDecoration: 'none', fontWeight: 'normal' }}
                                    >
                                      Kunjungi Website ➔
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Rating */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: '#ffb300', fontSize: '13px' }}>⭐</span>
                                  <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>
                                    {ex.rating ? parseFloat(ex.rating).toFixed(1) : '-'} <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>/ 10</span>
                                  </span>
                                </div>
                                {ex.rating && (() => {
                                  const status = getRatingStatus(ex.rating);
                                  return (
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: status.color }}>
                                      {status.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Reserve Capital */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>
                                  {formatCapital(ex.capital)}
                                </span>
                                {ex.capital && (() => {
                                  const tier = getCapitalTier(ex.capital);
                                  return (
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      color: tier.color,
                                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                      border: `1px solid ${tier.color}33`,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      width: 'fit-content'
                                    }}>
                                      {tier.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Legalitas */}
                            <td style={{ padding: '16px 20px' }}>
                              {ex.isRegisteredIndonesia ? (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  color: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                  🛡️ Terdaftar Bappebti
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'var(--md-sys-color-on-surface-variant)',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  padding: '3px 8px',
                                  borderRadius: '4px'
                                }}>
                                  🌍 Internasional
                                </span>
                              )}
                            </td>

                            {/* API / Contract Router */}
                            <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '240px', wordBreak: 'break-all' }}>
                              {apiAttribute ? apiAttribute.attribute_value : '-'}
                            </td>

                            {/* Fees */}
                            <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--color-profit-green)' }}>
                              {tradeFee ? `${(parseFloat(tradeFee.fee_percentage) * 100).toFixed(2)}%` : ex.type === 'CEX' ? '0.10%' : '0.30%'}
                            </td>

                            {/* Withdrawal Fees */}
                            <td style={{ padding: '16px 20px' }}>
                              {withdrawalFees.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                                  {withdrawalFees.map(f => {
                                    const tokenSymbol = f.token_id === 1 ? 'USDT' : f.token_id === 2 ? 'SOL' : f.token_id === 3 ? 'ETH' : 'USDT';
                                    const chainName = f.chain_id === 1 ? 'Ethereum' : f.chain_id === 2 ? 'BSC' : f.chain_id === 3 ? 'Solana' : 'Solana';
                                    return (
                                      <div key={f.id} style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tokenSymbol} ({chainName}):</span>
                                        <span style={{ fontWeight: '600', color: '#ffffff' }}>{parseFloat(f.fee_flat).toFixed(2)} {tokenSymbol}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
  );
}

export default ExchangeTable;
