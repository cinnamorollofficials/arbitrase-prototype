import { getHeaderGradient } from '../utils/formatters';

function AppHeader({
  activeSymbol,
  isRefreshing,
  refreshCountdown,
  lastUpdated,
  compactMode,
  onToggleCompact
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo" style={{ background: getHeaderGradient(activeSymbol) }}>
          {activeSymbol[0]}
        </div>
        <div>
          <h1 className="brand-title">{activeSymbol} Arbitrage</h1>
          <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
            12 Bursa Utama CEX & DEX (Priced in {activeSymbol === 'USDT' ? 'USD/USDC' : 'USDT'})
          </p>
        </div>
      </div>

      <div className="sync-status-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div className="status-chip">
          <span className={`status-indicator ${isRefreshing ? 'loading' : ''}`}></span>
          {isRefreshing ? 'Memperbarui...' : `Auto-refresh dalam ${refreshCountdown}s`}
        </div>
        {lastUpdated && (
          <span style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>
            Update: {lastUpdated.toLocaleTimeString()}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>Compact UI</span>
          <button
            onClick={onToggleCompact}
            aria-label="Toggle mode compact"
            style={{
              width: '34px',
              height: '18px',
              borderRadius: '9px',
              backgroundColor: compactMode ? 'var(--md-sys-color-primary)' : 'rgba(255,255,255,0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              padding: 0,
              flexShrink: 0
            }}
          >
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              position: 'absolute',
              top: '3px',
              left: compactMode ? '18px' : '4px',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
