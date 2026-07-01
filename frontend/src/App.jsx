import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CoinIcon from './components/CoinIcon';
import ExchangeIcon from './components/ExchangeIcon';
import { defaultSymbols, COIN_ICONS, COIN_META_LOOKUP, EXCHANGE_API_INFO } from './constants/marketData';
import { TX_STEPS } from './constants/transactions';
import useUrlState from './hooks/useUrlState';
import useAgentSimulator from './hooks/useAgentSimulator';
import useBalances from './hooks/useBalances';
import useTransactions from './hooks/useTransactions';
import { formatRupiah, formatCapital, getCapitalTier, getHeaderGradient, getRatingStatus } from './utils/formatters';
import { escapeCsvValue } from './utils/csv';
import { formatMarketPriceTimestamp, formatNativeMarketPrice, normalizeMarketSymbol } from './utils/market';
import { getUsdIdrRate } from './api/exchangeRates';
import { getExchangeDetails as fetchExchangeDetailsApi, getExchangeMarketData as fetchExchangeMarketDataApi, getExchangesDb as fetchExchangesDbApi } from './api/exchanges';
import { getOpportunities, getPrices } from './api/prices';
import { getRawPrices } from './api/rawPrices';
import { getTokensDb as fetchTokensDbApi } from './api/tokens';

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

const EXCHANGE_DETAIL_PATH_PREFIX = '/exchanges/';

const getExchangeRouteKey = (exchange) => encodeURIComponent(String(exchange?.id ?? exchange?.name ?? '').trim());

const getExchangeRouteKeyFromPath = () => {
  const { pathname } = window.location;
  if (!pathname.startsWith(EXCHANGE_DETAIL_PATH_PREFIX)) return null;
  const rawKey = pathname.slice(EXCHANGE_DETAIL_PATH_PREFIX.length).split('/')[0];
  return rawKey ? decodeURIComponent(rawKey) : null;
};

const buildExchangeDetailPath = (exchange) => {
  const params = new URLSearchParams(window.location.search);
  params.set('tab', 'exchanges');
  return `${EXCHANGE_DETAIL_PATH_PREFIX}${getExchangeRouteKey(exchange)}?${params.toString()}`;
};

const buildExchangesListPath = () => {
  const params = new URLSearchParams(window.location.search);
  params.set('tab', 'exchanges');
  return `/?${params.toString()}`;
};

function App() {
  const [prices, setPrices] = useState([]);
  const [usdToIdrRate, setUsdToIdrRate] = useState(16500);
  const [symbolsList, setSymbolsList] = useState(defaultSymbols);
  const [spreads, setSpreads] = useState({});
  const [exchangesDb, setExchangesDb] = useState([]);
  const [loadingExchangesDb, setLoadingExchangesDb] = useState(false);
  const [errorExchangesDb, setErrorExchangesDb] = useState(null);
  const [tokensDb, setTokensDb] = useState([]);
  const [, setLoadingTokensDb] = useState(false);
  const [, setErrorTokensDb] = useState(null);
  const tokensDbRef = React.useRef([]);

  // Redis Raw Price Modal state
  const [showRawModal, setShowRawModal] = useState(false);
  const [rawModalExchange, setRawModalExchange] = useState('');
  const [rawModalSymbol, setRawModalSymbol] = useState('');
  const [rawModalData, setRawModalData] = useState(null);
  const [rawModalLoading, setRawModalLoading] = useState(false);
  const [rawModalError, setRawModalError] = useState(null);

  const handleInspectRawPrice = async (exchangeName, symbol) => {
    setRawModalExchange(exchangeName);
    setRawModalSymbol(symbol);
    setRawModalLoading(true);
    setRawModalError(null);
    setRawModalData(null);
    setShowRawModal(true);

    try {
      const data = await getRawPrices(exchangeName, symbol);
      setRawModalData(data);
    } catch (err) {
      console.error('Error fetching raw price:', err);
      setRawModalError(err.message);
    } finally {
      setRawModalLoading(false);
    }
  };

  useEffect(() => {
    tokensDbRef.current = tokensDb;
  }, [tokensDb]);

  const fetchExchangesDb = async () => {
    setLoadingExchangesDb(true);
    setErrorExchangesDb(null);
    try {
      const data = await fetchExchangesDbApi();
      setExchangesDb(data.exchanges || []);
    } catch (err) {
      console.error('Failed to fetch exchanges from DB:', err);
      setErrorExchangesDb(err.message);
    } finally {
      setLoadingExchangesDb(false);
    }
  };

  const fetchTokensDb = async () => {
    setLoadingTokensDb(true);
    setErrorTokensDb(null);
    try {
      const data = await fetchTokensDbApi();
      const fetchedTokens = data.tokens || [];
      setTokensDb(fetchedTokens);
      if (fetchedTokens.length > 0) {
        setSymbolsList(fetchedTokens.map(t => t.symbol));
      }
    } catch (err) {
      console.error('Failed to fetch tokens from DB:', err);
      setErrorTokensDb(err.message);
    } finally {
      setLoadingTokensDb(false);
    }
  };

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getUsdIdrRate();
        if (rate) {
          setUsdToIdrRate(rate);
        }
      } catch (err) {
        console.error('Failed to fetch USD/IDR rate:', err);
      }
    };
    fetchExchangeRate();
    fetchTokensDb();
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useUrlState('filter', 'ALL');
  const [refreshCountdown, setRefreshCountdown] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [capital, setCapital] = useUrlState('capital', 10000);
  const [activeSymbol, setActiveSymbol] = useUrlState('coin', 'USDT');
  const [activeTab, setActiveTab] = useUrlState('tab', 'prices');
  const [exchangeRouteKey, setExchangeRouteKey] = useState(getExchangeRouteKeyFromPath);
  useEffect(() => {
    if (activeTab === 'exchanges') {
      fetchExchangesDb();
    } else if (activeTab === 'portfolio') {
      fetchTokensDb();
    }
  }, [activeTab]);

  useEffect(() => {
    const syncExchangeRoute = () => {
      const routeKey = getExchangeRouteKeyFromPath();
      setExchangeRouteKey(routeKey);
      if (routeKey) {
        setActiveTab('exchanges');
      }
    };

    syncExchangeRoute();
    window.addEventListener('popstate', syncExchangeRoute);
    return () => window.removeEventListener('popstate', syncExchangeRoute);
  }, []);

  useEffect(() => {
    if (!exchangeRouteKey) return;

    const match = exchangesDb.find((exchange) => {
      const id = String(exchange.id ?? '');
      const name = String(exchange.name ?? '');
      return id === exchangeRouteKey || name.toLowerCase() === exchangeRouteKey.toLowerCase();
    });

    if (match) {
      setExchangeDbDetailTab('overview');
      setExchangeMarketData([]);
      setErrorExchangeMarketData(null);
      setExchangeMarketSearchQuery('');
      setSelectedExchangeMarketRows(new Set());
      setSelectedExchangeDb(match);
    }
  }, [exchangeRouteKey, exchangesDb]);

  const [exchangesViewMode, setExchangesViewMode] = useUrlState('ex_mode', 'table');
  const [selectedExchangeDb, setSelectedExchangeDb] = useState(null);
  const [exchangeDbDetailTab, setExchangeDbDetailTab] = useState('overview');
  const [exchangeMarketData, setExchangeMarketData] = useState([]);
  const [loadingExchangeMarketData, setLoadingExchangeMarketData] = useState(false);
  const [errorExchangeMarketData, setErrorExchangeMarketData] = useState(null);
  const [exchangeMarketRefreshCycle, setExchangeMarketRefreshCycle] = useState(0);
  const [exchangeMarketSortConfig, setExchangeMarketSortConfig] = useState({ key: 'baseToken', direction: 'asc' });
  const [exchangeMarketSearchQuery, setExchangeMarketSearchQuery] = useState('');
  const [selectedExchangeMarketRows, setSelectedExchangeMarketRows] = useState(new Set());
  const [isCompact, setIsCompact] = useUrlState('compact', 'false');
  const [opportunities, setOpportunities] = useState([]);
  const [selectedExchange, setSelectedExchange] = useUrlState('ex', 'Binance');
  const [exchangeDetails, setExchangeDetails] = useState({ exchange: 'Binance', tokens: [] });
  const [loadingExchange, setLoadingExchange] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useUrlState('q', '');
  const [searchQueryQueue, setSearchQueryQueue] = useState('');
  const [searchQueryBalances, setSearchQueryBalances] = useState('');
  const [searchQueryPortfolio, setSearchQueryPortfolio] = useState('');
  const [searchQueryModalTokens, setSearchQueryModalTokens] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { transactions, setTransactions, expandedTxId, setExpandedTxId } = useTransactions();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [hoveredExchange, setHoveredExchange] = useState(null);
  const { exchangeBalances, setExchangeBalances } = useBalances();
  const {
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
    handleAddMockCoin
  } = useAgentSimulator({ symbolsList, setSymbolsList, setSpreads });

  const coinAssets = useMemo(() => {
    const coins = {};
    const coinMeta = COIN_META_LOOKUP;

    Object.entries(exchangeBalances).forEach(([exName, info]) => {
      Object.entries(info).forEach(([key, val]) => {
        if (['status', 'latency', 'type', 'network', 'apiStatus', 'fee'].includes(key)) return;

        const dbToken = tokensDb.find(t => t.symbol === key);
        const name = dbToken ? dbToken.name : (coinMeta[key]?.name || key);
        const price = dbToken ? dbToken.price : (coinMeta[key]?.price || 1.0);

        if (!coins[key]) {
          coins[key] = {
            symbol: key,
            name: name,
            category: coinMeta[key]?.category || 'VOLATILE',
            icon: coinMeta[key]?.icon || COIN_ICONS.USDT || null,
            price: price,
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
  }, [exchangeBalances, tokensDb]);

  const compactMode = isCompact === 'true';

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

  const handleExchangeMarketSort = (key) => {
    let direction = 'asc';
    if (exchangeMarketSortConfig.key === key && exchangeMarketSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setExchangeMarketSortConfig({ key, direction });
  };

  const getExchangeMarketSortIndicator = (key) => {
    if (exchangeMarketSortConfig.key !== key) return ' ↕';
    return exchangeMarketSortConfig.direction === 'asc' ? ' ▲' : ' ▼';
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

  // Fetch prices from backend
  const fetchPrices = async (symbol = activeSymbol, silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    setError(null);



    try {
      const json = await getPrices(symbol);

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
        const sourceSymbols = tokensDbRef.current.length > 0 ? tokensDbRef.current.map(t => t.symbol) : defaultSymbols;
        const sorted = [...sourceSymbols].sort((a, b) => {
          const spreadA = json.spreads[a] || 0;
          const spreadB = json.spreads[b] || 0;
          return spreadB - spreadA;
        });
        setSymbolsList(sorted);
      }

      // Fetch all profitable opportunities across all tokens
      try {
        const oppJson = await getOpportunities();
        setOpportunities(oppJson.opportunities || []);
      } catch (oppErr) {
        console.error('Error fetching opportunities:', oppErr);
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

  const fetchExchangeDetails = async (name) => {
    setLoadingExchange(true);
    try {
      const data = await fetchExchangeDetailsApi(name);
      setExchangeDetails(data);
    } catch (err) {
      console.error('Error fetching exchange details:', err);
    } finally {
      setLoadingExchange(false);
    }
  };

  useEffect(() => {
    if (showExchangeModal && selectedExchange) {
      fetchExchangeDetails(selectedExchange);
    }
  }, [selectedExchange, showExchangeModal]);

  const handleAssetChange = (sym) => {
    setActiveSymbol(sym);
    setPrices([]); // Show loading skeletons
  };

  const filteredPrices = useMemo(() => {
    const localExchanges = ['Indodax', 'Tokocrypto', 'Reku'];
    const search = searchQuery.toLowerCase().trim();
    return prices.filter(p => {
      // Check search match
      if (search && !p.name.toLowerCase().includes(search) && !p.pair.toLowerCase().includes(search)) {
        return false;
      }

      if (filter === 'CEX') return p.type === 'CEX';
      if (filter === 'DEX') return p.type === 'DEX';
      if (filter === 'LOCAL') return localExchanges.includes(p.name);
      if (filter === 'PROFITABLE') {
        const activePrices = prices.filter(x => x.status === 'success' && x.price !== null && x.bid !== null && x.ask !== null);
        if (activePrices.length < 2) return false;
        let lowestAsk = activePrices[0];
        let highestBid = activePrices[0];
        activePrices.forEach(x => {
          if (x.ask < lowestAsk.ask) lowestAsk = x;
          if (x.bid > highestBid.bid) highestBid = x;
        });
        const isLowestAsk = lowestAsk && p.name === lowestAsk.name;
        const isHighestBid = highestBid && p.name === highestBid.name;
        const hasSpread = ((highestBid.bid - lowestAsk.ask) / lowestAsk.ask) * 100 > 0;
        return hasSpread && (isLowestAsk || isHighestBid);
      }
      return true;
    });
  }, [prices, filter, searchQuery]);

  const filteredOpportunities = useMemo(() => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return opportunities;
    return opportunities.filter(opp => 
      opp.symbol.toLowerCase().includes(search) ||
      opp.buyEx.toLowerCase().includes(search) ||
      opp.sellEx.toLowerCase().includes(search)
    );
  }, [opportunities, searchQuery]);

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

  const fetchExchangeMarketData = async (exchange) => {
    if (!exchange?.id) return;

    setExchangeMarketRefreshCycle((cycle) => cycle + 1);
    setLoadingExchangeMarketData(true);
    setErrorExchangeMarketData(null);
    try {
      const data = await fetchExchangeMarketDataApi(exchange.id);
      const rows = Array.isArray(data.data)
        ? data.data
        : (Array.isArray(data.marketData) ? data.marketData : []);
      setExchangeMarketData(rows);
    } catch (err) {
      console.error('Failed to fetch exchange market data:', err);
      setErrorExchangeMarketData(err.message);
      setExchangeMarketData([]);
    } finally {
      setLoadingExchangeMarketData(false);
    }
  };

  const openExchangeDbPage = (exchange) => {
    window.history.pushState(null, '', buildExchangeDetailPath(exchange));
    setExchangeRouteKey(String(exchange?.id ?? exchange?.name ?? ''));
    setActiveTab('exchanges');
    setExchangeDbDetailTab('overview');
    setExchangeMarketData([]);
    setErrorExchangeMarketData(null);
    setExchangeMarketSearchQuery('');
    setSelectedExchangeMarketRows(new Set());
    setSelectedExchangeDb(exchange);
  };

  const closeExchangeDbPage = () => {
    window.history.pushState(null, '', buildExchangesListPath());
    setExchangeRouteKey(null);
    setSelectedExchangeDb(null);
    setExchangeDbDetailTab('overview');
    setExchangeMarketData([]);
    setErrorExchangeMarketData(null);
    setExchangeMarketSearchQuery('');
    setSelectedExchangeMarketRows(new Set());
  };

  const renderInfoIcon = (tooltipContent) => (
    <span className="tooltip-icon" style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.15)',
      color: '#ffffff',
      fontSize: '9px',
      fontWeight: 'bold',
      cursor: 'pointer',
      position: 'relative',
      marginLeft: '6px'
    }}>
      i
      <span className="tooltip-text">{tooltipContent}</span>
    </span>
  );

  const selectedExchangeFiatPairs = useMemo(() => {
    const fiatSymbols = new Set(['IDR', 'USD']);

    return (selectedExchangeDb?.tokenPairs || [])
      .filter((pair) => fiatSymbols.has(pair.quoteToken?.symbol))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [selectedExchangeDb]);

  useEffect(() => {
    if (selectedExchangeDb && exchangeDbDetailTab === 'market') {
      fetchExchangeMarketData(selectedExchangeDb);
    }
  }, [selectedExchangeDb, exchangeDbDetailTab]);

  useEffect(() => {
    if (!selectedExchangeDb || exchangeDbDetailTab !== 'market') return undefined;

    const interval = setInterval(() => {
      fetchExchangeMarketData(selectedExchangeDb);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedExchangeDb, exchangeDbDetailTab]);

  const exchangeMarketDataLookup = useMemo(() => {
    const lookup = new Map();

    exchangeMarketData.forEach((item) => {
      if (item.pairId !== undefined && item.pairId !== null) {
        lookup.set(`id:${item.pairId}`, item);
      }

      if (item.symbol) {
        lookup.set(`symbol:${item.symbol}`, item);
        lookup.set(`symbol:${normalizeMarketSymbol(item.symbol)}`, item);
      }
    });

    return lookup;
  }, [exchangeMarketData]);

  const getExchangeMarketRow = useCallback((pair) => {
    return exchangeMarketDataLookup.get(`id:${pair.id}`)
      || exchangeMarketDataLookup.get(`symbol:${pair.symbol}`)
      || exchangeMarketDataLookup.get(`symbol:${normalizeMarketSymbol(pair.symbol)}`)
      || null;
  }, [exchangeMarketDataLookup]);

  const filteredExchangeFiatPairs = useMemo(() => {
    const query = exchangeMarketSearchQuery.trim().toLowerCase();
    if (!query) return selectedExchangeFiatPairs;

    return selectedExchangeFiatPairs.filter((pair) => {
      const market = getExchangeMarketRow(pair);
      const searchableText = [
        pair.symbol,
        pair.baseToken?.symbol,
        pair.baseToken?.name,
        pair.quoteToken?.symbol,
        pair.quoteToken?.name,
        market?.status,
        market?.source,
        market?.nativeCurrency
      ].filter(Boolean).join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }, [selectedExchangeFiatPairs, exchangeMarketSearchQuery, getExchangeMarketRow]);

  const sortedExchangeFiatPairs = useMemo(() => {
    const direction = exchangeMarketSortConfig.direction === 'asc' ? 1 : -1;
    const getMarket = (pair) => exchangeMarketDataLookup.get(`id:${pair.id}`)
      || exchangeMarketDataLookup.get(`symbol:${pair.symbol}`)
      || exchangeMarketDataLookup.get(`symbol:${normalizeMarketSymbol(pair.symbol)}`)
      || null;

    const getNumberValue = (value) => {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    };

    const compareNullableNumbers = (a, b) => {
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    };

    const compareStrings = (a, b) => String(a || '').localeCompare(String(b || ''), 'id-ID', {
      numeric: true,
      sensitivity: 'base'
    });

    return [...filteredExchangeFiatPairs].sort((a, b) => {
      const marketA = getMarket(a);
      const marketB = getMarket(b);
      let result = 0;

      switch (exchangeMarketSortConfig.key) {
        case 'baseToken':
          result = compareStrings(a.baseToken?.symbol, b.baseToken?.symbol)
            || compareStrings(a.baseToken?.name, b.baseToken?.name)
            || compareStrings(a.symbol, b.symbol);
          break;
        case 'last':
          result = compareNullableNumbers(
            getNumberValue(marketA?.mid ?? marketA?.last ?? marketA?.price),
            getNumberValue(marketB?.mid ?? marketB?.last ?? marketB?.price)
          );
          break;
        case 'bid':
          result = compareNullableNumbers(
            getNumberValue(marketA?.bid ?? marketA?.nativeBid),
            getNumberValue(marketB?.bid ?? marketB?.nativeBid)
          );
          break;
        case 'ask':
          result = compareNullableNumbers(
            getNumberValue(marketA?.ask ?? marketA?.nativeAsk),
            getNumberValue(marketB?.ask ?? marketB?.nativeAsk)
          );
          break;
        case 'quantity':
          result = compareNullableNumbers(getNumberValue(marketA?.bidQty), getNumberValue(marketB?.bidQty))
            || compareNullableNumbers(getNumberValue(marketA?.askQty), getNumberValue(marketB?.askQty));
          break;
        case 'timestamp':
          result = compareNullableNumbers(
            getNumberValue(marketA?.priceTimestamp || marketA?.timestamp),
            getNumberValue(marketB?.priceTimestamp || marketB?.timestamp)
          );
          break;
        case 'status':
          result = compareStrings(marketA?.status || 'pending', marketB?.status || 'pending');
          break;
        default:
          result = compareStrings(a.symbol, b.symbol);
          break;
      }

      return result * direction;
    });
  }, [filteredExchangeFiatPairs, exchangeMarketDataLookup, exchangeMarketSortConfig]);

  const getExchangeMarketRowKey = (pair) => String(pair.id ?? pair.symbol);

  const selectedExchangeMarketPairs = useMemo(() => {
    return selectedExchangeFiatPairs.filter((pair) => selectedExchangeMarketRows.has(getExchangeMarketRowKey(pair)));
  }, [selectedExchangeFiatPairs, selectedExchangeMarketRows]);

  const allVisibleExchangeMarketRowsSelected = sortedExchangeFiatPairs.length > 0
    && sortedExchangeFiatPairs.every((pair) => selectedExchangeMarketRows.has(getExchangeMarketRowKey(pair)));

  const toggleExchangeMarketRowSelection = (pair) => {
    const rowKey = getExchangeMarketRowKey(pair);
    setSelectedExchangeMarketRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const toggleAllVisibleExchangeMarketRows = () => {
    setSelectedExchangeMarketRows((prev) => {
      const next = new Set(prev);
      if (allVisibleExchangeMarketRowsSelected) {
        sortedExchangeFiatPairs.forEach((pair) => next.delete(getExchangeMarketRowKey(pair)));
      } else {
        sortedExchangeFiatPairs.forEach((pair) => next.add(getExchangeMarketRowKey(pair)));
      }
      return next;
    });
  };

  const handleExportExchangeMarketCsv = () => {
    if (selectedExchangeMarketPairs.length === 0) return;

    const headers = [
      'Exchange',
      'Pair',
      'Base Symbol',
      'Base Name',
      'Quote Symbol',
      'Last / Mid',
      'Bid',
      'Ask',
      'Bid Qty',
      'Ask Qty',
      'Price Timestamp',
      'Status',
      'Source'
    ];

    const rows = selectedExchangeMarketPairs.map((pair) => {
      const market = getExchangeMarketRow(pair);
      const priceTimestamp = market?.priceTimestamp || market?.timestamp || null;
      return [
        selectedExchangeDb?.name || '',
        pair.symbol || '',
        pair.baseToken?.symbol || '',
        pair.baseToken?.name || '',
        pair.quoteToken?.symbol || '',
        market?.mid ?? market?.last ?? market?.price ?? '',
        market?.bid ?? market?.nativeBid ?? '',
        market?.ask ?? market?.nativeAsk ?? '',
        market?.bidQty ?? '',
        market?.askQty ?? '',
        priceTimestamp ? new Date(priceTimestamp).toISOString() : '',
        market?.status || 'pending',
        market?.source || ''
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const exchangeName = String(selectedExchangeDb?.name || 'exchange').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${exchangeName}-market-data-${dateStamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isExchangeDetailPage = activeTab === 'exchanges' && Boolean(selectedExchangeDb);

  return (
    <div className={`app-container ${compactMode ? 'compact-ui' : ''}`}>
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

        <div className="sync-status-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="status-chip">
            <span className={`status-indicator ${isRefreshing ? 'loading' : ''}`}></span>
            {isRefreshing ? 'Memperbarui...' : `Auto-refresh dalam ${refreshCountdown}s`}
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>
              Update: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          {/* Compact View Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--md-sys-color-on-surface-variant)', whiteSpace: 'nowrap' }}>Compact UI</span>
            <button
              onClick={() => setIsCompact(compactMode ? 'false' : 'true')}
              aria-label="Toggle mode compact"
              style={{
                width: '34px',
                height: '18px',
                borderRadius: '9px',
                backgroundColor: compactMode ? 'var(--md-sys-color-primary)' : 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                padding: 0,
                flexShrink: 0
              }}
            >
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                position: 'absolute',
                top: '3px',
                left: compactMode ? '18px' : '4px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>
        </div>
      </header>

      {isExchangeDetailPage && (
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
            onClick={closeExchangeDbPage}
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
          <span style={{ color: '#ffffff', fontWeight: '800' }}>{selectedExchangeDb.name}</span>
        </nav>
      )}

      {!isExchangeDetailPage && (
      <>

      {/* Asset Selector Row with Infinite Animated Scrolling Ticker */}
      <div className="asset-selector-row" style={{ marginBottom: '24px' }}>
        <div className="asset-marquee-container">
          <div className="asset-marquee-track">
            {/* Copy 1 */}
            {symbolsList.map(sym => {
              const spread = spreads[sym] || 0;
              return (
                <button
                  key={`first-${sym}`}
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
                    transition: 'all 0.5s ease',
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
            {/* Copy 2 (Seamless loop fallback) */}
            {symbolsList.map(sym => {
              const spread = spreads[sym] || 0;
              return (
                <button
                  key={`second-${sym}`}
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
                    transition: 'all 0.5s ease',
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

      {/* Main Table Section */}
      {activeTab === 'prices' && (
        <div className="md3-card table-card">
          <div className="table-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h2 className="table-title" style={{ margin: 0 }}>Perbandingan Order Book CEX & DEX</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={filter === 'PROFITABLE' ? "Cari koin/bursa..." : "Cari bursa/pair..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    fontSize: '13px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    color: '#ffffff',
                    outline: 'none',
                    width: '180px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.width = '240px';
                    e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.width = '180px';
                    e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                <svg 
                  style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>

              {/* Filter Tabs */}
              <div className="tabs-container" style={{ margin: 0 }}>
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
                  CEX
                </button>
                <button
                  className={`tab-btn ${filter === 'DEX' ? 'active' : ''}`}
                  onClick={() => setFilter('DEX')}
                >
                  DEX
                </button>
                <button
                  className={`tab-btn ${filter === 'LOCAL' ? 'active' : ''}`}
                  onClick={() => setFilter('LOCAL')}
                >
                  Indonesia
                </button>
                <button
                  className={`tab-btn ${filter === 'PROFITABLE' ? 'active' : ''}`}
                  onClick={() => setFilter('PROFITABLE')}
                >
                  Paling Untung
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className={`table-wrapper ${compactMode ? 'compact-table' : ''}`}>
            {filter === 'PROFITABLE' ? (
              <table className="md3-table">
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Aset Koin</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Kategori</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Beli di Bursa Murah</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Jual di Bursa Mahal</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Spread Kotor</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'right' }}>Estimasi Net Profit</th>
                    <th style={{ padding: compactMode ? '8px 12px' : '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpportunities.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500' }}>
                        <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🔍</span>
                        Tidak ada peluang arbitrase yang menghasilkan profit dari seluruh koin saat ini.
                      </td>
                    </tr>
                  ) : (
                    filteredOpportunities.map(opp => {
                      const coinInfo = COIN_META_LOOKUP[opp.symbol] || { name: opp.symbol, category: 'FLUKTUATIF' };
                      const netProfit = (capital * (opp.spread / 100)) - (capital * 0.002); // gross - approx 0.2% buy/sell fees

                      return (
                        <tr key={opp.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          {/* Coin symbol & icon */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <CoinIcon symbol={opp.symbol} size={compactMode ? 20 : 28} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>{opp.symbol}</span>
                                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>{coinInfo.name}</span>
                              </div>
                            </div>
                          </td>
                          {/* Category badge */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              backgroundColor: coinInfo.category === 'MICIN' ? 'rgba(244,63,94,0.15)' : coinInfo.category === 'STABLE' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                              color: coinInfo.category === 'MICIN' ? '#f43f5e' : coinInfo.category === 'STABLE' ? '#10b981' : '#3b82f6'
                            }}>
                              {coinInfo.category}
                            </span>
                          </td>
                          {/* Buy route */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '700', color: 'var(--md-sys-color-on-surface)' }}>{opp.buyEx}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>${opp.buyPrice.toFixed(5)}</span>
                            </div>
                          </td>
                          {/* Sell route */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '700', color: 'var(--md-sys-color-on-surface)' }}>{opp.sellEx}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)' }}>${opp.sellPrice.toFixed(5)}</span>
                            </div>
                          </td>
                          {/* Spread */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'right', fontWeight: '800', color: 'var(--color-profit-green)', fontSize: '14px' }}>
                            +{opp.spread.toFixed(2)}%
                          </td>
                          {/* Net profit estimate */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'right', fontWeight: '800', color: netProfit > 0 ? 'var(--color-profit-green)' : 'var(--md-sys-color-error)', fontSize: '14px' }}>
                            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                            <div style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {formatRupiah(netProfit, usdToIdrRate)}
                            </div>
                          </td>
                          {/* Action button */}
                          <td style={{ padding: compactMode ? '8px 12px' : '16px 20px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                handleAssetChange(opp.symbol);
                                setTimeout(() => setShowConfirmModal(true), 250);
                              }}
                              className="tab-btn"
                              style={{
                                backgroundColor: 'var(--md-sys-color-primary)',
                                color: 'var(--md-sys-color-on-primary)',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '6px 14px',
                                borderRadius: 'var(--md-shape-corner-medium)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Eksekusi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              <table className="md3-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>
                      Bursa / Exchange {getSortIndicator('name')}
                    </th>
                    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('pair')}>
                      Pasangan {getSortIndicator('pair')}
                    </th>
                    <th>
                      Sumber Data
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
                  ) : sortedPrices.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500' }}>
                        🔍 Tidak ada peluang arbitrase yang menghasilkan profit untuk koin {activeSymbol} saat ini.
                      </td>
                    </tr>
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
                          {/* Exchange Name & Type */}
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                              <button
                                onClick={() => {
                                  setSelectedExchange(item.name);
                                  setShowExchangeModal(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  font: 'inherit',
                                  color: 'var(--md-sys-color-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  textDecoration: 'underline'
                                }}
                              >
                                {item.name}
                              </button>
                              <span className={`badge ${item.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                {item.type}
                              </span>
                            </div>
                          </td>

                          {/* Trading Pair */}
                          <td style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                            {item.pair}
                          </td>

                          {/* Data Source */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {item.source === 'direct' ? (
                                  <span style={{ color: '#10b981', fontWeight: '600', fontSize: '12px' }}>Direct API</span>
                                ) : item.source === 'coingecko' ? (
                                  <span style={{ color: '#f59e0b', fontWeight: '600', fontSize: '12px' }}>CoinGecko</span>
                                ) : item.source === 'dexscreener' ? (
                                  <span style={{ color: '#3b82f6', fontWeight: '600', fontSize: '12px' }}>DexScreener</span>
                                ) : (
                                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px' }}>-</span>
                                )}
                                <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', opacity: 0.85 }}>
                                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : (lastUpdated ? lastUpdated.toLocaleTimeString() : '-')}
                                </span>
                              </div>
                              {item.status === 'success' && (
                                <button
                                  onClick={() => handleInspectRawPrice(item.name, activeSymbol)}
                                  title="Lihat Detail JSON Mentah (Redis)"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => e.target.style.opacity = 1}
                                  onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                >
                                  📄
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Ask Price (Buy Price) */}
                          <td>
                            {item.status === 'success' && item.ask !== null ? (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {item.nativeCurrency === 'IDR' ? (
                                  <>
                                    <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit', fontWeight: '700' }}>
                                      Rp {item.nativeAsk?.toLocaleString('id-ID')}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      ${item.ask.toFixed(5)} USD
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="price-tag" style={{ color: isLowestAsk ? 'var(--color-profit-green)' : 'inherit', fontWeight: '700' }}>
                                      ${item.ask.toFixed(5)}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      {formatRupiah(item.ask, usdToIdrRate)}
                                    </span>
                                  </>
                                )}
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
                                {item.nativeCurrency === 'IDR' ? (
                                  <>
                                    <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit', fontWeight: '700' }}>
                                      Rp {item.nativeBid?.toLocaleString('id-ID')}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      ${item.bid.toFixed(5)} USD
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="price-tag" style={{ color: isHighestBid ? 'var(--color-loss-red)' : 'inherit', fontWeight: '700' }}>
                                      ${item.bid.toFixed(5)}
                                    </span>
                                    <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '1px' }}>
                                      {formatRupiah(item.bid, usdToIdrRate)}
                                    </span>
                                  </>
                                )}
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
            )}
          </div>
        </div>
      )}

      {/* Antrean Transaksi Tab Content */}
      {activeTab === 'queue' && (
        <div className="md3-card table-card">
          <div className="table-header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Antrean Eksekusi Transaksi</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
                Daftar eksekusi arbitrase yang telah Anda setujui dan dikirim ke antrean sistem.
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQueryQueue}
                  onChange={(e) => setSearchQueryQueue(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    color: '#ffffff',
                    outline: 'none',
                    width: '180px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.width = '240px';
                    e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.width = '180px';
                    e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                <svg 
                  style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
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
          </div>

          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--md-sys-color-on-surface-variant)' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📥</span>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>Antrean transaksi kosong.</span>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Silakan eksekusi rute arbitrase yang menguntungkan dari tab sebelah.</p>
              </div>
            ) : (
              <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                  {transactions
                    .filter(tx => {
                      const q = searchQueryQueue.toLowerCase().trim();
                      if (!q) return true;
                      return tx.id.toLowerCase().includes(q) ||
                             tx.symbol.toLowerCase().includes(q) ||
                             tx.buyExchange.toLowerCase().includes(q) ||
                             tx.sellExchange.toLowerCase().includes(q) ||
                             tx.status.toLowerCase().includes(q);
                    })
                    .map(tx => {
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
                              <CoinIcon symbol={tx.symbol} size={compactMode ? 16 : 20} />
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
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar Bursa & Saldo Dompet</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Informasi saldo modal, jaringan, latensi, dan fee transaksi yang terintegrasi secara otonom.
              </p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari bursa/jaringan..."
                value={searchQueryBalances}
                onChange={(e) => setSearchQueryBalances(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: 'var(--md-shape-corner-medium)',
                  color: '#ffffff',
                  outline: 'none',
                  width: '180px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.width = '240px';
                  e.target.style.borderColor = 'var(--md-sys-color-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.width = '180px';
                  e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                }}
              />
              <svg 
                style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                viewBox="0 0 24 24"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                {Object.entries(exchangeBalances)
                  .filter(([exName, info]) => {
                    const q = searchQueryBalances.toLowerCase().trim();
                    if (!q) return true;
                    return exName.toLowerCase().includes(q) || 
                           (info.network && info.network.toLowerCase().includes(q)) ||
                           (info.type && info.type.toLowerCase().includes(q));
                  })
                  .map(([exName, info]) => (
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
                        <ExchangeIcon name={exName} size={compactMode ? 20 : 28} />
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
                          <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
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
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar Aset Koin & Estimasi Portofolio</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Nilai total kepemilikan koin dari seluruh bursa yang terintegrasi beserta alokasi distribusinya.
              </p>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Cari koin/kategori..."
                value={searchQueryPortfolio}
                onChange={(e) => setSearchQueryPortfolio(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: 'var(--md-shape-corner-medium)',
                  color: '#ffffff',
                  outline: 'none',
                  width: '180px',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.width = '240px';
                  e.target.style.borderColor = 'var(--md-sys-color-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.width = '180px';
                  e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                }}
              />
              <svg 
                style={{ position: 'absolute', left: '10px', width: '14px', height: '14px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                viewBox="0 0 24 24"
              >
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
                {coinAssets
                  .filter(coin => {
                    const q = searchQueryPortfolio.toLowerCase().trim();
                    if (!q) return true;
                    return coin.symbol.toLowerCase().includes(q) || 
                           coin.name.toLowerCase().includes(q) ||
                           (coin.category && coin.category.toLowerCase().includes(q));
                  })
                  .map((coin) => {
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
                          <CoinIcon symbol={coin.symbol} size={compactMode ? 20 : 28} />
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
                          <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
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
                            <span style={{ fontSize: '9px', color: 'var(--md-sys-color-on-surface-variant)' }}>
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

      {/* Exchanges Database Tab */}
      {activeTab === 'exchanges' && !selectedExchangeDb && (
        <div className="md3-card table-card" style={{ padding: '0px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
          <div className="table-header-section" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="table-title" style={{ margin: 0 }}>Daftar & Regulasi Bursa Kripto</h2>
              <p style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '4px', marginBottom: 0 }}>
                Data real-time dari database berisi bursa CEX & DEX, tautan resmi, logo bursa, status regulasi Bappebti Indonesia, dan skema biaya (fees).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* View mode toggle */}
              <div className="tabs-container" style={{ margin: 0, padding: '2px', display: 'inline-flex', height: 'auto', gap: '4px' }}>
                <button
                  className={`tab-btn ${exchangesViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setExchangesViewMode('table')}
                  style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                >
                  📋 Tabel
                </button>
                <button
                  className={`tab-btn ${exchangesViewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setExchangesViewMode('grid')}
                  style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '4px' }}
                >
                  🎴 Grid
                </button>
              </div>

              <button
                onClick={fetchExchangesDb}
                className="tab-btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--md-sys-color-outline-variant)',
                  borderRadius: 'var(--md-shape-corner-medium)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Refresh DB
              </button>
            </div>
          </div>

          {loadingExchangesDb ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="skeleton skeleton-text" style={{ width: '40%', margin: '0 auto 12px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '60%', margin: '0 auto 24px' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '0 20px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="md3-card" style={{ padding: '20px', height: '140px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
                    <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: '12px' }}></div>
                  </div>
                ))}
              </div>
            </div>
          ) : errorExchangesDb ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--md-sys-color-error)' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <p style={{ margin: '8px 0' }}>Gagal memuat data dari database: {errorExchangesDb}</p>
              <button
                onClick={fetchExchangesDb}
                className="tab-btn"
                style={{ backgroundColor: 'var(--md-sys-color-error-container)', color: 'var(--md-sys-color-on-error-container)' }}
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 20px 20px' }}>
              {exchangesViewMode === 'table' ? (
                /* Table View Mode */
                <div style={{ overflowX: 'auto' }}>
                  <table className={`md3-table ${compactMode ? 'compact-table' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Bursa / Tipe</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Rating / Kredibilitas</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Reserved Capital / TVL</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Legalitas Indonesia</th>
                        <th style={{ padding: '16px 20px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '700' }}>Endpoint API / Router</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exchangesDb.map((ex) => {
                        const tradeFee = ex.fees?.find(f => f.fee_type === 'CEX_TRADE');
                        const apiAttribute = ex.attributes?.find(a => a.attribute_key === 'api_url' || a.attribute_key === 'factory_address');
                        const withdrawalFees = ex.fees?.filter(f => f.fee_type === 'WITHDRAWAL') || [];

                        return (
                          <tr
                            key={ex.id}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {/* Bursa name & icon */}
                            <td style={{ padding: '16px 20px', fontWeight: '700' }}>
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => openExchangeDbPage(ex)}
                                title="Buka halaman detail bursa"
                              >
                                {ex.logoUrl ? (
                                  <img
                                    src={ex.logoUrl}
                                    alt={ex.name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                    style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    display: ex.logoUrl ? 'none' : 'flex',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #455a64, #607d8b)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: '#fff'
                                  }}
                                >
                                  {ex.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{ex.name}</span>
                                    <span className={`badge ${ex.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                                      {ex.type}
                                    </span>
                                  </div>
                                  {ex.websiteUrl && (
                                    <a
                                      href={ex.websiteUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ fontSize: '10px', color: 'var(--md-sys-color-primary)', textDecoration: 'none', fontWeight: 'normal' }}
                                    >
                                      Kunjungi Website ➔
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Rating */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ color: '#ffb300', fontSize: '13px' }}>⭐</span>
                                  <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>
                                    {ex.rating ? parseFloat(ex.rating).toFixed(1) : '-'} <span style={{ fontSize: '10px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>/ 10</span>
                                  </span>
                                </div>
                                {ex.rating && (() => {
                                  const status = getRatingStatus(ex.rating);
                                  return (
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: status.color }}>
                                      {status.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Reserve Capital */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '13px' }}>
                                  {formatCapital(ex.capital)}
                                </span>
                                {ex.capital && (() => {
                                  const tier = getCapitalTier(ex.capital);
                                  return (
                                    <span style={{
                                      fontSize: '9px',
                                      fontWeight: '700',
                                      color: tier.color,
                                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                      border: `1px solid ${tier.color}33`,
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      width: 'fit-content'
                                    }}>
                                      {tier.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>

                            {/* Legalitas */}
                            <td style={{ padding: '16px 20px' }}>
                              {ex.isRegisteredIndonesia ? (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  color: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                  🛡️ Terdaftar Bappebti
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'var(--md-sys-color-on-surface-variant)',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  padding: '3px 8px',
                                  borderRadius: '4px'
                                }}>
                                  🌍 Internasional
                                </span>
                              )}
                            </td>

                            {/* API / Contract Router */}
                            <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', maxWidth: '240px', wordBreak: 'break-all' }}>
                              {apiAttribute ? apiAttribute.attribute_value : '-'}
                            </td>

                            {/* Fees */}
                            <td style={{ padding: '16px 20px', fontWeight: '700', color: 'var(--color-profit-green)' }}>
                              {tradeFee ? `${(parseFloat(tradeFee.fee_percentage) * 100).toFixed(2)}%` : ex.type === 'CEX' ? '0.10%' : '0.30%'}
                            </td>

                            {/* Withdrawal Fees */}
                            <td style={{ padding: '16px 20px' }}>
                              {withdrawalFees.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                                  {withdrawalFees.map(f => {
                                    const tokenSymbol = f.token_id === 1 ? 'USDT' : f.token_id === 2 ? 'SOL' : f.token_id === 3 ? 'ETH' : 'USDT';
                                    const chainName = f.chain_id === 1 ? 'Ethereum' : f.chain_id === 2 ? 'BSC' : f.chain_id === 3 ? 'Solana' : 'Solana';
                                    return (
                                      <div key={f.id} style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>{tokenSymbol} ({chainName}):</span>
                                        <span style={{ fontWeight: '600', color: '#ffffff' }}>{parseFloat(f.fee_flat).toFixed(2)} {tokenSymbol}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid Cards View Mode */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {exchangesDb.map((ex) => {
                    const tradeFee = ex.fees?.find(f => f.fee_type === 'CEX_TRADE');
                    const apiAttribute = ex.attributes?.find(a => a.attribute_key === 'api_url' || a.attribute_key === 'factory_address');
                    const withdrawalFees = ex.fees?.filter(f => f.fee_type === 'WITHDRAWAL') || [];

                    return (
                      <div
                        key={ex.id}
                        className="md3-card"
                        style={{
                          padding: '20px',
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 'var(--md-shape-corner-medium)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '16px',
                          transition: 'transform 0.2s ease, border-color 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--md-sys-color-primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {/* Top Row: Logo & Name & Type */}
                        <div 
                          style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
                          onClick={() => openExchangeDbPage(ex)}
                          title="Buka halaman detail bursa"
                        >
                          {ex.logoUrl ? (
                            <img
                              src={ex.logoUrl}
                              alt={ex.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          ) : null}
                          <div
                            style={{
                              display: ex.logoUrl ? 'none' : 'flex',
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #455a64, #607d8b)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: '800',
                              color: '#fff'
                            }}
                          >
                            {ex.name.slice(0, 2).toUpperCase()}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>{ex.name}</span>
                              <span className={`badge ${ex.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                                {ex.type}
                              </span>
                            </div>
                            {ex.websiteUrl && (
                              <a
                                href={ex.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '11px', color: 'var(--md-sys-color-primary)', textDecoration: 'none' }}
                              >
                                🔗 Kunjungi Website
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Middle: Regulated Legal Badge */}
                        <div style={{ margin: '4px 0' }}>
                          {ex.isRegisteredIndonesia ? (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: '800',
                              color: '#10b981',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                              🛡️ TERDAFTAR BAPPEBTI (LEGAL)
                            </div>
                          ) : (
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--md-sys-color-on-surface-variant)',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              padding: '4px 10px',
                              borderRadius: '4px'
                            }}>
                              🌍 BURSA INTERNASIONAL
                            </div>
                          )}
                        </div>

                        {/* Rating & Reserves row */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
                          {ex.rating && (() => {
                            const status = getRatingStatus(ex.rating);
                            return (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>
                                <span style={{ color: '#ffb300' }}>⭐</span>
                                <span style={{ color: '#ffffff' }}>{parseFloat(ex.rating).toFixed(1)}</span>
                                <span style={{ color: status.color, fontSize: '10px', marginLeft: '2px' }}>({status.label})</span>
                              </div>
                            );
                          })()}

                          {ex.capital && (() => {
                            const tier = getCapitalTier(ex.capital);
                            return (
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '4px 8px',
                                borderRadius: '6px'
                              }}>
                                <span style={{ color: tier.color }}>💰</span>
                                <span style={{ color: '#ffffff' }}>{formatCapital(ex.capital)}</span>
                                <span style={{ color: tier.color, fontSize: '9px', marginLeft: '2px', backgroundColor: `${tier.color}15`, padding: '1px 4px', borderRadius: '3px' }}>
                                  {tier.label.split(' ')[0]}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Bottom Info: Config Attribute & Fees */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                          {/* API Config */}
                          {apiAttribute && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                                {apiAttribute.attribute_key === 'api_url' ? 'Endpoint API:' : 'Router/Factory:'}
                              </span>
                              <span style={{ fontWeight: '500', color: '#ffffff', wordBreak: 'break-all', textAlign: 'right', fontSize: '11px' }}>
                                {apiAttribute.attribute_value}
                              </span>
                            </div>
                          )}

                          {/* Trade / Pool Fees */}
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                              {ex.type === 'CEX' ? 'Trading Fee (Spot):' : 'Default Pool Fee:'}
                            </span>
                            <span style={{ fontWeight: '700', color: 'var(--color-profit-green)' }}>
                              {tradeFee ? `${(parseFloat(tradeFee.fee_percentage) * 100).toFixed(2)}%` : ex.type === 'CEX' ? '0.10%' : '0.30%'}
                            </span>
                          </div>

                          {/* Withdrawal Fees List */}
                          {withdrawalFees.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                              <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '600', fontSize: '11px' }}>
                                Flat Withdrawal Fee (Penarikan CEX):
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', paddingLeft: '8px' }}>
                                {withdrawalFees.map(f => {
                                  const tokenSymbol = f.token_id === 1 ? 'USDT' : f.token_id === 2 ? 'SOL' : f.token_id === 3 ? 'ETH' : 'USDT';
                                  const chainName = f.chain_id === 1 ? 'Ethereum' : f.chain_id === 2 ? 'BSC' : f.chain_id === 3 ? 'Solana' : 'Solana';
                                  return (
                                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>{tokenSymbol} ({chainName}):</span>
                                      <span style={{ fontWeight: '600', color: '#ffffff' }}>
                                        {parseFloat(f.fee_flat).toFixed(2)} {tokenSymbol}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Exchange Modal Info Dashboard */}
      {showExchangeModal && selectedExchange && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 11, 15, 0.75)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '24px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="md3-card" style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            padding: '30px',
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-shape-corner-large)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowExchangeModal(false);
                setExchangeDetails({ exchange: selectedExchange, tokens: [] });
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              ✕
            </button>

            {/* Exchange Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
              <img 
                src={EXCHANGE_ICONS[selectedExchange] || EXCHANGE_ICONS[selectedExchange.split(' ')[0]] || 'https://assets.coingecko.com/markets/images/default.png'} 
                alt={selectedExchange} 
                style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
              />
              <div>
                <h1 style={{ fontSize: '26px', margin: 0, fontWeight: '800' }}>{selectedExchange}</h1>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${EXCHANGES_LIST.find(e => e.name === selectedExchange)?.type === 'DEX' ? 'badge-dex' : 'badge-cex'}`}>
                    {EXCHANGES_LIST.find(e => e.name === selectedExchange)?.type || 'CEX'}
                  </span>
                  {EXCHANGES_LIST.find(e => e.name === selectedExchange)?.local && (
                    <span className="badge" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>LOCAL INDONESIA</span>
                  )}
                  <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>ONLINE</span>
                </div>
              </div>
            </div>

            {/* API Info & Latency Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--md-shape-corner-medium)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>Latency API</span>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-profit-green)', marginTop: '4px' }}>
                  {EXCHANGE_API_INFO[selectedExchange]?.latency || '45ms'}
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--md-shape-corner-medium)', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>Endpoints Tersedia</span>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginTop: '4px' }}>
                  {EXCHANGE_API_INFO[selectedExchange]?.apis || 'Public Market API / JSON-RPC'}
                </div>
              </div>
            </div>

            {/* Supported Tokens (Listed in App) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '16px', margin: 0, borderLeft: '3px solid var(--md-sys-color-primary)', paddingLeft: '8px' }}>
                Token Terdaftar di Aplikasi ({exchangeDetails.tokens?.length || 0})
              </h3>
              
              {/* Search Box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Cari token..."
                  value={searchQueryModalTokens}
                  onChange={(e) => setSearchQueryModalTokens(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 28px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: 'var(--md-shape-corner-medium)',
                    color: '#ffffff',
                    outline: 'none',
                    width: '140px',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.width = '180px';
                    e.target.style.borderColor = 'var(--md-sys-color-primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.width = '140px';
                    e.target.style.borderColor = 'var(--md-sys-color-outline-variant)';
                  }}
                />
                <svg 
                  style={{ position: 'absolute', left: '8px', width: '12px', height: '12px', fill: 'var(--md-sys-color-on-surface-variant)', pointerEvents: 'none' }} 
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
            </div>

            {loadingExchange ? (
              <div style={{ padding: '20px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>Memuat data token...</div>
            ) : !exchangeDetails.tokens || exchangeDetails.tokens.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada token terdaftar yang didukung.</div>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--md-shape-corner-medium)', overflow: 'hidden' }}>
                <table className={compactMode ? 'compact-table' : ''} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)' }}>Token</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Harga Last</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Beli (Ask)</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Jual (Bid)</th>
                      <th style={{ padding: compactMode ? '8px 12px' : '12px 16px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeDetails.tokens
                      ?.filter(token => {
                        const q = searchQueryModalTokens.toLowerCase().trim();
                        if (!q) return true;
                        const coinInfo = COIN_META_LOOKUP[token.symbol] || { name: token.symbol };
                        return token.symbol.toLowerCase().includes(q) || 
                               coinInfo.name.toLowerCase().includes(q);
                      })
                      ?.map(token => {
                        const coinInfo = COIN_META_LOOKUP[token.symbol] || { name: token.symbol };
                      return (
                        <tr key={token.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', fontWeight: '700' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CoinIcon symbol={token.symbol} size={20} />
                              <span>{token.symbol}</span>
                              <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', fontWeight: 'normal' }}>({coinInfo.name})</span>
                            </div>
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right' }}>
                            ${token.price ? (token.price >= 0.01 ? token.price.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.price.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right', color: 'var(--color-profit-green)' }}>
                            ${token.ask ? (token.ask >= 0.01 ? token.ask.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.ask.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'right', color: 'var(--md-sys-color-primary)' }}>
                            ${token.bid ? (token.bid >= 0.01 ? token.bid.toLocaleString('id-ID', { minimumFractionDigits: 2 }) : token.bid.toFixed(7)) : '-'}
                          </td>
                          <td style={{ padding: compactMode ? '8px 12px' : '12px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => {
                                handleAssetChange(token.symbol);
                                setShowExchangeModal(false);
                                setActiveTab('prices');
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: 'var(--md-sys-color-primary-container)',
                                color: 'var(--md-sys-color-on-primary-container)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Pilih Koin
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Unlisted Tokens (Not in App - limited to 10) */}
            <h3 style={{ fontSize: '16px', marginBottom: '12px', borderLeft: '3px solid var(--md-sys-color-outline-variant)', paddingLeft: '8px' }}>
              Token Lain yang Didukung (Tidak Terdaftar di Aplikasi - Batas 10)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
              {(EXCHANGE_API_INFO[selectedExchange]?.unlisted || ['BTC', 'ETH']).map(sym => (
                <div 
                  key={sym} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  <CoinIcon symbol={sym} size={18} />
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </>
      )}

      {/* Real Database Exchange Detail Page */}
      {activeTab === 'exchanges' && selectedExchangeDb && (
        <div style={{
          width: '100%',
          display: 'block',
          minHeight: '100vh',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="md3-card" style={{
            minHeight: 'calc(100vh - 48px)',
            overflow: 'hidden',
            position: 'relative',
            padding: 0,
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderRadius: 'var(--md-shape-corner-large)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Back Button */}
            <button
              className="exchange-detail-back-button"
              onClick={closeExchangeDbPage}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: 0,
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '20px 28px 0',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            >
              ✕
            </button>

            <div style={{ flex: 1, padding: '20px 28px 28px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              {selectedExchangeDb.logoUrl ? (
                <img
                  src={selectedExchangeDb.logoUrl}
                  alt={selectedExchangeDb.name}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ) : (
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #455a64, #607d8b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#fff'
                }}>
                  {selectedExchangeDb.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '800', color: '#ffffff' }}>{selectedExchangeDb.name}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge ${selectedExchangeDb.type === 'CEX' ? 'badge-cex' : 'badge-dex'}`}>
                    {selectedExchangeDb.type}
                  </span>
                  {selectedExchangeDb.isRegisteredIndonesia ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 'bold' }}>🛡️ TERDAFTAR BAPPEBTI</span>
                  ) : (
                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--md-sys-color-on-surface-variant)' }}>🌍 BURSA INTERNASIONAL</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trust & Capital Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: 'var(--md-shape-corner-medium)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>⭐ Kredibilitas & Trust Score</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>
                    {selectedExchangeDb.rating ? parseFloat(selectedExchangeDb.rating).toFixed(1) : '-'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>/ 10.0</span>
                </div>
                {selectedExchangeDb.rating && (() => {
                  const status = getRatingStatus(selectedExchangeDb.rating);
                  return (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: status.color, marginTop: '2px' }}>
                      Status: {status.label}
                    </span>
                  );
                })()}
              </div>

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                padding: '16px',
                borderRadius: 'var(--md-shape-corner-medium)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', fontWeight: 'bold' }}>💰 Modal Cadangan (Proof of Reserves / TVL)</span>
                <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-profit-green)', marginTop: '4px' }}>
                  {formatCapital(selectedExchangeDb.capital)}
                </div>
                {selectedExchangeDb.capital && (() => {
                  const tier = getCapitalTier(selectedExchangeDb.capital);
                  return (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: tier.color, marginTop: '2px' }}>
                      Kategori: {tier.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <button
                onClick={() => setExchangeDbDetailTab('overview')}
                className={`tab-btn ${exchangeDbDetailTab === 'overview' ? 'active' : ''}`}
                style={{
                  backgroundColor: exchangeDbDetailTab === 'overview' ? 'var(--md-sys-color-primary-container)' : 'rgba(255,255,255,0.04)',
                  color: exchangeDbDetailTab === 'overview' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                  border: exchangeDbDetailTab === 'overview' ? '1px solid var(--md-sys-color-primary)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                Overview
              </button>
              <button
                onClick={() => setExchangeDbDetailTab('market')}
                className={`tab-btn ${exchangeDbDetailTab === 'market' ? 'active' : ''}`}
                style={{
                  backgroundColor: exchangeDbDetailTab === 'market' ? 'var(--md-sys-color-primary-container)' : 'rgba(255,255,255,0.04)',
                  color: exchangeDbDetailTab === 'market' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)',
                  border: exchangeDbDetailTab === 'market' ? '1px solid var(--md-sys-color-primary)' : '1px solid rgba(255,255,255,0.08)'
                }}
              >
                Market Data
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {exchangeDbDetailTab === 'market' && (
              <>
              {/* Fiat Pairs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pair Token / Fiat dari Database
                    </h4>
                    <span className="badge" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', fontWeight: '800' }}>
                      {filteredExchangeFiatPairs.length}/{selectedExchangeFiatPairs.length} pair
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      value={exchangeMarketSearchQuery}
                      onChange={(e) => setExchangeMarketSearchQuery(e.target.value)}
                      placeholder="Search pair/token/status..."
                      style={{
                        width: '220px',
                        maxWidth: '42vw',
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                    {selectedExchangeMarketPairs.length > 0 && (
                      <span className="badge" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa', fontWeight: '800' }}>
                        {selectedExchangeMarketPairs.length} selected
                      </span>
                    )}
                    <button
                      onClick={handleExportExchangeMarketCsv}
                      disabled={selectedExchangeMarketPairs.length === 0}
                      className="tab-btn"
                      style={{
                        padding: '7px 10px',
                        fontSize: '12px',
                        backgroundColor: selectedExchangeMarketPairs.length === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(16,185,129,0.14)',
                        color: selectedExchangeMarketPairs.length === 0 ? 'var(--md-sys-color-on-surface-variant)' : '#10b981',
                        border: selectedExchangeMarketPairs.length === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,185,129,0.25)',
                        cursor: selectedExchangeMarketPairs.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: '800'
                      }}
                    >
                      Export CSV
                    </button>
                    <div
                      key={exchangeMarketRefreshCycle}
                      title="Auto refresh setiap 10 detik"
                      style={{
                        width: '30px',
                        height: '30px',
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <svg viewBox="0 0 32 32" style={{ width: '30px', height: '30px' }}>
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="rgba(255,255,255,0.12)"
                          strokeWidth="3"
                        />
                        <circle
                          className="market-refresh-ring-progress"
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="var(--md-sys-color-primary)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="75.4"
                          strokeDashoffset="75.4"
                        />
                      </svg>
                      <span style={{
                        position: 'absolute',
                        fontSize: '8px',
                        fontWeight: '800',
                        color: 'var(--md-sys-color-on-surface-variant)'
                      }}>
                        10s
                      </span>
                    </div>
                  </div>
                </div>
                {errorExchangeMarketData && (
                  <div style={{ padding: '10px 12px', marginBottom: '8px', border: '1px solid var(--md-sys-color-error)', borderRadius: '8px', color: 'var(--md-sys-color-error)', fontSize: '12px', backgroundColor: 'rgba(239,83,80,0.08)' }}>
                    Gagal memuat harga market: {errorExchangeMarketData}
                  </div>
                )}
                {selectedExchangeFiatPairs.length === 0 ? (
                  <div style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    Tidak ada pair token / fiat yang terdaftar di database untuk bursa ini.
                  </div>
                ) : filteredExchangeFiatPairs.length === 0 ? (
                  <div style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    Tidak ada pair yang cocok dengan pencarian.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <table className={`exchange-market-table ${compactMode ? 'compact-table' : ''}`} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '10px 12px', width: '36px' }}>
                            <input
                              type="checkbox"
                              checked={allVisibleExchangeMarketRowsSelected}
                              onChange={toggleAllVisibleExchangeMarketRows}
                              aria-label="Select all visible market rows"
                              style={{ cursor: 'pointer' }}
                            />
                          </th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('baseToken')}>Base Token {getExchangeMarketSortIndicator('baseToken')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('last')}>Last / Mid {getExchangeMarketSortIndicator('last')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'center', minWidth: '132px' }}>1 Jam</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('bid')}>Bid {getExchangeMarketSortIndicator('bid')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('ask')}>Ask {getExchangeMarketSortIndicator('ask')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('quantity')}>Bid / Ask Qty {getExchangeMarketSortIndicator('quantity')}</th>
                          <th style={{ padding: '10px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleExchangeMarketSort('timestamp')}>Waktu Harga {getExchangeMarketSortIndicator('timestamp')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedExchangeFiatPairs.map((pair) => {
                          const market = getExchangeMarketRow(pair);
                          const quoteSymbol = market?.nativeCurrency || pair.quoteToken?.symbol || 'IDR';
                          const lastOrMid = market?.mid ?? market?.last ?? market?.price ?? null;
                          const bid = market?.bid ?? market?.nativeBid ?? null;
                          const ask = market?.ask ?? market?.nativeAsk ?? null;
                          const priceTimestamp = market?.priceTimestamp || market?.timestamp || null;
                          const rowKey = getExchangeMarketRowKey(pair);
                          const isSelected = selectedExchangeMarketRows.has(rowKey);

                          return (
                          <tr key={pair.id || pair.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: isSelected ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                            <td style={{ padding: '10px 12px' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExchangeMarketRowSelection(pair)}
                                aria-label={`Select ${pair.symbol}`}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div className="exchange-market-token-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', fontWeight: '700' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <CoinIcon symbol={pair.baseToken?.symbol} size={18} />
                                  <span>{pair.baseToken?.symbol || '-'}</span>
                                  <span className="exchange-market-token-name" style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '500', fontSize: '11px' }}>
                                    {pair.baseToken?.name || ''}
                                  </span>
                                </div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  color: '#ffffff',
                                  fontFamily: 'Consolas, Monaco, monospace',
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  lineHeight: 1.4,
                                  whiteSpace: 'nowrap'
                                }}>
                                  {pair.symbol}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#ffffff' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatNativeMarketPrice(lastOrMid, quoteSymbol)}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              {loadingExchangeMarketData && !market ? '...' : <PriceSparkline history={market?.history} />}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-primary)', fontWeight: '700' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatNativeMarketPrice(bid, quoteSymbol)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--color-profit-green)', fontWeight: '700' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatNativeMarketPrice(ask, quoteSymbol)}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '11px' }}>
                              {market ? `${market.bidQty ?? '-'} / ${market.askQty ?? '-'}` : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--md-sys-color-on-surface-variant)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {loadingExchangeMarketData && !market ? '...' : formatMarketPriceTimestamp(priceTimestamp)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </>
              )}

              {exchangeDbDetailTab === 'overview' && (
              <>
              {/* Endpoint API / Router */}
              {selectedExchangeDb.attributes && selectedExchangeDb.attributes.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Konfigurasi Jaringan API / Smart Contract
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {selectedExchangeDb.attributes.map(attr => (
                      <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--md-sys-color-on-surface-variant)', fontWeight: '600' }}>{attr.attributeKey}:</span>
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', color: '#ffffff' }}>{attr.attributeValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supported Chains */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Blockchain Jaringan yang Didukung (Chains)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(() => {
                    const chains = [];
                    // Extract unique chains from fees
                    selectedExchangeDb.fees?.forEach(f => {
                      if (f.chain && !chains.some(c => c.id === f.chain.id)) {
                        chains.push(f.chain);
                      }
                    });
                    if (chains.length === 0) {
                      return <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada data jaringan blockchain khusus terdaftar.</span>;
                    }
                    return chains.map(c => (
                      <span
                        key={c.id}
                        className="badge badge-dex"
                        style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', borderRadius: '6px' }}
                      >
                        🌐 {c.name} ({c.chainIdentifier || 'EVM'})
                      </span>
                    ));
                  })()}
                </div>
              </div>

              {/* Supported Tokens */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Token Kripto Terdaftar & Aktif (Tokens)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(() => {
                    const tokens = [];
                    // Extract unique tokens from tokenPairs baseToken and quoteToken
                    selectedExchangeDb.tokenPairs?.forEach(tp => {
                      if (tp.baseToken && !tokens.some(t => t.id === tp.baseToken.id)) {
                        tokens.push(tp.baseToken);
                      }
                      if (tp.quoteToken && !tokens.some(t => t.id === tp.quoteToken.id)) {
                        tokens.push(tp.quoteToken);
                      }
                    });
                    // Fallback to fees tokens
                    selectedExchangeDb.fees?.forEach(f => {
                      if (f.token && !tokens.some(t => t.id === f.token.id)) {
                        tokens.push(f.token);
                      }
                    });

                    if (tokens.length === 0) {
                      return <span style={{ fontSize: '12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tidak ada token terdaftar.</span>;
                    }
                    return tokens.map(t => (
                      <div
                        key={t.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#ffffff'
                        }}
                      >
                        <CoinIcon symbol={t.symbol} size={16} />
                        <span>{t.symbol}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Fee Rules */}
              {selectedExchangeDb.fees && selectedExchangeDb.fees.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rincian Tarif Biaya (Fees)
                  </h4>
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Tipe Biaya</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Token</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)' }}>Jaringan</th>
                          <th style={{ padding: '8px 12px', color: 'var(--md-sys-color-on-surface-variant)', textAlign: 'right' }}>Tarif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExchangeDb.fees.map(f => (
                          <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{f.feeType}</td>
                            <td style={{ padding: '8px 12px' }}>{f.token ? f.token.symbol : '-'}</td>
                            <td style={{ padding: '8px 12px' }}>{f.chain ? f.chain.name : '-'}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-profit-green)' }}>
                              {f.feePercentage ? `${(parseFloat(f.feePercentage) * 100).toFixed(2)}%` : f.feeFlat ? `${parseFloat(f.feeFlat).toFixed(2)} ${f.token ? f.token.symbol : ''}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              </>
              )}
            </div>
          </div>
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

      {/* Material Floating Action Button (FAB) for manual refresh */}
      {!isExchangeDetailPage && (
      <button
        className={`md3-fab ${isRefreshing ? 'refreshing' : ''}`}
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        aria-label="Refresh harga secara manual"
      >
        <svg className="fab-icon" viewBox="0 0 24 24">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
        </svg>
        <span>Refresh Sekarang</span>
      </button>
      )}
    </div>
  );
}

export default App;
