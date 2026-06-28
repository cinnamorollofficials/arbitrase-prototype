import React, { useState, useEffect, useMemo } from 'react';

const getHeaderGradient = (symbol) => {
  switch (symbol) {
    case 'SOL':
      return 'linear-gradient(135deg, #14F195, #9945FF)';
    case 'ETH':
      return 'linear-gradient(135deg, #627EEA, #C0CEFF)';
    case 'PEPE':
      return 'linear-gradient(135deg, #4CAF50, #81C784)';
    case 'BONK':
      return 'linear-gradient(135deg, #F57C00, #FFB74D)';
    case 'WIF':
      return 'linear-gradient(135deg, #9E9E9E, #E0E0E0)';
    case 'FLOKI':
      return 'linear-gradient(135deg, #FFB300, #FFE082)';
    case 'SHIB':
      return 'linear-gradient(135deg, #FF5722, #FFAB91)';
    case 'JUP':
      return 'linear-gradient(135deg, #00B0FF, #00E5FF)';
    case 'W':
      return 'linear-gradient(135deg, #9C27B0, #E040FB)';
    case 'RENDER':
      return 'linear-gradient(135deg, #FF007A, #FF7BB8)';
    case 'POPCAT':
      return 'linear-gradient(135deg, #78909C, #B0BEC5)';
    case 'MEW':
      return 'linear-gradient(135deg, #00ACC1, #80DEEA)';
    case 'ENA':
      return 'linear-gradient(135deg, #212121, #757575)';
    case 'ONDO':
      return 'linear-gradient(135deg, #26A69A, #80CBC4)';
    default:
      return 'linear-gradient(135deg, #a2c9ff, #dcbce2)';
  }
};

function App() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CEX' | 'DEX'
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [capital, setCapital] = useState(10000); // Default capital $10,000 USD
  const [activeSymbol, setActiveSymbol] = useState('USDT'); // Active asset: USDT, SOL, ETH, PEPE, BONK, WIF, FLOKI, SHIB, JUP, W, RENDER, POPCAT, MEW, ENA, ONDO

  // Fetch prices from backend
  const fetchPrices = async (symbol = activeSymbol, silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5001/api/prices?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const json = await response.json();
      
      // Filter out any exchanges that failed to fetch price
      const validPrices = (json.data || []).map(item => ({
        ...item,
        price: item.price ? parseFloat(item.price) : null,
        bid: item.bid ? parseFloat(item.bid) : null,
        ask: item.ask ? parseFloat(item.ask) : null
      }));

      setPrices(validPrices);
      setLastUpdated(new Date(json.timestamp || Date.now()));
      setRefreshCountdown(10); // Reset countdown
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Gagal mengambil data harga. Pastikan server backend berjalan.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch prices when activeSymbol changes
  useEffect(() => {
    fetchPrices(activeSymbol);
  }, [activeSymbol]);

  // Countdown timer for auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchPrices(activeSymbol, true); // Silent refresh
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSymbol]);

  const handleAssetChange = (sym) => {
    setActiveSymbol(sym);
    setPrices([]); // Show loading skeletons
  };

  // Filtered prices list
  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      if (filter === 'CEX') return p.type === 'CEX';
      if (filter === 'DEX') return p.type === 'DEX';
      return true;
    });
  }, [prices, filter]);

  // Compute Arbitrage Stats
  const stats = useMemo(() => {
    // Only calculate using successful prices
    const activePrices = prices.filter(p => p.status === 'success' && p.price !== null && p.bid !== null && p.ask !== null);
    if (activePrices.length < 2) return { average: 0, lowestAsk: null, highestBid: null, spreadPct: 0, spreadUsd: 0 };

    let lowestAsk = activePrices[0];
    let highestBid = activePrices[0];
    let sum = 0;

    activePrices.forEach(p => {
      sum += p.price;
      if (p.ask < lowestAsk.ask) lowestAsk = p;
      if (p.bid > highestBid.bid) highestBid = p;
    });

    const average = sum / activePrices.length;
    
    // Arbitrage spread = Highest Sell Price (Bid) - Lowest Buy Price (Ask)
    const spreadUsd = highestBid.bid - lowestAsk.ask;
    const spreadPct = (spreadUsd / lowestAsk.ask) * 100;

    return {
      average,
      lowestAsk,
      highestBid,
      spreadPct,
      spreadUsd
    };
  }, [prices]);

  // Compute Net Profit after fee deductions
  const netCalculation = useMemo(() => {
    if (!stats.lowestAsk || !stats.highestBid) return { gross: 0, fees: 0, net: 0, isCrossChain: false };
    
    const gross = capital * (stats.spreadPct / 100);
    
    // Determine if cross-chain
    const isDexA = stats.lowestAsk.type === 'DEX';
    const isDexB = stats.highestBid.type === 'DEX';
    
    let isCrossChain = false;
    if (isDexA && isDexB) {
      const getChainName = (name) => {
        if (name.includes('Uniswap')) return 'ethereum';
        if (name.includes('Pancake')) return 'bsc';
        if (name.includes('Raydium') || name.includes('Orca')) return 'solana';
        return 'unknown';
      };
      isCrossChain = getChainName(stats.lowestAsk.name) !== getChainName(stats.highestBid.name);
    } else {
      // CEX to DEX, DEX to CEX, or CEX to CEX is always cross-chain transfer
      isCrossChain = true;
    }

    const swapFee = capital * 0.0002; // 0.01% Pancake V3 + 0.01% Raydium V3 / typical CEX fee
    const bridgeFee = isCrossChain ? (capital * 0.0005) : 0; // 0.05% bridge fee
    const gasFee = isCrossChain ? 1.00 : 0.10; // $1 flat fee (BSC + Solana gas/bridge claims) vs $0.10 same-chain gas
    
    const totalFees = swapFee + bridgeFee + gasFee;
    const net = gross - totalFees;

    return {
      gross,
      fees: totalFees,
      net,
      isCrossChain
    };
  }, [stats, capital]);

  const handleManualRefresh = () => {
    fetchPrices();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo" style={{ background: getHeaderGradient(activeSymbol) }}>
            {activeSymbol[0]}
          </div>
          <div>
            <h1 className="brand-title">{activeSymbol} Arbitrage</h1>
            <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              12 Bursa Utama CEX & DEX (Priced in {activeSymbol === 'USDT' ? 'USD/USDC' : 'USDT'})
            </p>
          </div>
        </div>

        <div className="sync-status-container">
          <div className="status-chip">
            <span className={`status-indicator ${isRefreshing ? 'loading' : ''}`}></span>
            {isRefreshing ? 'Memperbarui...' : `Auto-refresh dalam ${refreshCountdown}s`}
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)' }}>
              Update: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {/* Asset Selector Row (Moved Below Header to Avoid Overflow) */}
      <div className="asset-selector-row" style={{ marginBottom: '24px' }}>
        <div className="asset-selector-container" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--md-sys-color-surface-container-high)', padding: '6px', borderRadius: 'var(--md-shape-corner-full)', border: '1px solid var(--md-sys-color-outline-variant)', overflowX: 'auto', maxWidth: '100%', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
          {['USDT', 'SOL', 'ETH', 'PEPE', 'BONK', 'WIF', 'FLOKI', 'SHIB', 'JUP', 'W', 'RENDER', 'POPCAT', 'MEW', 'ENA', 'ONDO'].map(sym => (
            <button
              key={sym}
              onClick={() => handleAssetChange(sym)}
              className="tab-btn"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                backgroundColor: activeSymbol === sym ? 'var(--md-sys-color-primary-container)' : 'transparent',
                color: activeSymbol === sym ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                borderRadius: 'var(--md-shape-corner-full)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

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
            <div className="summary-label">Harga Rata-Rata (Last)</div>
            <div className="summary-value">${stats.average.toFixed(5)}</div>
            <div className="summary-subtext">Dari bursa yang berhasil terhubung</div>
            <div className="countdown-line" style={{ width: `${(refreshCountdown / 10) * 100}%` }}></div>
          </div>

          {/* Max Spread % */}
          <div className="md3-card summary-card">
            <div className="summary-label">Spread Arbitrase Eksekusi</div>
            <div className="summary-value" style={{ color: stats.spreadPct > 0 ? 'var(--color-profit-green)' : 'inherit' }}>
              {stats.spreadPct > 0 ? `+${stats.spreadPct.toFixed(3)}%` : `${stats.spreadPct.toFixed(3)}%`}
            </div>
            <div className="summary-subtext">
              Selisih nominal: ${stats.spreadUsd.toFixed(5)}
            </div>
            {stats.spreadPct > 0.05 && (
              <span className="badge badge-dex" style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '10px' }}>
                PROFIT PELUANG
              </span>
            )}
          </div>

          {/* Arbitrage Route Recommendation */}
          <div className={`md3-card summary-card ${netCalculation.net > 0 ? 'rec-card' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="summary-label">Rekomendasi Rute & Net Profit</div>
            {stats.lowestAsk && stats.highestBid ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="rec-path">
                  <div className="rec-node">{stats.lowestAsk.name}</div>
                  <div className="rec-arrow">➔</div>
                  <div className="rec-node">{stats.highestBid.name}</div>
                </div>
                
                {/* Capital Input Field */}
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

                {/* Net Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Profit Kotor (Gross):</span>
                    <span style={{ color: netCalculation.gross > 0 ? 'var(--color-profit-green)' : 'inherit', fontWeight: '600' }}>
                      {netCalculation.gross >= 0 ? '+' : ''}${netCalculation.gross.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Estimasi Biaya (Fee):</span>
                    <span style={{ color: 'var(--md-sys-color-error)', fontWeight: '600' }}>
                      -${netCalculation.fees.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '3px' }}>
                    <span>Net Profit/Loss:</span>
                    <span style={{ color: netCalculation.net > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
                      {netCalculation.net >= 0 ? '+' : ''}${netCalculation.net.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="summary-value" style={{ fontSize: '18px' }}>Mencari peluang...</div>
            )}
          </div>
        </div>
      )}

      {/* Main Table Section */}
      <div className="md3-card table-card">
        <div className="table-header-section">
          <h2 className="table-title">Perbandingan Order Book CEX & DEX</h2>
          
          {/* Filter Tabs */}
          <div className="tabs-container">
            <button 
              className={`tab-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              Semua
            </button>
            <button 
              className={`tab-btn ${filter === 'CEX' ? 'active' : ''}`}
              onClick={() => setFilter('CEX')}
            >
              CEX Only
            </button>
            <button 
              className={`tab-btn ${filter === 'DEX' ? 'active' : ''}`}
              onClick={() => setFilter('DEX')}
            >
              DEX Only
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-wrapper">
          <table className="md3-table">
            <thead>
              <tr>
                <th>Bursa / Exchange</th>
                <th>Jenis</th>
                <th>Pasangan</th>
                <th>Beli (Ask)</th>
                <th>Jual (Bid)</th>
                <th>Deviasi Rata-Rata (Last)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && prices.length === 0 ? (
                // Table Loading Skeletons
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text" style={{ width: '120px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '70px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '18px' }}></div></td>
                    <td><div className="skeleton skeleton-text" style={{ width: '80px', height: '18px' }}></div></td>
                  </tr>
                ))
              ) : (
                filteredPrices.map((item) => {
                  const isLowestAsk = stats.lowestAsk && stats.lowestAsk.name === item.name;
                  const isHighestBid = stats.highestBid && stats.highestBid.name === item.name;
                  
                  // Calculate deviation of last price from average
                  let deviation = 0;
                  if (item.price && stats.average) {
                    deviation = ((item.price - stats.average) / stats.average) * 100;
                  }

                  return (
                    <tr 
                      key={item.name}
                      style={{
                        backgroundColor: isLowestAsk 
                          ? 'rgba(52, 211, 153, 0.03)' 
                          : isHighestBid 
                            ? 'rgba(248, 113, 113, 0.03)' 
                            : 'transparent'
                      }}
                    >
                      {/* Exchange Name */}
                      <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        {item.name}
                        {item.source === 'coingecko' && (
                          <span className="badge badge-source">via CG</span>
                        )}
                      </td>
                      
                      {/* Type Badge */}
                      <td>
                        <span className={`badge ${item.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                          {item.type}
                        </span>
                      </td>

                      {/* Trading Pair */}
                      <td style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                        {item.pair}
                      </td>

                      {/* Ask Price (Buy Price) */}
                      <td>
                        {item.status === 'success' && item.ask !== null ? (
                          <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit' }}>
                            ${item.ask.toFixed(5)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-error)', fontStyle: 'italic' }}>
                            Error
                          </span>
                        )}
                      </td>

                      {/* Bid Price (Sell Price) */}
                      <td>
                        {item.status === 'success' && item.bid !== null ? (
                          <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit' }}>
                            ${item.bid.toFixed(5)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-error)', fontStyle: 'italic' }}>
                            Error
                          </span>
                        )}
                      </td>

                      {/* Average Deviation */}
                      <td>
                        {item.status === 'success' && item.price !== null ? (
                          <span className={`deviation-tag ${deviation >= 0 ? 'positive' : 'negative'}`}>
                            {deviation >= 0 ? '+' : ''}{deviation.toFixed(4)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Action / Indicators */}
                      <td>
                        {item.status === 'success' ? (
                          isLowestAsk ? (
                            <span className="price-badge lowest">Beli Terendah (Ask)</span>
                          ) : isHighestBid ? (
                            <span className="price-badge highest">Jual Tertinggi (Bid)</span>
                          ) : (
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Stabil</span>
                          )
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-error)', fontSize: '12px' }} title={item.message}>
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Floating Action Button (FAB) for manual refresh */}
      <button 
        className={`md3-fab ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        aria-label="Refresh harga secara manual"
      >
        <svg className="fab-icon" viewBox="0 0 24 24">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
        <span>Refresh Sekarang</span>
      </button>
    </div>
  );
}

export default App;
