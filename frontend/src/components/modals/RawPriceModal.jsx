function RawPriceModal(props) {
  const {
    error,
    loading,
    setShowRawModal,
    showRawModal,
    rawModalExchange,
    rawModalSymbol,
    rawModalLoading,
    rawModalError,
    rawModalData,
  } = props;

  return (
    <>
      {/* Redis Raw Prices Modal */}
      {showRawModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="md3-card" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '85vh',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: 'var(--md-sys-elevation-3)',
            padding: '24px',
            borderRadius: 'var(--md-shape-corner-large)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--md-sys-color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📄</span> Raw JSON Detail - {rawModalExchange} ({rawModalSymbol})
              </h2>
              <button 
                onClick={() => setShowRawModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              >
                &times;
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rawModalLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
                  <div className="status-indicator loading" style={{ width: '24px', height: '24px' }}></div>
                  <span style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>Mengambil raw data dari Redis...</span>
                </div>
              )}

              {rawModalError && (
                <div style={{
                  backgroundColor: 'rgba(239, 83, 80, 0.08)',
                  border: '1px solid var(--md-sys-color-error)',
                  borderRadius: 'var(--md-shape-corner-medium)',
                  padding: '16px',
                  color: 'var(--md-sys-color-error)',
                  fontSize: '13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontWeight: 'bold' }}>⚠️ Gagal Memuat Data dari Redis</div>
                  <div>{rawModalError}</div>
                  <div style={{ fontSize: '11px', opacity: 0.8, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    Pastikan server Redis berjalan secara lokal di port 6379, dan coba jalankan kembali crawler harga di dashboard.
                  </div>
                </div>
              )}

              {rawModalData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span>Redis Key: <code style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}>{rawModalData.key}</code></span>
                    <span>Waktu Log: {rawModalData.data?.timestamp ? new Date(rawModalData.data.timestamp).toLocaleString('id-ID') : '-'}</span>
                  </div>

                  {rawModalData.data?.url && (
                    <div style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', wordBreak: 'break-all' }}>
                      <span style={{ fontWeight: 'bold' }}>Request URL:</span> <a href={rawModalData.data.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--md-sys-color-primary)', textDecoration: 'underline' }}>{rawModalData.data.url}</a>
                    </div>
                  )}

                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--md-sys-color-on-surface)', display: 'block', marginBottom: '6px' }}>Raw JSON Response:</span>
                    <pre style={{
                      margin: 0,
                      padding: '16px',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'Consolas, Monaco, monospace',
                      overflowX: 'auto',
                      maxHeight: '350px',
                      color: '#a9b2c3',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}>
                      {JSON.stringify(rawModalData.data?.specificDexRaw || rawModalData.data?.raw || rawModalData.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <button
                onClick={() => setShowRawModal(false)}
                className="tab-btn"
                style={{
                  backgroundColor: 'var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-on-primary)',
                  padding: '8px 24px',
                  borderRadius: 'var(--md-shape-corner-full)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}


    </>
  );
}

export default RawPriceModal;
