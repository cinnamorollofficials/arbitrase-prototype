import CoinIcon from '../../components/CoinIcon';
import ExchangeIcon from '../../components/ExchangeIcon';
import { TX_STEPS } from '../../constants/transactions';
import { formatRupiah } from '../../utils/formatters';

function AgentPage(props) {
  const {
    activeTab,
    filter,
    agentStatus,
    setAgentStatus,
    minSpreadCriteria,
    setMinSpreadCriteria,
    numAgents,
    setNumAgents,
    coinCategory,
    setCoinCategory,
    agentLogs,
    discoveredCoins,
    handleAddMockCoin,
  } = props;

  return (
    <>
      {/* AI Agent Scanner Tab Content */}
      {activeTab === 'agent' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', animation: 'fadeIn 0.3s ease' }}>

          {/* Column 1: Agent Setup and Terminal Logs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="md3-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--md-sys-color-primary)' }}>
                Konfigurasi Pencarian Agen AI
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', margin: 0 }}>
                Agen AI berjalan secara otonom memindai internet, DEX pools, dan CEX announcements untuk mencari koin baru dengan spread harga tertinggi.
              </p>

              {/* Row 1: Spread & Spawn Count */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)' }}>Target Spread Minimal:</span>
                  <input
                    type="number"
                    value={minSpreadCriteria}
                    onChange={(e) => setMinSpreadCriteria(Math.max(0.1, parseFloat(e.target.value) || 1.5))}
                    step="0.1"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      borderRadius: 'var(--md-shape-corner-small)',
                      color: '#ffffff',
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)' }}>Jumlah Agen Aktif:</span>
                  <select
                    value={numAgents}
                    onChange={(e) => setNumAgents(parseInt(e.target.value) || 1)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      borderRadius: 'var(--md-shape-corner-small)',
                      color: '#ffffff',
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option style={{ backgroundColor: '#1e1e24' }} value="1">1 Agen (Standar)</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="2">2 Agen (Cepat)</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="3">3 Agen (Sangat Cepat)</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="5">5 Agen (Super Cepat)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Coin Category Filter & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)' }}>Filter Kategori Koin:</span>
                  <select
                    value={coinCategory}
                    onChange={(e) => setCoinCategory(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--md-sys-color-outline-variant)',
                      borderRadius: 'var(--md-shape-corner-small)',
                      color: '#ffffff',
                      padding: '6px 10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option style={{ backgroundColor: '#1e1e24' }} value="ALL">Semua Kategori</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="MICIN">Coin Micin (Meme)</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="VOLATILE">Fluktuatif (Lapis 2)</option>
                    <option style={{ backgroundColor: '#1e1e24' }} value="STABLE">Stablecoin (Pegged)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)' }}>Status Mesin Agen:</span>
                  <button
                    onClick={() => setAgentStatus(agentStatus === 'running' ? 'paused' : 'running')}
                    className="tab-btn"
                    style={{
                      backgroundColor: agentStatus === 'running' ? 'var(--color-profit-green)' : 'var(--md-sys-color-outline-variant)',
                      color: agentStatus === 'running' ? '#ffffff' : 'var(--md-sys-color-on-surface)',
                      border: 'none',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      borderRadius: 'var(--md-shape-corner-small)',
                      height: '34px',
                      cursor: 'pointer'
                    }}
                  >
                    {agentStatus === 'running' ? '● RUNNING' : '■ PAUSED'}
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="md3-card" style={{
              padding: '16px',
              backgroundColor: '#0a0d14',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 'var(--md-shape-corner-medium)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: 'var(--color-profit-green)' }}>
                  agent-terminal@arbitrage-bot
                </span>
                <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)' }}>Console Logs</span>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#eceff4',
                overflowY: 'auto',
                maxHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                textAlign: 'left'
              }}>
                {agentLogs.map((log, idx) => (
                  <div key={idx} style={{
                    whiteSpace: 'pre-wrap',
                    color: log.includes('MATCH') ? 'var(--color-profit-green)' : log.includes('SYSTEM') ? 'var(--md-sys-color-primary)' : 'inherit'
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Discovered Coins List */}
          <div className="md3-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--md-sys-color-primary)' }}>
                Hasil Pemindaian Koin Potensial ({coinCategory === 'ALL' ? 'Semua' : coinCategory})
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', marginBottom: 0 }}>
                Koin-koin di bawah ini berhasil dianalisis memiliki selisih harga antar bursa yang melampaui kriteria Anda.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
              {discoveredCoins.filter(c => coinCategory === 'ALL' || c.category === coinCategory).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                  <span>🔍</span>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Belum menemukan koin {coinCategory !== 'ALL' ? coinCategory : ''} yang sesuai kriteria. Biarkan agen AI berjalan...</p>
                </div>
              ) : (
                discoveredCoins.filter(c => coinCategory === 'ALL' || c.category === coinCategory).map(coin => (
                  <div key={coin.symbol} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    padding: '12px 16px',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {COIN_ICONS[coin.symbol] && (
                        <img
                          src={COIN_ICONS[coin.symbol]}
                          alt={coin.symbol}
                          onError={(e) => { e.target.style.display = 'none'; }}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                        />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', fontSize: '14px' }}>{coin.symbol}</span>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>{coin.name}</span>
                          <span style={{
                            fontSize: '9px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '700',
                            backgroundColor: coin.category === 'MICIN' ? 'rgba(244,63,94,0.15)' : coin.category === 'STABLE' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                            color: coin.category === 'MICIN' ? '#f43f5e' : coin.category === 'STABLE' ? '#10b981' : '#3b82f6'
                          }}>
                            {coin.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px' }}>
                          Potensi Rute: <span style={{ fontWeight: '600', color: '#ffffff' }}>{coin.buyEx} ➔ {coin.sellEx}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: 'var(--color-profit-green)' }}>
                          +{coin.spread.toFixed(2)}%
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>Spread</span>
                      </div>

                      <button
                        onClick={() => handleAddMockCoin(coin)}
                        className="tab-btn"
                        disabled={coin.added}
                        style={{
                          backgroundColor: coin.added ? 'var(--md-sys-color-outline-variant)' : 'var(--md-sys-color-on-surface-variant)',
                          color: coin.added ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-primary-container)',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: 'none',
                          borderRadius: 'var(--md-shape-corner-full)',
                          padding: '6px 14px',
                          cursor: coin.added ? 'default' : 'pointer'
                        }}
                      >
                        {coin.added ? 'Ditambahkan' : 'Tambah Ke Dashboard'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


    </>
  );
}

export default AgentPage;
