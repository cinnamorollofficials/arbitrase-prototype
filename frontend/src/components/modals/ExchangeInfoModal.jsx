import CoinIcon from '../CoinIcon';
import { EXCHANGE_API_INFO } from '../../constants/marketData';

function ExchangeInfoModal(props) {
  const {
    handleAssetChange,
    prices,
    compactMode,
    setActiveTab,
    filter,
    selectedExchange,
    setShowExchangeModal,
    showExchangeModal,
    setExchangeDetails,
    exchangeDetails,
    loadingExchange,
    searchQueryModalTokens,
    setSearchQueryModalTokens,
  } = props;

  return (
    <>
      {/* Fullscreen Exchange Modal Info Dashboard */}
      {showExchangeModal && selectedExchange && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 11, 15, 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '24px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="md3-card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '30px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-shape-corner-large)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowExchangeModal(false);
                setExchangeDetails({ exchange: selectedExchange, tokens: [] });
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              ✕
            </button>

            {/* Exchange Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
              <img 
                src={EXCHANGE_ICONS[selectedExchange] || EXCHANGE_ICONS[selectedExchange.split(' ')[0]] || 'https://assets.coingecko.com/markets/images/default.png'} 
                alt={selectedExchange} 
                style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <div>
                <h1 style={{ fontSize: '26px', margin: 0, fontWeight: '800' }}>{selectedExchange}</h1>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${EXCHANGES_LIST.find(e => e.name === selectedExchange)?.type === 'DEX' ? 'badge-dex' : 'badge-cex'}`}>
                    {EXCHANGES_LIST.find(e => e.name === selectedExchange)?.type || 'CEX'}
                  </span>
                  {EXCHANGES_LIST.find(e => e.name === selectedExchange)?.local && (
                    <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>LOCAL INDONESIA</span>
                  )}
                  <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>ONLINE</span>
                </div>
              </div>
            </div>

            {/* API Info & Latency Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--md-shape-corner-medium)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>Latency API</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-profit-green)', marginTop: '4px' }}>
                  {EXCHANGE_API_INFO[selectedExchange]?.latency || '45ms'}
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--md-shape-corner-medium)', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>Endpoints Tersedia</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginTop: '4px' }}>
                  {EXCHANGE_API_INFO[selectedExchange]?.apis || 'Public Market API / JSON-RPC'}
                </div>
              </div>
            </div>

            {/* Supported Tokens (Listed in App) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, borderLeft: '3px solid var(--md-sys-color-primary)', paddingLeft: '8px' }}>
                Token Terdaftar di Aplikasi ({exchangeDetails.tokens?.length || 0})
              </h3>
              
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Cari token..."
                  value={searchQueryModalTokens}
                  onChange={(e) => setSearchQueryModalTokens(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 28px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    color: '#ffffff',
                    outline: 'none',
                    width: '140px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.width = '180px';
                    e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.width = '140px';
                    e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                <svg 
                  style={{ position: 'absolute', left: '8px', width: '12px', height: '12px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
            </div>

            {loadingExchange ? (
              <div style={{ padding: '20px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>Memuat data token...</div>
            ) : !exchangeDetails.tokens || exchangeDetails.tokens.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada token terdaftar yang didukung.</div>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--md-shape-corner-medium)', overflow: 'hidden' }}>
                <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)' }}>Token</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Harga Last</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Beli (Ask)</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Jual (Bid)</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeDetails.tokens
                      ?.filter(token => {
                        const q = searchQueryModalTokens.toLowerCase().trim();
                        if (!q) return true;
                        const coinInfo = COIN_META_LOOKUP[token.symbol] || { name: token.symbol };
                        return token.symbol.toLowerCase().includes(q) || 
                               coinInfo.name.toLowerCase().includes(q);
                      })
                      ?.map(token => {
                        const coinInfo = COIN_META_LOOKUP[token.symbol] || { name: token.symbol };
                      return (
                        <tr key={token.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CoinIcon symbol={token.symbol} size={20} />
                              <span>{token.symbol}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>({coinInfo.name})</span>
                            </div>
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right' }}>
                            ${token.price ? (token.price >= 0.01 ? token.price.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.price.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right', color: 'var(--color-profit-green)' }}>
                            ${token.ask ? (token.ask >= 0.01 ? token.ask.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.ask.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right', color: 'var(--md-sys-color-primary)' }}>
                            ${token.bid ? (token.bid >= 0.01 ? token.bid.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.bid.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                handleAssetChange(token.symbol);
                                setShowExchangeModal(false);
                                setActiveTab('prices');
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'var(--md-sys-color-primary-container)',
                                color: 'var(--md-sys-color-on-primary-container)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Pilih Koin
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Unlisted Tokens (Not in App - limited to 10) */}
            <h3 style={{ fontSize: '16px', marginBottom: '12px', borderLeft: '3px solid var(--md-sys-color-outline-variant)', paddingLeft: '8px' }}>
              Token Lain yang Didukung (Tidak Terdaftar di Aplikasi - Batas 10)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {(EXCHANGE_API_INFO[selectedExchange]?.unlisted || ['BTC', 'ETH']).map(sym => (
                <div 
                  key={sym} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  <CoinIcon symbol={sym} size={18} />
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default ExchangeInfoModal;
