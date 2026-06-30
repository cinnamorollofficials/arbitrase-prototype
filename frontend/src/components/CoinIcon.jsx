import React from 'react';
import { COIN_ICONS, SYMBOL_COLORS } from '../constants/marketData';

export default function CoinIcon({ symbol, size = 28, round = true }) {
  const [failed, setFailed] = React.useState(false);
  const src = COIN_ICONS[symbol];
  const color = SYMBOL_COLORS[symbol] || '#607D8B';
  const radius = round ? '50%' : '6px';
  const style = { width: size, height: size, borderRadius: radius, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 };

  if (!src || failed) {
    return (
      <div style={{ ...style, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
        {(symbol || '?').slice(0, 2)}
      </div>
    );
  }
  return <img src={src} alt={symbol} onError={() => setFailed(true)} style={style} />;
}
