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

const formatRupiah = (usdVal, rate) => {
  if (usdVal === null || usdVal === undefined || isNaN(usdVal)) return '';
  const idrVal = usdVal * rate;
  if (idrVal < 0.01) {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  } else if (idrVal < 10) {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } else {
    return 'Rp ' + idrVal.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
};

const defaultSymbols = ['USDT', 'SOL', 'ETH', 'PEPE', 'BONK', 'WIF', 'FLOKI', 'SHIB', 'JUP', 'W', 'RENDER', 'POPCAT', 'MEW', 'ENA', 'ONDO'];

const COIN_ICONS = {
  USDC:   'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT:   'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  SOL:    'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ETH:    'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB:    'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  PEPE:   'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  BONK:   'https://assets.coingecko.com/coins/images/28600/small/bonk.jpg',
  POPCAT: 'https://assets.coingecko.com/coins/images/36766/small/popcat.png',
  RENDER: 'https://assets.coingecko.com/coins/images/11636/small/rndr.png',
  W:      'https://assets.coingecko.com/coins/images/35514/small/wormhole.png',
  FLOKI:  'https://assets.coingecko.com/coins/images/16746/small/FLOKI.png',
  NEIRO:  'https://assets.coingecko.com/coins/images/39392/small/NEIRO.png',
  MOG:    'https://assets.coingecko.com/coins/images/31059/small/mog.png',
  GIGA:   'https://assets.coingecko.com/coins/images/36477/small/gigachad.png',
  TURBO:  'https://assets.coingecko.com/coins/images/29445/small/turbo.png',
  FWOG:   'https://assets.coingecko.com/coins/images/39272/small/fwog.png',
  BRETT:  'https://assets.coingecko.com/coins/images/36310/small/brett.png',
  FDUSD:  'https://assets.coingecko.com/coins/images/31079/small/firstdigital.png',
  USDE:   'https://assets.coingecko.com/coins/images/33613/small/USDE.png',
  PYUSD:  'https://assets.coingecko.com/coins/images/31212/small/PYUSD.png',
};

const EXCHANGE_ICONS = {
  'Binance':     'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
  'Bybit':       'https://assets.coingecko.com/markets/images/698/small/bybit_spot.png',
  'Gate.io':     'https://assets.coingecko.com/markets/images/60/small/gate_io_logo1.jpg',
  'Raydium':     'https://assets.coingecko.com/coins/images/13928/small/PSigc4ie_400x400.jpg',
  'Uniswap':     'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  'PancakeSwap': 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
};

const SYMBOL_COLORS = {
  USDC: '#2775CA', USDT: '#26A17B', SOL: '#9945FF', ETH: '#627EEA',
  BNB: '#F0B90B', PEPE: '#4CAF50', BONK: '#F57C00', POPCAT: '#78909C',
  RENDER: '#FF007A', W: '#9C27B0', FLOKI: '#FFB300', NEIRO: '#FF6F00',
  MOG: '#E91E63', GIGA: '#3F51B5', TURBO: '#00BCD4', FWOG: '#388E3C',
  BRETT: '#5D4037', FDUSD: '#1565C0', USDE: '#37474F', PYUSD: '#1976D2',
};

function CoinIcon({ symbol, size = 28, round = true }) {
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

function ExchangeIcon({ name, size = 28 }) {
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

const TX_STEPS = [
  { label: 'Inisiasi', desc: 'Antrean Terbuka' },
  { label: 'Cek Saldo', desc: 'Verifikasi Modal' },
  { label: 'Eksekusi Beli', desc: 'Beli di Bursa Murah' },
  { label: 'Kirim Aset', desc: 'Transfer Lintas Bursa' },
  { label: 'Eksekusi Jual', desc: 'Jual di Bursa Mahal' },
  { label: 'Selesai', desc: 'Profit Masuk Dompet' }
];

function App() {
  const [prices, setPrices] = useState([]);
  const [usdToIdrRate, setUsdToIdrRate] = useState(16500);
  const [symbolsList, setSymbolsList] = useState(defaultSymbols);
  const [spreads, setSpreads] = useState({});

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.IDR) {
            setUsdToIdrRate(data.rates.IDR);
          }
        }
      } catch (err) {
        console.error('Failed to fetch USD/IDR rate:', err);
      }
    };
    fetchExchangeRate();
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CEX' | 'DEX'
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [capital, setCapital] = useState(10000); // Default capital $10,000 USD
  const [activeSymbol, setActiveSymbol] = useState('USDT'); // Active asset: USDT, SOL, ETH, PEPE, BONK, WIF, FLOKI, SHIB, JUP, W, RENDER, POPCAT, MEW, ENA, ONDO
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'queue'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('arbitrage_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [hoveredExchange, setHoveredExchange] = useState(null);
  const [exchangeBalances, setExchangeBalances] = useState(() => {
    const saved = localStorage.getItem('arbitrage_balances');
    if (saved) return JSON.parse(saved);
    return {
      Binance: { USDC: 15420.50, ETH: 0.45, PEPE: 12500000, status: 'Online', latency: '52ms', type: 'CEX', network: 'Ethereum/BSC/Solana', apiStatus: 'Terkoneksi', fee: 'Spot: 0.1% | Penarikan: $1.0' },
      Bybit: { USDC: 10200.00, SOL: 12.40, BONK: 5600000, status: 'Online', latency: '84ms', type: 'CEX', network: 'Ethereum/BSC/Solana', apiStatus: 'Terkoneksi', fee: 'Spot: 0.1% | Penarikan: $1.0' },
      'Gate.io': { USDC: 4150.25, RENDER: 12.0, POPCAT: 85000, status: 'Online', latency: '120ms', type: 'CEX', network: 'Ethereum/BSC/Solana', apiStatus: 'Terkoneksi', fee: 'Spot: 0.2% | Penarikan: $1.5' },
      Raydium: { USDC: 12850.10, SOL: 45.82, BONK: 15400000, status: 'Online', latency: '8ms', type: 'DEX', network: 'Solana (SPL)', apiStatus: 'Phantom Connected', fee: 'Swap: 0.25% | Gas: ~0.00005 SOL' },
      Uniswap: { USDC: 3450.00, ETH: 1.15, W: 500000, status: 'Online', latency: '15ms', type: 'DEX', network: 'Ethereum/Arbitrum', apiStatus: 'MetaMask Connected', fee: 'Swap: 0.3% | Gas: ~0.002 ETH' },
      PancakeSwap: { USDC: 1820.75, BNB: 2.40, FLOKI: 2500000, status: 'Online', latency: '22ms', type: 'DEX', network: 'BNB Chain (BEP20)', apiStatus: 'MetaMask Connected', fee: 'Swap: 0.25% | Gas: ~0.0008 BNB' }
    };
  });
  const [agentStatus, setAgentStatus] = useState('running');
  const [minSpreadCriteria, setMinSpreadCriteria] = useState(1.5);
  const [numAgents, setNumAgents] = useState(1);
  const [coinCategory, setCoinCategory] = useState('ALL');
  const [agentLogs, setAgentLogs] = useState([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Memulai agen AI pemindai spreads...`,
    `[${new Date().toLocaleTimeString()}] [INFO] Kriteria: Min Spread > 1.50%`
  ]);
  const [discoveredCoins, setDiscoveredCoins] = useState([
    { symbol: 'NEIRO', name: 'Neiro Solana', spread: 3.45, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN', added: false },
    { symbol: 'MOG', name: 'Mog Coin', spread: 3.12, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN', added: false }
  ]);

  const coinAssets = useMemo(() => {
    const coins = {};
    const coinMeta = {
      USDC: { name: 'USD Coin',        category: 'STABLE',      icon: COIN_ICONS.USDC,   price: 1.0 },
      SOL:  { name: 'Solana',           category: 'FLUKTUATIF',  icon: COIN_ICONS.SOL,    price: 145.20 },
      ETH:  { name: 'Ethereum',         category: 'FLUKTUATIF',  icon: COIN_ICONS.ETH,    price: 3450.00 },
      BNB:  { name: 'Binance Coin',     category: 'FLUKTUATIF',  icon: COIN_ICONS.BNB,    price: 580.00 },
      PEPE: { name: 'Pepe',             category: 'MICIN',       icon: COIN_ICONS.PEPE,   price: 0.0000125 },
      BONK: { name: 'Bonk',             category: 'MICIN',       icon: COIN_ICONS.BONK,   price: 0.0000215 },
      POPCAT:{ name: 'Popcat',          category: 'MICIN',       icon: COIN_ICONS.POPCAT, price: 0.85 },
      RENDER:{ name: 'Render Token',    category: 'FLUKTUATIF',  icon: COIN_ICONS.RENDER, price: 7.45 },
      W:    { name: 'Wormhole',         category: 'FLUKTUATIF',  icon: COIN_ICONS.W,      price: 0.35 },
      FLOKI:{ name: 'Floki Inu',        category: 'MICIN',       icon: COIN_ICONS.FLOKI,  price: 0.000175 },
      NEIRO:{ name: 'Neiro Solana',     category: 'MICIN',       icon: COIN_ICONS.NEIRO,  price: 0.00145 },
      MOG:  { name: 'Mog Coin',         category: 'MICIN',       icon: COIN_ICONS.MOG,    price: 0.0000018 },
      GIGA: { name: 'GigaChad',         category: 'MICIN',       icon: COIN_ICONS.GIGA,   price: 0.042 },
      TURBO:{ name: 'Turbo',            category: 'FLUKTUATIF',  icon: COIN_ICONS.TURBO,  price: 0.0052 },
      FWOG: { name: 'Fwog',             category: 'MICIN',       icon: COIN_ICONS.FWOG,   price: 0.023 },
      BRETT:{ name: 'Brett',            category: 'FLUKTUATIF',  icon: COIN_ICONS.BRETT,  price: 0.125 },
      FDUSD:{ name: 'First Digital USD',category: 'STABLE',      icon: COIN_ICONS.FDUSD,  price: 1.0 },
      USDE: { name: 'Athena USDe',      category: 'STABLE',      icon: COIN_ICONS.USDE,   price: 1.0 },
      PYUSD:{ name: 'PayPal USD',       category: 'STABLE',      icon: COIN_ICONS.PYUSD,  price: 1.0 },
    };

    Object.entries(exchangeBalances).forEach(([exName, info]) => {
      Object.entries(info).forEach(([key, val]) => {
        if (['status', 'latency', 'type', 'network', 'apiStatus', 'fee'].includes(key)) return;
        
        if (!coins[key]) {
          coins[key] = {
            symbol: key,
            name: coinMeta[key]?.name || key,
            category: coinMeta[key]?.category || 'VOLATILE',
            icon: coinMeta[key]?.icon || COIN_ICONS.USDT || null,
            price: coinMeta[key]?.price || 1.0,
            total: 0,
            breakdown: []
          };
        }
        
        if (val > 0) {
          coins[key].total += val;
          coins[key].breakdown.push({ exName, amount: val });
        }
      });
    });

    return Object.values(coins);
  }, [exchangeBalances]);

  const mockAvailableCoins = useMemo(() => [
    { symbol: 'GIGA', name: 'GigaChad', spread: 2.84, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN' },
    { symbol: 'TURBO', name: 'Turbo', spread: 2.50, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'VOLATILE' },
    { symbol: 'FWOG', name: 'Fwog', spread: 2.91, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN' },
    { symbol: 'BRETT', name: 'Brett', spread: 1.85, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'VOLATILE' },
    { symbol: 'FDUSD', name: 'First Digital USD', spread: 0.12, buyEx: 'Binance', sellEx: 'Bybit', category: 'STABLE' },
    { symbol: 'USDE', name: 'Athena USDe', spread: 0.45, buyEx: 'Gate.io', sellEx: 'Bybit', category: 'STABLE' },
    { symbol: 'PYUSD', name: 'PayPal USD', spread: 0.28, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'STABLE' }
  ], []);

  // AI Agent Log & Discovery Simulator
  useEffect(() => {
    if (agentStatus !== 'running') return;

    let logCounter = 0;
    const intervalSpeed = Math.max(1200, 6000 / numAgents);

    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      const agentId = Math.floor(Math.random() * numAgents) + 1;
      
      let logOptions = [];
      if (coinCategory === 'MICIN') {
        logOptions = [
          `Menelusuri token micin di blockchain Solana via Raydium...`,
          `Memeriksa volume likuiditas meme pools baru di Raydium...`,
          `Menganalisis transaksi paus (whale tracker) koin meme...`,
          `Menghitung deviasi harga DEX vs CEX MEXC...`
        ];
      } else if (coinCategory === 'STABLE') {
        logOptions = [
          `Memindai de-pegging minor stablecoin di Curve pools...`,
          `Memeriksa selisih harga USDC/USDT lintas bursa...`,
          `Menganalisis order book kedalaman besar di Binance...`,
          `Menghitung arbitrase aman pasangan stablecoin fiat...`
        ];
      } else if (coinCategory === 'VOLATILE') {
        logOptions = [
          `Memindai pasangan baru listing di Gate.io & OKX...`,
          `Menganalisis fluktuasi harga ekstrim koin lapis kedua...`,
          `Mendeteksi volatilitas tinggi pasangan token BNB Chain...`,
          `Menghitung spread arbitrase cepat pasca peluncuran koin...`
        ];
      } else {
        logOptions = [
          `Menelusuri koin baru terdaftar di Raydium & Uniswap...`,
          `Memeriksa pasangan token baru di Gate.io & MEXC...`,
          `Menganalisis likuiditas & volume perdagangan token micin...`,
          `Menghitung penyimpangan harga antar bursa...`,
          `Memindai de-pegging minor stablecoin di Curve pools...`,
          `Memeriksa selisih harga USDC/USDT lintas bursa...`
        ];
      }

      const randomLog = logOptions[Math.floor(Math.random() * logOptions.length)];
      setAgentLogs(prev => [`[${time}] [AGENT #${agentId}] [SCAN] ${randomLog}`, ...prev.slice(0, 49)]);
      
      if (logCounter > 0 && logCounter % 3 === 0) {
        const nextCoin = mockAvailableCoins.find(
          c => !discoveredCoins.some(d => d.symbol === c.symbol) && 
               c.spread >= minSpreadCriteria &&
               (coinCategory === 'ALL' || c.category === coinCategory)
        );
        if (nextCoin) {
          setDiscoveredCoins(prev => [
            { ...nextCoin, added: false },
            ...prev
          ]);
          setAgentLogs(prev => [
            `[${time}] [AGENT #${agentId}] [🏆 MATCH] Menemukan koin potensial: ${nextCoin.symbol} (${nextCoin.category}) dengan spread +${nextCoin.spread.toFixed(2)}%!`,
            ...prev
          ]);
        }
      }

      logCounter++;
    }, intervalSpeed);

    return () => clearInterval(interval);
  }, [agentStatus, discoveredCoins, minSpreadCriteria, mockAvailableCoins, numAgents, coinCategory]);

  const handleAddMockCoin = (coin) => {
    if (!symbolsList.includes(coin.symbol)) {
      const updatedSymbols = [...symbolsList, coin.symbol];
      setSymbolsList(updatedSymbols);
      
      setSpreads(prev => ({
        ...prev,
        [coin.symbol]: coin.spread
      }));

      setDiscoveredCoins(prev => prev.map(c => c.symbol === coin.symbol ? { ...c, added: true } : c));
      
      setAgentLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [SYSTEM] Token ${coin.symbol} berhasil ditambahkan ke Daftar Utama!`,
        ...prev
      ]);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  const handleExecuteTransaction = () => {
    const buyExchange = stats.lowestAsk?.name;
    const sellExchange = stats.highestBid?.name;
    
    if (buyExchange && sellExchange) {
      setExchangeBalances(prevBalances => {
        const updated = { ...prevBalances };
        if (updated[buyExchange]) {
          updated[buyExchange] = {
            ...updated[buyExchange],
            USDC: Math.max(0, updated[buyExchange].USDC - capital)
          };
        }
        if (updated[sellExchange]) {
          updated[sellExchange] = {
            ...updated[sellExchange],
            USDC: updated[sellExchange].USDC + capital + netCalculation.net
          };
        }
        localStorage.setItem('arbitrage_balances', JSON.stringify(updated));
        return updated;
      });
    }

    const newTx = {
      id: 'TX-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      symbol: activeSymbol,
      buyEx: buyExchange || 'N/A',
      sellEx: sellExchange || 'N/A',
      capital: capital,
      grossProfit: netCalculation.gross,
      fees: netCalculation.fees,
      netProfit: netCalculation.net,
      status: 'Dalam Antrean',
      stepIndex: 0
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem('arbitrage_transactions', JSON.stringify(updated));
    setShowConfirmModal(false);
    
    // Auto-focus and open the new transaction pipeline
    setExpandedTxId(newTx.id);
    setActiveTab('queue');
  };

  // Background transaction pipeline simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prevTxs) => {
        let changed = false;
        const updated = prevTxs.map((tx) => {
          const currentStep = tx.stepIndex !== undefined ? tx.stepIndex : 0;
          if (currentStep < 5) {
            changed = true;
            const nextStep = currentStep + 1;
            let newStatus = 'Diproses';
            if (nextStep === 5) {
              newStatus = 'Selesai';
            }
            return {
              ...tx,
              stepIndex: nextStep,
              status: newStatus
            };
          }
          return tx;
        });
        if (changed) {
          localStorage.setItem('arbitrage_transactions', JSON.stringify(updated));
          return updated;
        }
        return prevTxs;
      });
    }, 4000); // Progress every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch prices from backend
  const fetchPrices = async (symbol = activeSymbol, silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);

    // Intercept mock coins discovered by AI Agent to return simulated prices locally
    if (['GIGA', 'TURBO', 'FWOG', 'BRETT', 'NEIRO', 'MOG', 'FDUSD', 'USDE', 'PYUSD'].includes(symbol)) {
      const mockRates = {
        NEIRO: { price: 0.0034, spread: 3.45 },
        MOG: { price: 0.00000185, spread: 3.12 },
        GIGA: { price: 0.045, spread: 2.84 },
        TURBO: { price: 0.0052, spread: 2.50 },
        FWOG: { price: 0.0125, spread: 2.91 },
        BRETT: { price: 0.085, spread: 1.85 },
        FDUSD: { price: 1.00, spread: 0.12 },
        USDE: { price: 0.998, spread: 0.45 },
        PYUSD: { price: 1.001, spread: 0.28 }
      };
      
      const config = mockRates[symbol] || { price: 0.05, spread: 2.0 };
      const p = config.price;
      const s = config.spread / 100;

      const mockData = [
        { name: 'Binance', type: 'CEX', pair: `${symbol}/USDT`, price: p, bid: p * 0.999, ask: p * 1.001, status: 'success', source: 'direct' },
        { name: 'Bybit', type: 'CEX', pair: `${symbol}/USDT`, price: p * (1 - s/2), bid: p * (1 - s/2) * 0.999, ask: p * (1 - s/2) * 1.001, status: 'success', source: 'direct' },
        { name: 'Gate.io', type: 'CEX', pair: `${symbol}/USDT`, price: p * (1 + s/2), bid: p * (1 + s/2) * 0.999, ask: p * (1 + s/2) * 1.001, status: 'success', source: 'direct' },
        { name: 'Raydium', type: 'DEX', pair: `${symbol}/USDT`, price: p, bid: p * 0.999, ask: p * 1.001, status: 'success', source: 'dexscreener' }
      ];

      setTimeout(() => {
        setPrices(mockData);
        setLastUpdated(new Date());
        setRefreshCountdown(10);
        setLoading(false);
        setIsRefreshing(false);
      }, 400);
      return;
    }

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

      // Update spreads and sort symbols list dynamically
      if (json.spreads) {
        setSpreads(json.spreads);
        const sorted = [...defaultSymbols].sort((a, b) => {
          const spreadA = json.spreads[a] || 0;
          const spreadB = json.spreads[b] || 0;
          return spreadB - spreadA;
        });
        setSymbolsList(sorted);
      }
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

  // Sorted prices list
  const sortedPrices = useMemo(() => {
    let sortablePrices = [...filteredPrices];
    if (sortConfig.key !== null) {
      sortablePrices.sort((a, b) => {
        let valA, valB;
        
        switch (sortConfig.key) {
          case 'name':
            valA = a.name;
            valB = b.name;
            break;
          case 'type':
            valA = a.type;
            valB = b.type;
            break;
          case 'pair':
            valA = a.pair;
            valB = b.pair;
            break;
          case 'ask':
            valA = a.status === 'success' && a.ask !== null ? a.ask : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
            valB = b.status === 'success' && b.ask !== null ? b.ask : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
            break;
          case 'bid':
            valA = a.status === 'success' && a.bid !== null ? a.bid : (sortConfig.direction === 'asc' ? -Infinity : Infinity);
            valB = b.status === 'success' && b.bid !== null ? b.bid : (sortConfig.direction === 'asc' ? -Infinity : Infinity);
            break;
          case 'deviation':
            const devA = a.price && stats.average ? ((a.price - stats.average) / stats.average) * 100 : 0;
            const devB = b.price && stats.average ? ((b.price - stats.average) / stats.average) * 100 : 0;
            valA = a.status === 'success' ? devA : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
            valB = b.status === 'success' ? devB : (sortConfig.direction === 'asc' ? Infinity : -Infinity);
            break;
          case 'status':
            valA = a.status;
            valB = b.status;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortablePrices;
  }, [filteredPrices, sortConfig, stats.average]);

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
          {symbolsList.map(sym => {
            const spread = spreads[sym] || 0;
            return (
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
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CoinIcon symbol={sym} size={16} />
                {sym}
                {spread > 0 && (
                  <span style={{ 
                    fontSize: '10px', 
                    color: activeSymbol === sym ? 'var(--md-sys-color-primary)' : 'var(--color-profit-green)', 
                    fontWeight: '800' 
                  }}>
                    +{spread.toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
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
            <div style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px', fontWeight: '500' }}>
              {formatRupiah(stats.average, usdToIdrRate)}
            </div>
            <div className="summary-subtext" style={{ marginTop: '8px' }}>Dari bursa yang berhasil terhubung</div>
            <div className="countdown-line" style={{ width: `${(refreshCountdown / 10) * 100}%` }}></div>
          </div>

          {/* Max Spread % */}
          <div className="md3-card summary-card">
            <div className="summary-label">Spread Arbitrase Eksekusi</div>
            <div className="summary-value" style={{ color: stats.spreadPct > 0 ? 'var(--color-profit-green)' : 'inherit' }}>
              {stats.spreadPct > 0 ? `+${stats.spreadPct.toFixed(3)}%` : `${stats.spreadPct.toFixed(3)}%`}
            </div>
            <div className="summary-subtext">
              Selisih nominal: ${stats.spreadUsd.toFixed(5)} ({formatRupiah(stats.spreadUsd, usdToIdrRate)})
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

      {/* View Toggle Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
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
          📊 Perbandingan Bursa (Real-time)
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
          ⚙️ Antrean Transaksi ({transactions.length})
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
          🤖 Agen AI Scanner
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
          🏦 Saldo & Dompet
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
          🪙 Portofolio Koin
        </button>
      </div>

      {/* Main Table Section */}
      {activeTab === 'prices' && (
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
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                  Bursa / Exchange {getSortIndicator('name')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('type')}>
                  Jenis {getSortIndicator('type')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pair')}>
                  Pasangan {getSortIndicator('pair')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('ask')}>
                  Beli (Ask) {getSortIndicator('ask')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('bid')}>
                  Jual (Bid) {getSortIndicator('bid')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('deviation')}>
                  Deviasi Rata-Rata (Last) {getSortIndicator('deviation')}
                </th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>
                  Status {getSortIndicator('status')}
                </th>
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
                sortedPrices.map((item) => {
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
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit', fontWeight: '700' }}>
                              ${item.ask.toFixed(5)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                              {formatRupiah(item.ask, usdToIdrRate)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--md-sys-color-error)', fontStyle: 'italic' }}>
                            Error
                          </span>
                        )}
                      </td>

                      {/* Bid Price (Sell Price) */}
                      <td>
                        {item.status === 'success' && item.bid !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit', fontWeight: '700' }}>
                              ${item.bid.toFixed(5)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                              {formatRupiah(item.bid, usdToIdrRate)}
                            </span>
                          </div>
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
    )}

      {/* Antrean Transaksi Tab Content */}
      {activeTab === 'queue' && (
        <div className="md3-card table-card">
          <div className="table-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title">Antrean Eksekusi Transaksi</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Daftar eksekusi arbitrase yang telah Anda setujui dan dikirim ke antrean sistem.
              </p>
            </div>
            {transactions.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin menghapus semua transaksi di antrean?')) {
                    setTransactions([]);
                    localStorage.removeItem('arbitrage_transactions');
                  }
                }}
                className="tab-btn"
                style={{
                  backgroundColor: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                  fontSize: '12px',
                  fontWeight: '700',
                  border: 'none',
                  borderRadius: 'var(--md-shape-corner-full)',
                  padding: '6px 14px',
                  cursor: 'pointer'
                }}
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📥</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Antrean transaksi kosong.</span>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Silakan eksekusi rute arbitrase yang menguntungkan dari tab sebelah.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>ID Transaksi</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tanggal & Waktu</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Aset</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Rute</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Modal Kerja</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Net Profit</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>Status</th>
                    <th style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => {
                    const isExpanded = expandedTxId === tx.id;
                    const currentStep = tx.stepIndex !== undefined ? tx.stepIndex : 0;
                    return (
                      <React.Fragment key={tx.id}>
                        <tr 
                          onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                          style={{ 
                            borderBottom: '1px solid rgba(255,255,255,0.04)', 
                            cursor: 'pointer',
                            backgroundColor: isExpanded ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '12px 8px', fontWeight: '700', fontFamily: 'monospace' }}>{tx.id}</td>
                          <td style={{ padding: '12px 8px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {new Date(tx.timestamp).toLocaleString('id-ID')}
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                              <CoinIcon symbol={tx.symbol} size={20} />
                              {tx.symbol}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{ fontWeight: '600' }}>{tx.buyEx}</span> 
                            <span style={{ margin: '0 4px', color: 'var(--md-sys-color-outline)' }}>➔</span> 
                            <span style={{ fontWeight: '600' }}>{tx.sellEx}</span>
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                            ${tx.capital.toLocaleString()} USDC
                          </td>
                          <td style={{ padding: '12px 8px', fontWeight: '700', color: tx.netProfit > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
                            {tx.netProfit >= 0 ? '+' : ''}${tx.netProfit.toFixed(2)}
                            <div style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '400', marginTop: '1px' }}>
                              {formatRupiah(tx.netProfit, usdToIdrRate)}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--md-shape-corner-full)',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: tx.status === 'Selesai' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(0, 176, 255, 0.15)',
                              color: tx.status === 'Selesai' ? 'var(--color-profit-green)' : 'var(--md-sys-color-primary)',
                              border: tx.status === 'Selesai' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(0, 176, 255, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span className={`status-indicator ${tx.status !== 'Selesai' ? 'loading' : ''}`} style={{ width: '6px', height: '6px' }}></span>
                              {tx.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const updated = transactions.filter(t => t.id !== tx.id);
                                setTransactions(updated);
                                localStorage.setItem('arbitrage_transactions', JSON.stringify(updated));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--md-sys-color-error)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                padding: '4px 8px'
                              }}
                              title="Hapus dari antrean"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible Pipeline Detail Sub-row */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} onClick={(e) => e.stopPropagation()}>
                            <td colSpan={8} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--md-sys-color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>🚀 Pipeline Alur Eksekusi ({tx.id})</span>
                                  {tx.status !== 'Selesai' && (
                                    <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '400' }}>
                                      Proses berjalan secara otomatis...
                                    </span>
                                  )}
                                </div>
                                
                                {/* Stepper Graphics */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  position: 'relative',
                                  marginTop: '16px',
                                  padding: '0 20px',
                                  minHeight: '80px',
                                  overflowX: 'auto'
                                }}>
                                  {/* Line behind bubbles */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '13px',
                                    left: '50px',
                                    right: '50px',
                                    height: '3px',
                                    background: 'rgba(255,255,255,0.08)',
                                    zIndex: 1
                                  }} />
                                  
                                  {/* Green completed line */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '13px',
                                    left: '50px',
                                    width: `${(currentStep / 5) * 88}%`,
                                    height: '3px',
                                    background: 'var(--color-profit-green)',
                                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 2
                                  }} />

                                  {TX_STEPS.map((step, idx) => {
                                    const isCompleted = idx < currentStep;
                                    const isActive = idx === currentStep;
                                    
                                    let bubbleBg = 'var(--md-sys-color-surface-container-high)';
                                    let bubbleBorder = '1px solid rgba(255,255,255,0.1)';
                                    let textColor = 'var(--md-sys-color-on-surface-variant)';

                                    if (isCompleted) {
                                      bubbleBg = 'var(--color-profit-green)';
                                      bubbleBorder = '1px solid var(--color-profit-green)';
                                      textColor = '#ffffff';
                                    } else if (isActive) {
                                      bubbleBg = 'var(--md-sys-color-primary-container)';
                                      bubbleBorder = '2px solid var(--md-sys-color-primary)';
                                      textColor = 'var(--md-sys-color-primary)';
                                    }

                                    return (
                                      <div key={idx} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        zIndex: 3,
                                        width: '80px',
                                        textAlign: 'center',
                                        flexShrink: 0
                                      }}>
                                        {/* Step Circle */}
                                        <div style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          background: bubbleBg,
                                          border: bubbleBorder,
                                          color: textColor,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontWeight: '700',
                                          fontSize: '11px',
                                          transition: 'all 0.3s ease',
                                          boxShadow: isActive ? '0 0 12px rgba(0, 176, 255, 0.4)' : 'none'
                                        }}>
                                          {isCompleted ? '✓' : idx + 1}
                                        </div>
                                        
                                        {/* Step Label */}
                                        <div style={{
                                          fontSize: '11px',
                                          fontWeight: isActive ? '800' : '600',
                                          color: isActive ? 'var(--md-sys-color-primary)' : isCompleted ? '#ffffff' : 'var(--md-sys-color-on-surface-variant)',
                                          marginTop: '10px',
                                          lineHeight: '1.2'
                                        }}>
                                          {step.label}
                                        </div>
                                        
                                        {/* Step Description */}
                                        <div style={{
                                          fontSize: '9px',
                                          color: 'var(--md-sys-color-on-surface-variant)',
                                          marginTop: '3px',
                                          lineHeight: '1.1'
                                        }}>
                                          {step.desc}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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

      {activeTab === 'balances' && (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px' }}>
            <h2 className="table-title">Daftar Bursa & Saldo Dompet</h2>
            <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
              Informasi saldo modal, jaringan, latensi, dan fee transaksi yang terintegrasi secara otonom.
            </p>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Bursa</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Jaringan</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Status API / Latency</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Biaya (Fee)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Saldo Utama (USDC)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(exchangeBalances).map(([exName, info]) => (
                  <tr 
                    key={exName} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Bursa Name & Badge */}
                    <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ExchangeIcon name={exName} size={28} />
                        <span>{exName}</span>
                        <span className={`badge ${info.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                          {info.type}
                        </span>
                      </div>
                    </td>

                    {/* Jaringan */}
                    <td style={{ padding: '16px 20px', color: '#ffffff' }}>{info.network}</td>

                    {/* Status API / Latency */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: '600' }}>{info.apiStatus}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: 'var(--color-profit-green)', 
                          backgroundColor: 'rgba(52,211,153,0.08)', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          ⚡ {info.latency}
                        </span>
                      </div>
                    </td>

                    {/* Biaya (Fee) */}
                    <td style={{ padding: '16px 20px', color: 'var(--color-profit-green)', fontWeight: '600' }}>{info.fee}</td>

                    {/* Saldo Utama (USDC) + Tooltip Info Icon */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: '700' }}>{info.USDC.toLocaleString('id-ID', { minimumFractionDigits: 2 })} USDC</span>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {formatRupiah(info.USDC, usdToIdrRate)}
                          </span>
                        </div>

                        {/* Tooltip Info Trigger Icon */}
                        <span 
                          style={{ 
                            position: 'relative', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: 'help',
                            color: 'var(--md-sys-color-primary)',
                            backgroundColor: 'rgba(0, 176, 255, 0.1)',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '10px',
                            fontWeight: '700',
                            userSelect: 'none'
                          }}
                          onMouseEnter={() => setHoveredExchange(exName)}
                          onMouseLeave={() => setHoveredExchange(null)}
                        >
                          i
                          
                          {/* Floating Tooltip Box */}
                          <div style={{
                            position: 'absolute',
                            bottom: '120%',
                            right: '0',
                            transform: hoveredExchange === exName ? 'translateY(-4px)' : 'translateY(8px)',
                            opacity: hoveredExchange === exName ? 1 : 0,
                            visibility: hoveredExchange === exName ? 'visible' : 'hidden',
                            transition: 'all 0.2s ease',
                            backgroundColor: '#1b1d26',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 'var(--md-shape-corner-medium)',
                            padding: '12px',
                            width: '250px',
                            zIndex: 1000,
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                            pointerEvents: 'none',
                            textTransform: 'none',
                            letterSpacing: 'normal'
                          }}>
                            <div style={{ fontWeight: '700', fontSize: '11px', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', textAlign: 'left' }}>
                              Detail Saldo Koin ({exName})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                              {Object.entries(info).map(([asset, val]) => {
                                if (['USDC', 'status', 'latency', 'type', 'network', 'apiStatus', 'fee'].includes(asset)) return null;
                                
                                let tokenPriceInUsd = 1.0;
                                if (asset === 'SOL') tokenPriceInUsd = 145.20;
                                else if (asset === 'ETH') tokenPriceInUsd = 3450.00;
                                else if (asset === 'BNB') tokenPriceInUsd = 580.00;
                                else if (asset === 'PEPE') tokenPriceInUsd = 0.0000125;
                                else if (asset === 'BONK') tokenPriceInUsd = 0.0000215;
                                else if (asset === 'POPCAT') tokenPriceInUsd = 0.85;
                                else if (asset === 'RENDER') tokenPriceInUsd = 7.45;
                                else if (asset === 'W') tokenPriceInUsd = 0.35;
                                else if (asset === 'FLOKI') tokenPriceInUsd = 0.000175;

                                const valueInUsd = val * tokenPriceInUsd;

                                return (
                                  <div key={asset} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ffffff', marginTop: '2px' }}>
                                    <span style={{ fontWeight: '700' }}>
                                      {val.toLocaleString('id-ID')} {asset}
                                    </span>
                                    <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '10px' }}>
                                      {formatRupiah(valueInUsd, usdToIdrRate)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </span>
                      </div>
                    </td>

                    {/* Aksi Deposit / Withdraw */}
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => alert(`Fitur Deposit otomatis ke ${exName} disimulasikan.`)}
                          className="tab-btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Deposit
                        </button>
                        <button
                          onClick={() => alert(`Fitur Penarikan (Withdraw) dari ${exName} disimulasikan.`)}
                          className="tab-btn"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: '1px solid var(--md-sys-color-outline-variant)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Portofolio Koin Tab */}
      {activeTab === 'portfolio' && (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px' }}>
            <h2 className="table-title">Daftar Aset Koin & Estimasi Portofolio</h2>
            <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
              Nilai total kepemilikan koin dari seluruh bursa yang terintegrasi beserta alokasi distribusinya.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Koin</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Kategori</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Harga Pasar (USD)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Total Saldo</th>
                  <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Total Nilai Aset</th>
                </tr>
              </thead>
              <tbody>
                {coinAssets.map((coin) => {
                  const totalValUsd = coin.total * coin.price;
                  const hoverKey = `coin-${coin.symbol}`;

                  return (
                    <tr 
                      key={coin.symbol} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Koin Name */}
                      <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CoinIcon symbol={coin.symbol} size={28} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{coin.symbol}</span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>{coin.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td style={{ padding: '16px 20px' }}>
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
                      </td>

                      {/* Harga Pasar */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span>${coin.price >= 0.01 ? coin.price.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : coin.price.toFixed(7)}</span>
                          <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {formatRupiah(coin.price, usdToIdrRate)}
                          </span>
                        </div>
                      </td>

                      {/* Total Saldo */}
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600' }}>
                        {coin.total.toLocaleString('id-ID', { minimumFractionDigits: 2 })} {coin.symbol}
                      </td>

                      {/* Total Nilai Aset + Tooltip Info Icon */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: '700', color: 'var(--md-sys-color-primary)' }}>
                              ${totalValUsd.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {formatRupiah(totalValUsd, usdToIdrRate)}
                            </span>
                          </div>

                          {/* Tooltip Info Trigger Icon */}
                          <span 
                            style={{ 
                              position: 'relative', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'help',
                              color: 'var(--md-sys-color-primary)',
                              backgroundColor: 'rgba(0, 176, 255, 0.1)',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '10px',
                              fontWeight: '700',
                              userSelect: 'none'
                            }}
                            onMouseEnter={() => setHoveredExchange(hoverKey)}
                            onMouseLeave={() => setHoveredExchange(null)}
                          >
                            i
                            
                            {/* Floating Tooltip Box */}
                            <div style={{
                              position: 'absolute',
                              bottom: '120%',
                              right: '0',
                              transform: hoveredExchange === hoverKey ? 'translateY(-4px)' : 'translateY(8px)',
                              opacity: hoveredExchange === hoverKey ? 1 : 0,
                              visibility: hoveredExchange === hoverKey ? 'visible' : 'hidden',
                              transition: 'all 0.2s ease',
                              backgroundColor: '#1b1d26',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: 'var(--md-shape-corner-medium)',
                              padding: '12px',
                              width: '260px',
                              zIndex: 1000,
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                              pointerEvents: 'none',
                              textTransform: 'none',
                              letterSpacing: 'normal'
                            }}>
                              <div style={{ fontWeight: '700', fontSize: '11px', color: 'var(--md-sys-color-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px', textAlign: 'left' }}>
                                Alokasi Bursa ({coin.symbol})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                                {coin.breakdown.map((item) => {
                                  const itemUsd = item.amount * coin.price;
                                  return (
                                    <div key={item.exName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ffffff' }}>
                                      <span style={{ fontWeight: '600' }}>{item.exName}</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span>{item.amount.toLocaleString('id-ID')} {coin.symbol}</span>
                                        <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                                          {formatRupiah(itemUsd, usdToIdrRate)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            maxWidth: '420px',
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

            {/* Details Box */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--md-shape-corner-medium)',
              padding: '12px',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Koin:</span>
                <span style={{ fontWeight: '700' }}>{activeSymbol}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Rute:</span>
                <span style={{ fontWeight: '700', color: 'var(--color-profit-green)' }}>
                  {stats.lowestAsk?.name} ➔ {stats.highestBid?.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Modal:</span>
                <span style={{ fontWeight: '700' }}>${capital.toLocaleString()} USDC</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '4px' }}>
                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Net Profit:</span>
                <span style={{ fontWeight: '800', color: netCalculation.net > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)' }}>
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
