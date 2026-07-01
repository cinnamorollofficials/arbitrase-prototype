function Breadcrumbs({ exchangeName, onBackToExchanges }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: '0 0 20px',
        fontSize: '13px',
        color: 'var(--md-sys-color-on-surface-variant)'
      }}
    >
      <button
        onClick={onBackToExchanges}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: 'var(--md-sys-color-primary)',
          fontSize: '13px',
          fontWeight: '800',
          cursor: 'pointer'
        }}
      >
        Exchanges
      </button>
      <span>/</span>
      <span style={{ color: '#ffffff', fontWeight: '800' }}>{exchangeName}</span>
    </nav>
  );
}

export default Breadcrumbs;
