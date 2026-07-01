import { useState, useEffect, useRef } from 'react';
import { getHeaderGradient } from '../utils/formatters';

function AppHeader({
  activeSymbol,
  isRefreshing,
  refreshCountdown,
  lastUpdated,
  compactMode,
  onToggleCompact,
  isDarkMode,
  onToggleDarkMode
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <div className="settings-menu-container" ref={dropdownRef} style={{ borderLeft: '1px solid var(--md-sys-color-outline-variant)', paddingLeft: '8px' }}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
            className="settings-toggle-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
              <path d="m370-80-16-128q-19-8-37-18.5t-33-23.5l-119 50L75-350l101-77q-1-9-1-18t1-18l-101-77 90-150 119 50q15-13 33-23.5t37-18.5l16-128h180l16 128q19 8 37 18.5t33 23.5l119-50 90 150-101 77q1 9 1 18t-1 18l101 77-90 150-119-50q-15 13-33 23.5t-37 18.5L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Zm0-80q25 0 42.5-17.5T542-480q0-25-17.5-42.5T482-540q-25 0-42.5 17.5T422-480q0 25 17.5 42.5T482-420Zm-2-60Z" />
            </svg>
          </button>

          {isSettingsOpen && (
            <div className="settings-dropdown">
              <div className="settings-dropdown-item">
                <span className="settings-dropdown-label">
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                      <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-662q0 90 63 153t153 63q48 0 94.5-24.5T830-536q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                      <path d="M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-56 96 101-52 52Zm580-81-97 101-52-52 101-96 48 47ZM290-227l-96 101-48-48 101-97 43 44Zm520 86-101-96 44-43 97 101-40 38ZM480-480Z" />
                    </svg>
                  )}
                  Dark Mode
                </span>
                <button
                  onClick={onToggleDarkMode}
                  aria-label="Toggle dark mode"
                  className={`md3-switch ${isDarkMode ? 'active' : ''}`}
                >
                  <div className="md3-switch-thumb" />
                </button>
              </div>

              <div className="settings-dropdown-divider"></div>

              <div className="settings-dropdown-item">
                <span className="settings-dropdown-label">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                    <path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm720 0v120h-80v-120H640v-80h200v200Z" />
                  </svg>
                  Compact UI
                </span>
                <button
                  onClick={onToggleCompact}
                  aria-label="Toggle mode compact"
                  className={`md3-switch ${compactMode ? 'active' : ''}`}
                >
                  <div className="md3-switch-thumb" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

