import CoinIcon from '../CoinIcon';
import { formatRupiah } from '../../utils/formatters';

function ConfirmExecutionModal(props) {
  const {
    activeSymbol,
    error,
    stats,
    usdToIdrRate,
    refreshCountdown,
    netCalculation,
    capital,
    setShowConfirmModal,
    showConfirmModal,
    handleExecuteTransaction,
  } = props;

  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="md3-card" style={{
            maxWidth: '450px',
            width: '100%',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: 'var(--md-sys-elevation-3)',
            padding: '24px',
            borderRadius: 'var(--md-shape-corner-large)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span> Konfirmasi Eksekusi
            </h2>

            <p style={{ fontSize: '13px', margin: 0, color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin mengeksekusi rute arbitrase ini? Transaksi akan secara otomatis dikirim ke antrean sistem.
            </p>

            {/* Real-time Countdown Timer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '-4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <span>Harga real-time diperbarui dalam:</span>
                <span style={{ fontWeight: 'bold', color: refreshCountdown <= 3 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}>
                  {refreshCountdown} detik
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(refreshCountdown / 10) * 100}%`,
                  height: '100%',
                  backgroundColor: refreshCountdown <= 3 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)',
                  transition: 'width 1s linear, background-color 0.3s ease'
                }}></div>
              </div>
            </div>

            {/* Details Box */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--md-shape-corner-medium)',
              padding: '16px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Waktu Eksekusi:</span>
                <span style={{ fontWeight: '600' }}>{new Date().toLocaleString('id-ID')}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Koin / Aset:</span>
                <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CoinIcon symbol={activeSymbol} size={16} /> {activeSymbol}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bursa Beli (Ask):</span>
                <span style={{ fontWeight: '700', color: 'var(--color-profit-green)' }}>
                  {stats.lowestAsk?.name} (${stats.lowestAsk?.ask?.toFixed(5) || '-'})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bursa Jual (Bid):</span>
                <span style={{ fontWeight: '700', color: 'var(--md-sys-color-primary)' }}>
                  {stats.highestBid?.name} (${stats.highestBid?.bid?.toFixed(5) || '-'})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Modal Kerja:</span>
                <span style={{ fontWeight: '700' }}>${capital.toLocaleString()} USDC</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Exchange Fee (0.02%):</span>
                <span style={{ fontWeight: '600', color: 'var(--md-sys-color-error)' }}>
                  -${(capital * 0.0002).toFixed(2)} ({formatRupiah(capital * 0.0002, usdToIdrRate)})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>On-Chain Gas Fee:</span>
                <span style={{ fontWeight: '600', color: 'var(--md-sys-color-error)' }}>
                  -${(netCalculation.isCrossChain ? 1.00 : 0.10).toFixed(2)} ({formatRupiah(netCalculation.isCrossChain ? 1.00 : 0.10, usdToIdrRate)})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Bridge Transfer Fee:</span>
                <span style={{ fontWeight: '600', color: 'var(--md-sys-color-error)' }}>
                  -${(netCalculation.isCrossChain ? capital * 0.0005 : 0).toFixed(2)} ({formatRupiah(netCalculation.isCrossChain ? capital * 0.0005 : 0, usdToIdrRate)})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'bold' }}>Net Profit (Bersih):</span>
                <span style={{ fontWeight: '800', color: netCalculation.net > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)', fontSize: '13px' }}>
                  {netCalculation.net >= 0 ? '+' : ''}${netCalculation.net.toFixed(2)} ({formatRupiah(netCalculation.net, usdToIdrRate)})
                </span>
              </div>
            </div>

            {netCalculation.net <= 0 && (
              <div style={{
                backgroundColor: 'rgba(239, 83, 80, 0.08)',
                border: '1px solid var(--md-sys-color-error)',
                borderRadius: 'var(--md-shape-corner-small)',
                padding: '8px 12px',
                fontSize: '11px',
                color: 'var(--md-sys-color-error)',
                lineHeight: '1.4'
              }}>
                ⚠️ Peringatan: Rute transaksi saat ini menghasilkan kerugian (Net Loss). Tetap eksekusi?
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="tab-btn"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--md-sys-color-outline)',
                  color: 'var(--md-sys-color-on-surface)',
                  padding: '6px 16px',
                  borderRadius: 'var(--md-shape-corner-full)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleExecuteTransaction}
                className="tab-btn"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  padding: '6px 20px',
                  borderRadius: 'var(--md-shape-corner-full)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                Oke, Eksekusi
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

export default ConfirmExecutionModal;
