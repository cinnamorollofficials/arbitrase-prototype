import DashboardRoutes from '../features/dashboard/DashboardRoutes';
import ConfirmExecutionModal from '../components/modals/ConfirmExecutionModal';
import RawPriceModal from '../components/modals/RawPriceModal';
import ExchangeDetailPage from '../features/exchanges/ExchangeDetailPage';

function AppRoutes(props) {
  const {
    handleManualRefresh,
    compactMode,
    activeTab,
    exchangesDb,
    selectedExchangeDb,
    exchangeDbDetailTab,
    setExchangeDbDetailTab,
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
    closeExchangeDbPage,
    handleExportExchangeMarketCsv,
    handleExchangeMarketSort,
    getExchangeMarketSortIndicator,
    getExchangeMarketRow,
    getExchangeMarketRowKey,
    toggleExchangeMarketRowSelection,
    toggleAllVisibleExchangeMarketRows,
    isRefreshing,
    isExchangeDetailPage
  } = props;

  return (
    <>
      {!isExchangeDetailPage && <DashboardRoutes {...props} />}

      {activeTab === 'exchanges' && selectedExchangeDb && (
        <ExchangeDetailPage
          selectedExchangeDb={selectedExchangeDb}
          exchangesDb={exchangesDb}
          exchangeDbDetailTab={exchangeDbDetailTab}
          setExchangeDbDetailTab={setExchangeDbDetailTab}
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
          onBack={closeExchangeDbPage}
          onExportMarketCsv={handleExportExchangeMarketCsv}
          onMarketSort={handleExchangeMarketSort}
          getMarketSortIndicator={getExchangeMarketSortIndicator}
          getMarketRow={getExchangeMarketRow}
          getMarketRowKey={getExchangeMarketRowKey}
          onToggleMarketRow={toggleExchangeMarketRowSelection}
          onToggleAllVisibleMarketRows={toggleAllVisibleExchangeMarketRows}
        />
      )}

      <ConfirmExecutionModal {...props} />      <RawPriceModal {...props} />      {/* Material Floating Action Button (FAB) for manual refresh */}
      {!isExchangeDetailPage && (
      <button
        className={`md3-fab ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        aria-label="Refresh harga secara manual"
      >
        <svg className="fab-icon" viewBox="0 0 24 24">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
        <span>Refresh Sekarang</span>
      </button>
      )}
    </>
  );
}

export default AppRoutes;
