import AppHeader from './AppHeader';
import Breadcrumbs from './Breadcrumbs';

function AppShell({
  activeSymbol,
  isRefreshing,
  refreshCountdown,
  lastUpdated,
  compactMode,
  onToggleCompact,
  isDarkMode,
  onToggleDarkMode,
  breadcrumbExchangeName,
  onBackToExchanges,
  children
}) {
  return (
    <div className={`app-container ${compactMode ? 'compact-ui' : ''}`}>
      <AppHeader
        activeSymbol={activeSymbol}
        isRefreshing={isRefreshing}
        refreshCountdown={refreshCountdown}
        lastUpdated={lastUpdated}
        compactMode={compactMode}
        onToggleCompact={onToggleCompact}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      {breadcrumbExchangeName && (
        <Breadcrumbs
          exchangeName={breadcrumbExchangeName}
          onBackToExchanges={onBackToExchanges}
        />
      )}

      {children}
    </div>
  );
}

export default AppShell;
