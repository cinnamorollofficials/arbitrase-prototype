function PriceSparkline({ history }) {
  const points = Array.isArray(history)
    ? history
        .map((point) => ({
          t: Number(point.t),
          price: Number(point.price)
        }))
        .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.price) && point.price > 0)
        .sort((a, b) => a.t - b.t)
    : [];

  if (points.length < 2) {
    return (
      <div className="price-sparkline is-empty" title="Menunggu minimal 2 titik harga">
        <span>Mengumpulkan</span>
      </div>
    );
  }

  const width = 104;
  const height = 34;
  const padding = 3;
  const prices = points.map((point) => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || Math.max(maxPrice * 0.0001, 1);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const path = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((point.price - minPrice) / range) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
  const firstPrice = points[0].price;
  const lastPrice = points[points.length - 1].price;
  const changePct = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const trendClass = changePct > 0 ? 'is-up' : changePct < 0 ? 'is-down' : 'is-flat';
  const title = `${points.length} titik harga, perubahan ${changePct.toFixed(2)}%`;

  return (
    <div className={`price-sparkline ${trendClass}`} title={title}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path className="price-sparkline-baseline" d={`M ${padding} ${height - padding} L ${width - padding} ${height - padding}`} />
        <path className="price-sparkline-line" d={path} />
      </svg>
      <span>{changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%</span>
    </div>
  );
}

export default PriceSparkline;
