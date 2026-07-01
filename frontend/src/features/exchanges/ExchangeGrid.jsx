import { formatCapital, getCapitalTier, getRatingStatus } from '../../utils/formatters';

function ExchangeGrid({ exchanges, onOpenExchange }) {
  const exchangesDb = exchanges;
  const openExchangeDbPage = onOpenExchange;

  return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {exchangesDb.map((ex) => {
                    const tradeFee = ex.fees?.find(f => f.fee_type === 'CEX_TRADE');
                    const apiAttribute = ex.attributes?.find(a => a.attribute_key === 'api_url' || a.attribute_key === 'factory_address');
                    const withdrawalFees = ex.fees?.filter(f => f.fee_type === 'WITHDRAWAL') || [];

                    return (
                      <div
                        key={ex.id}
                        className="md3-card"
                        style={{
                          padding: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 'var(--md-shape-corner-medium)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'transform 0.2s ease, border-color 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {/* Top Row: Logo & Name & Type */}
                        <div 
                          style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
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
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: ex.logoUrl ? 'none' : 'flex',
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #455a64, #607d8b)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: '800',
                              color: '#fff'
                            }}
                          >
                            {ex.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{ex.name}</span>
                              <span className={`badge ${ex.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                                {ex.type}
                              </span>
                            </div>
                            {ex.websiteUrl && (
                              <a
                                href={ex.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '11px', color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}
                              >
                                🔗 Kunjungi Website
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Middle: Regulated Legal Badge */}
                        <div style={{ margin: '4px 0' }}>
                          {ex.isRegisteredIndonesia ? (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                              🛡️ TERDAFTAR BAPPEBTI (LEGAL)
                            </div>
                          ) : (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--md-sys-color-on-surface-variant)',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              padding: '4px 10px',
                              borderRadius: '4px'
                            }}>
                              🌍 BURSA INTERNASIONAL
                            </div>
                          )}
                        </div>

                        {/* Rating & Reserves row */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
                          {ex.rating && (() => {
                            const status = getRatingStatus(ex.rating);
                            return (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>
                                <span style={{ color: '#ffb300' }}>⭐</span>
                                <span style={{ color: '#ffffff' }}>{parseFloat(ex.rating).toFixed(1)}</span>
                                <span style={{ color: status.color, fontSize: '10px', marginLeft: '2px' }}>({status.label})</span>
                              </div>
                            );
                          })()}

                          {ex.capital && (() => {
                            const tier = getCapitalTier(ex.capital);
                            return (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>
                                <span style={{ color: tier.color }}>💰</span>
                                <span style={{ color: '#ffffff' }}>{formatCapital(ex.capital)}</span>
                                <span style={{ color: tier.color, fontSize: '9px', marginLeft: '2px', backgroundColor: `${tier.color}15`, padding: '1px 4px', borderRadius: '3px' }}>
                                  {tier.label.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Bottom Info: Config Attribute & Fees */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                          {/* API Config */}
                          {apiAttribute && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {apiAttribute.attribute_key === 'api_url' ? 'Endpoint API:' : 'Router/Factory:'}
                              </span>
                              <span style={{ fontWeight: '500', color: '#ffffff', wordBreak: 'break-all', textAlign: 'right', fontSize: '11px' }}>
                                {apiAttribute.attribute_value}
                              </span>
                            </div>
                          )}

                          {/* Trade / Pool Fees */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {ex.type === 'CEX' ? 'Trading Fee (Spot):' : 'Default Pool Fee:'}
                            </span>
                            <span style={{ fontWeight: '700', color: 'var(--color-profit-green)' }}>
                              {tradeFee ? `${(parseFloat(tradeFee.fee_percentage) * 100).toFixed(2)}%` : ex.type === 'CEX' ? '0.10%' : '0.30%'}
                            </span>
                          </div>

                          {/* Withdrawal Fees List */}
                          {withdrawalFees.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                              <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '600', fontSize: '11px' }}>
                                Flat Withdrawal Fee (Penarikan CEX):
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', paddingLeft: '8px' }}>
                                {withdrawalFees.map(f => {
                                  const tokenSymbol = f.token_id === 1 ? 'USDT' : f.token_id === 2 ? 'SOL' : f.token_id === 3 ? 'ETH' : 'USDT';
                                  const chainName = f.chain_id === 1 ? 'Ethereum' : f.chain_id === 2 ? 'BSC' : f.chain_id === 3 ? 'Solana' : 'Solana';
                                  return (
                                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>{tokenSymbol} ({chainName}):</span>
                                      <span style={{ fontWeight: '600', color: '#ffffff' }}>
                                        {parseFloat(f.fee_flat).toFixed(2)} {tokenSymbol}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
  );
}

export default ExchangeGrid;
