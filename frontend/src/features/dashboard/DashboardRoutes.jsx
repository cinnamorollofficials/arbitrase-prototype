import CoinIcon from '../../components/CoinIcon';
import ExchangeInfoModal from '../../components/modals/ExchangeInfoModal';
import ExchangesPage from '../exchanges/ExchangesPage';
import PricesPage from '../prices/PricesPage';
import TransactionsPage from '../transactions/TransactionsPage';
import AgentPage from '../agent/AgentPage';
import BalancesPage from '../balances/BalancesPage';
import PortfolioPage from '../portfolio/PortfolioPage';
import { formatRupiah } from '../../utils/formatters';

function DashboardRoutes(props) {
  const {
    activeSymbol,
    symbolsList,
    spreads,
    handleAssetChange,
    error,
    handleManualRefresh,
    loading,
    prices,
    compactMode,
    renderInfoIcon,
    stats,
    usdToIdrRate,
    refreshCountdown,
    netCalculation,
    capital,
    setCapital,
    setShowConfirmModal,
    activeTab,
    setActiveTab,
    transactions,
    exchangesDb,
    loadingExchangesDb,
    errorExchangesDb,
    exchangesViewMode,
    setExchangesViewMode,
    fetchExchangesDb,
    openExchangeDbPage,
    selectedExchangeDb,
  } = props;

  return (
    <>
      {/* Error State */}
      {error && (
        <div className="md3-card" style={{ borderColor: 'var(--md-sys-color-error)', backgroundColor: 'rgba(255, 180, 171, 0.05)', color: 'var(--md-sys-color-error)' }}>
          <div style={{ fontWeight: '700', marginBottom: '4px' }}>Koneksi Gagal</div>
          <p style={{ fontSize: '14px' }}>{error}</p>
          <button
            onClick={handleManualRefresh}
            className="tab-btn"
            style={{ marginTop: '12px', backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading && prices.length === 0 ? (
        <div className="summary-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="md3-card skeleton-card">
              <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '80%', height: '36px', margin: '12px 0' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
            </div>
          ))}
        </div>
      ) : (
        /* Dashboard Stats Grid */
        <div className="summary-grid">
          {/* Average Price */}
          <div className="md3-card summary-card">
            <div className="summary-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Harga Rata-Rata (Last)</span>
              {compactMode && renderInfoIcon(
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '2px' }}>Rupiah Ekuivalen:</div>
                  <div>{formatRupiah(stats.average, usdToIdrRate)}</div>
                  <div style={{ marginTop: '6px', opacity: 0.8, fontSize: '10px' }}>Dari bursa yang terhubung</div>
                </div>
              )}
            </div>
            <div className="summary-value">${stats.average.toFixed(5)}</div>
            {!compactMode && (
              <>
                <div style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: '500' }}>
                  {formatRupiah(stats.average, usdToIdrRate)}
                </div>
                <div className="summary-subtext" style={{ marginTop: '8px' }}>Dari bursa yang berhasil terhubung</div>
              </>
            )}
            <div className="countdown-line" style={{ width: `${(refreshCountdown / 10) * 100}%` }}></div>
          </div>

          {/* Max Spread % */}
          <div className="md3-card summary-card">
            <div className="summary-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Spread Arbitrase Eksekusi</span>
              {compactMode && renderInfoIcon(
                <div>
                  <div style={{ fontWeight: '700', marginBottom: '2px' }}>Selisih Nominal:</div>
                  <div>${stats.spreadUsd.toFixed(5)}</div>
                  <div style={{ marginTop: '4px' }}>({formatRupiah(stats.spreadUsd, usdToIdrRate)})</div>
                </div>
              )}
            </div>
            <div className="summary-value" style={{ color: stats.spreadPct > 0 ? 'var(--color-profit-green)' : 'inherit' }}>
              {stats.spreadPct > 0 ? `+${stats.spreadPct.toFixed(3)}%` : `${stats.spreadPct.toFixed(3)}%`}
            </div>
            {!compactMode && (
              <div className="summary-subtext">
                Selisih nominal: ${stats.spreadUsd.toFixed(5)} ({formatRupiah(stats.spreadUsd, usdToIdrRate)})
              </div>
            )}
            {stats.spreadPct > 0.05 && (
              <span className="badge badge-dex" style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px' }}>
                PROFIT PELUANG
              </span>
            )}
          </div>

          {/* Arbitrage Route Recommendation */}
          <div className={`md3-card summary-card ${netCalculation.net > 0 ? 'rec-card' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="summary-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>Rekomendasi Rute & Net Profit</span>
              {compactMode && renderInfoIcon(
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px', marginBottom: '3px' }}>
                    Estimasi Net Profit (Modal: {capital} USDC)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>Gross Profit:</span>
                    <span style={{ color: 'var(--color-profit-green)', fontWeight: 'bold' }}>+${netCalculation.gross.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>Biaya (Fees):</span>
                    <span style={{ color: 'var(--md-sys-color-error)', fontWeight: 'bold' }}>-${netCalculation.fees.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', borderTop: '1px dashed rgba(255,255,255,0.2)', paddingTop: '4px', marginTop: '2px', fontWeight: '800' }}>
                    <span>Net Profit:</span>
                    <span style={{ color: netCalculation.net > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
                      {netCalculation.net >= 0 ? '+' : ''}${netCalculation.net.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, textAlign: 'right', marginTop: '2px' }}>
                    ({formatRupiah(netCalculation.net, usdToIdrRate)})
                  </div>
                </div>
              )}
            </div>
            {stats.lowestAsk && stats.highestBid ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="rec-path">
                  <div className="rec-node">{stats.lowestAsk.name}</div>
                  <div className="rec-arrow">➔</div>
                  <div className="rec-node">{stats.highestBid.name}</div>
                </div>

                {/* Capital Input Field */}
                {!compactMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Modal:</span>
                    <input
                      type="number"
                      value={capital}
                      onChange={(e) => setCapital(Math.max(0, Number(e.target.value)))}
                      style={{
                        width: '90px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        borderRadius: 'var(--md-shape-corner-small)',
                        color: '#ffffff',
                        padding: '3px 6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        outline: 'none'
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>USDC</span>
                  </div>
                )}

                {/* Net Breakdown */}
                {!compactMode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Profit Kotor (Gross):</span>
                      <span style={{ color: netCalculation.gross > 0 ? 'var(--color-profit-green)' : 'inherit', fontWeight: '600' }}>
                        {netCalculation.gross >= 0 ? '+' : ''}${netCalculation.gross.toFixed(2)} ({formatRupiah(netCalculation.gross, usdToIdrRate)})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Estimasi Biaya (Fee):</span>
                      <span style={{ color: 'var(--md-sys-color-error)', fontWeight: '600' }}>
                        -${netCalculation.fees.toFixed(2)} ({formatRupiah(netCalculation.fees, usdToIdrRate)})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '3px' }}>
                      <span>Net Profit/Loss:</span>
                      <span style={{ color: netCalculation.net > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
                        {netCalculation.net >= 0 ? '+' : ''}${netCalculation.net.toFixed(2)} ({formatRupiah(netCalculation.net, usdToIdrRate)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Execute Button */}
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="tab-btn"
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    backgroundColor: 'var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-on-primary)',
                    fontWeight: '700',
                    fontSize: '12px',
                    padding: '8px 16px',
                    borderRadius: 'var(--md-shape-corner-full)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: netCalculation.net > 0 ? '0 2px 8px rgba(0, 176, 255, 0.3)' : 'none'
                  }}
                >
                  Eksekusi Arbitrase
                </button>
              </div>
            ) : (
              <div className="summary-value" style={{ fontSize: '18px' }}>Mencari peluang...</div>
            )}
          </div>
        </div>
      )}

      {/* View Toggle Tabs & Compact Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('prices')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'prices' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'prices' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'prices' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Perbandingan Bursa (Real-time)
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'queue' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'queue' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'queue' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Antrean Transaksi ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'agent' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'agent' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'agent' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Agen AI Scanner
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'balances' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'balances' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'balances' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Saldo & Dompet
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'portfolio' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'portfolio' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'portfolio' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Portofolio Koin
          </button>
          <button
            onClick={() => setActiveTab('exchanges')}
            className="tab-btn"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              backgroundColor: activeTab === 'exchanges' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
              color: activeTab === 'exchanges' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
              borderRadius: 'var(--md-shape-corner-medium)',
              border: activeTab === 'exchanges' ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Exchanges (DB)
          </button>
        </div>
      </div>


      <PricesPage {...props} />
      <TransactionsPage {...props} />
      <AgentPage {...props} />
      <BalancesPage {...props} />
      <PortfolioPage {...props} />
      {activeTab === 'exchanges' && !selectedExchangeDb && (
        <ExchangesPage
          exchangesDb={exchangesDb}
          loadingExchangesDb={loadingExchangesDb}
          errorExchangesDb={errorExchangesDb}
          exchangesViewMode={exchangesViewMode}
          setExchangesViewMode={setExchangesViewMode}
          compactMode={compactMode}
          onRefresh={fetchExchangesDb}
          onOpenExchange={openExchangeDbPage}
        />
      )}


      <ExchangeInfoModal {...props} />

    </>
  );
}

export default DashboardRoutes;
