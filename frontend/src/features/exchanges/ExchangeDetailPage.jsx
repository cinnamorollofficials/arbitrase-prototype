import CoinIcon from '../../components/CoinIcon';
import ExchangeMarketTable from './ExchangeMarketTable';
import { formatCapital, getCapitalTier, getRatingStatus } from '../../utils/formatters';

function ExchangeDetailPage({
  selectedExchangeDb,
  exchangeDbDetailTab,
  setExchangeDbDetailTab,
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
  onBack,
  onExportMarketCsv,
  onMarketSort,
  getMarketSortIndicator,
  getMarketRow,
  getMarketRowKey,
  onToggleMarketRow,
  onToggleAllVisibleMarketRows
}) {
  const closeExchangeDbPage = onBack;
  const handleExportExchangeMarketCsv = onExportMarketCsv;
  const handleExchangeMarketSort = onMarketSort;
  const getExchangeMarketSortIndicator = getMarketSortIndicator;
  const getExchangeMarketRow = getMarketRow;
  const getExchangeMarketRowKey = getMarketRowKey;
  const toggleExchangeMarketRowSelection = onToggleMarketRow;
  const toggleAllVisibleExchangeMarketRows = onToggleAllVisibleMarketRows;

  return (
        <div style={{
          width: '100%',
          display: 'block',
          minHeight: '100vh',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="md3-card" style={{
            minHeight: 'calc(100vh - 48px)',
            overflow: 'hidden',
            position: 'relative',
            padding: 0,
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-shape-corner-large)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Back Button */}
            <button
              className="exchange-detail-back-button"
              onClick={closeExchangeDbPage}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: 0,
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '20px 28px 0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              ✕
            </button>

            <div style={{ flex: 1, padding: '20px 28px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              {selectedExchangeDb.logoUrl ? (
                <img
                  src={selectedExchangeDb.logoUrl}
                  alt={selectedExchangeDb.name}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #455a64, #607d8b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#fff'
                }}>
                  {selectedExchangeDb.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '800', color: '#ffffff' }}>{selectedExchangeDb.name}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${selectedExchangeDb.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                    {selectedExchangeDb.type}
                  </span>
                  {selectedExchangeDb.isRegisteredIndonesia ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 'bold' }}>🛡️ TERDAFTAR BAPPEBTI</span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--md-sys-color-on-surface-variant)' }}>🌍 BURSA INTERNASIONAL</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trust & Capital Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: 'var(--md-shape-corner-medium)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>⭐ Kredibilitas & Trust Score</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                    {selectedExchangeDb.rating ? parseFloat(selectedExchangeDb.rating).toFixed(1) : '-'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>/ 10.0</span>
                </div>
                {selectedExchangeDb.rating && (() => {
                  const status = getRatingStatus(selectedExchangeDb.rating);
                  return (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: status.color, marginTop: '2px' }}>
                      Status: {status.label}
                    </span>
                  );
                })()}
              </div>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: 'var(--md-shape-corner-medium)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>💰 Modal Cadangan (Proof of Reserves / TVL)</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-profit-green)', marginTop: '4px' }}>
                  {formatCapital(selectedExchangeDb.capital)}
                </div>
                {selectedExchangeDb.capital && (() => {
                  const tier = getCapitalTier(selectedExchangeDb.capital);
                  return (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: tier.color, marginTop: '2px' }}>
                      Kategori: {tier.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <button
                onClick={() => setExchangeDbDetailTab('overview')}
                className={`tab-btn ${exchangeDbDetailTab === 'overview' ? 'active' : ''}`}
                style={{
                  backgroundColor: exchangeDbDetailTab === 'overview' ? 'var(--md-sys-color-primary-container)' : 'rgba(255,255,255,0.04)',
                  color: exchangeDbDetailTab === 'overview' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                  border: exchangeDbDetailTab === 'overview' ? '1px solid var(--md-sys-color-primary)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                Overview
              </button>
              <button
                onClick={() => setExchangeDbDetailTab('market')}
                className={`tab-btn ${exchangeDbDetailTab === 'market' ? 'active' : ''}`}
                style={{
                  backgroundColor: exchangeDbDetailTab === 'market' ? 'var(--md-sys-color-primary-container)' : 'rgba(255,255,255,0.04)',
                  color: exchangeDbDetailTab === 'market' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                  border: exchangeDbDetailTab === 'market' ? '1px solid var(--md-sys-color-primary)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                Market Data
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {exchangeDbDetailTab === 'market' && (
              <>
              <ExchangeMarketTable
                compactMode={compactMode}
                selectedExchangeFiatPairs={selectedExchangeFiatPairs}
                filteredExchangeFiatPairs={filteredExchangeFiatPairs}
                sortedExchangeFiatPairs={sortedExchangeFiatPairs}
                exchangeMarketSearchQuery={exchangeMarketSearchQuery}
                setExchangeMarketSearchQuery={setExchangeMarketSearchQuery}
                selectedExchangeMarketPairs={selectedExchangeMarketPairs}
                exchangeMarketRefreshCycle={exchangeMarketRefreshCycle}
                errorExchangeMarketData={errorExchangeMarketData}
                loadingExchangeMarketData={loadingExchangeMarketData}
                allVisibleExchangeMarketRowsSelected={allVisibleExchangeMarketRowsSelected}
                selectedExchangeMarketRows={selectedExchangeMarketRows}
                onExportMarketCsv={handleExportExchangeMarketCsv}
                onMarketSort={handleExchangeMarketSort}
                getMarketSortIndicator={getExchangeMarketSortIndicator}
                getMarketRow={getExchangeMarketRow}
                getMarketRowKey={getExchangeMarketRowKey}
                onToggleMarketRow={toggleExchangeMarketRowSelection}
                onToggleAllVisibleMarketRows={toggleAllVisibleExchangeMarketRows}
              />
              </>
              )}

              {exchangeDbDetailTab === 'overview' && (
              <>
              {/* Endpoint API / Router */}
              {selectedExchangeDb.attributes && selectedExchangeDb.attributes.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Konfigurasi Jaringan API / Smart Contract
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {selectedExchangeDb.attributes.map(attr => (
                      <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '600' }}>{attr.attributeKey}:</span>
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', color: '#ffffff' }}>{attr.attributeValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supported Chains */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Blockchain Jaringan yang Didukung (Chains)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(() => {
                    const chains = [];
                    // Extract unique chains from fees
                    selectedExchangeDb.fees?.forEach(f => {
                      if (f.chain && !chains.some(c => c.id === f.chain.id)) {
                        chains.push(f.chain);
                      }
                    });
                    if (chains.length === 0) {
                      return <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada data jaringan blockchain khusus terdaftar.</span>;
                    }
                    return chains.map(c => (
                      <span
                        key={c.id}
                        className="badge badge-dex"
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', borderRadius: '6px' }}
                      >
                        🌐 {c.name} ({c.chainIdentifier || 'EVM'})
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Supported Tokens */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Token Kripto Terdaftar & Aktif (Tokens)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(() => {
                    const tokens = [];
                    // Extract unique tokens from tokenPairs baseToken and quoteToken
                    selectedExchangeDb.tokenPairs?.forEach(tp => {
                      if (tp.baseToken && !tokens.some(t => t.id === tp.baseToken.id)) {
                        tokens.push(tp.baseToken);
                      }
                      if (tp.quoteToken && !tokens.some(t => t.id === tp.quoteToken.id)) {
                        tokens.push(tp.quoteToken);
                      }
                    });
                    // Fallback to fees tokens
                    selectedExchangeDb.fees?.forEach(f => {
                      if (f.token && !tokens.some(t => t.id === f.token.id)) {
                        tokens.push(f.token);
                      }
                    });

                    if (tokens.length === 0) {
                      return <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada token terdaftar.</span>;
                    }
                    return tokens.map(t => (
                      <div
                        key={t.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#ffffff'
                        }}
                      >
                        <CoinIcon symbol={t.symbol} size={16} />
                        <span>{t.symbol}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Fee Rules */}
              {selectedExchangeDb.fees && selectedExchangeDb.fees.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rincian Tarif Biaya (Fees)
                  </h4>
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tipe Biaya</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Token</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Jaringan</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Tarif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExchangeDb.fees.map(f => (
                          <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{f.feeType}</td>
                            <td style={{ padding: '8px 12px' }}>{f.token ? f.token.symbol : '-'}</td>
                            <td style={{ padding: '8px 12px' }}>{f.chain ? f.chain.name : '-'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-profit-green)' }}>
                              {f.feePercentage ? `${(parseFloat(f.feePercentage) * 100).toFixed(2)}%` : f.feeFlat ? `${parseFloat(f.feeFlat).toFixed(2)} ${f.token ? f.token.symbol : ''}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
        </div>
  );
}

export default ExchangeDetailPage;
