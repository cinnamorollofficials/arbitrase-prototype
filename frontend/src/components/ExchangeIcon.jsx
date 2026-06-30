import React from 'react';
import { EXCHANGE_ICONS } from '../constants/marketData';

export default function ExchangeIcon({ name, size = 28 }) {
  const [failed, setFailed] = React.useState(false);
  const src = EXCHANGE_ICONS[name];
  const style = { width: size, height: size, borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 };

  if (!src || failed) {
    return (
      <div style={{ ...style, background: 'linear-gradient(135deg, #455a64, #607d8b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: '800', color: '#fff' }}>
        {(name || '?').slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={src} alt={name} onError={() => setFailed(true)} style={style} />;
}
