import ExchangeGrid from './ExchangeGrid';
import ExchangeTable from './ExchangeTable';

function ExchangesPage({
  exchangesDb,
  loadingExchangesDb,
  errorExchangesDb,
  exchangesViewMode,
  setExchangesViewMode,
  compactMode,
  onRefresh,
  onOpenExchange
}) {
  const fetchExchangesDb = onRefresh;
  const openExchangeDbPage = onOpenExchange;

  return (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar & Regulasi Bursa Kripto</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Data real-time dari database berisi bursa CEX & DEX, tautan resmi, logo bursa, status regulasi Bappebti Indonesia, dan skema biaya (fees).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* View mode toggle */}
              <div className="tabs-container" style={{ margin: 0, padding: '2px', display: 'inline-flex', height: 'auto', gap: '4px' }}>
                <button
                  className={`tab-btn ${exchangesViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setExchangesViewMode('table')}
                  style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                >
                  📋 Tabel
                </button>
                <button
                  className={`tab-btn ${exchangesViewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setExchangesViewMode('grid')}
                  style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                >
                  🎴 Grid
                </button>
              </div>

              <button
                onClick={fetchExchangesDb}
                className="tab-btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: 'var(--md-shape-corner-medium)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Refresh DB
              </button>
            </div>
          </div>

          {loadingExchangesDb ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto 12px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '60%', margin: '0 auto 24px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '0 20px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="md3-card" style={{ padding: '20px', height: '140px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: '12px' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ) : errorExchangesDb ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--md-sys-color-error)' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <p style={{ margin: '8px 0' }}>Gagal memuat data dari database: {errorExchangesDb}</p>
              <button
                onClick={fetchExchangesDb}
                className="tab-btn"
                style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 20px 20px' }}>
              {exchangesViewMode === 'table' ? (
                <ExchangeTable
                  exchanges={exchangesDb}
                  compactMode={compactMode}
                  onOpenExchange={openExchangeDbPage}
                />
              ) : (
                <ExchangeGrid
                  exchanges={exchangesDb}
                  onOpenExchange={openExchangeDbPage}
                />
              )}
            </div>
          )}
        </div>
  );
}

export default ExchangesPage;
