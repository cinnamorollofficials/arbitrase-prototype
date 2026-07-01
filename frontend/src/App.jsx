import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppShell from './layouts/AppShell';
import AppRoutes from './routes/AppRoutes';
import useExchangeRoute from './features/exchanges/hooks/useExchangeRoute';
import { defaultSymbols, COIN_ICONS, COIN_META_LOOKUP } from './constants/marketData';
import useUrlState from './hooks/useUrlState';
import useAgentSimulator from './hooks/useAgentSimulator';
import useBalances from './hooks/useBalances';
import useTransactions from './hooks/useTransactions';
import { getUsdIdrRate } from './api/exchangeRates';
import { getExchangeDetails as fetchExchangeDetailsApi, getExchangesDb as fetchExchangesDbApi } from './api/exchanges';
import { getOpportunities, getPrices } from './api/prices';
import { getRawPrices } from './api/rawPrices';
import { getTokensDb as fetchTokensDbApi } from './api/tokens';

function App() {
  const [prices, setPrices] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default theme is dark mode
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
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
  useEffect(() => {
    if (activeTab === 'exchanges') {
      fetchExchangesDb();
    } else if (activeTab === 'portfolio') {
      fetchTokensDb();
    }
  }, [activeTab]);

  const [exchangesViewMode, setExchangesViewMode] = useUrlState('ex_mode', 'table');
  const [exchangeDbDetailTab, setExchangeDbDetailTab] = useState('overview');
  const resetExchangeDetailTab = useCallback(() => setExchangeDbDetailTab('overview'), []);
  const {
    selectedExchangeDb,
    openExchangeDbPage,
    closeExchangeDbPage
  } = useExchangeRoute({
    exchanges: exchangesDb,
    setActiveTab,
    onRouteDetailOpened: resetExchangeDetailTab,
    onRouteDetailClosed: resetExchangeDetailTab
  });
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


  const isExchangeDetailPage = activeTab === 'exchanges' && Boolean(selectedExchangeDb);

  return (
    <AppShell
      activeSymbol={activeSymbol}
      isRefreshing={isRefreshing}
      refreshCountdown={refreshCountdown}
      lastUpdated={lastUpdated}
      compactMode={compactMode}
      onToggleCompact={() => setIsCompact(compactMode ? 'false' : 'true')}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(prev => !prev)}
      breadcrumbExchangeName={isExchangeDetailPage ? selectedExchangeDb.name : null}
      onBackToExchanges={closeExchangeDbPage}
    >

      <AppRoutes
        activeSymbol={activeSymbol}
        symbolsList={symbolsList}
        spreads={spreads}
        handleAssetChange={handleAssetChange}
        error={error}
        handleManualRefresh={handleManualRefresh}
        loading={loading}
        prices={prices}
        compactMode={compactMode}
        renderInfoIcon={renderInfoIcon}
        stats={stats}
        usdToIdrRate={usdToIdrRate}
        refreshCountdown={refreshCountdown}
        netCalculation={netCalculation}
        capital={capital}
        setCapital={setCapital}
        setShowConfirmModal={setShowConfirmModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        transactions={transactions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filter={filter}
        setFilter={setFilter}
        filteredPrices={filteredPrices}
        sortedPrices={sortedPrices}
        handleSort={handleSort}
        getSortIndicator={getSortIndicator}
        hoveredExchange={hoveredExchange}
        setHoveredExchange={setHoveredExchange}
        selectedExchange={selectedExchange}
        setSelectedExchange={setSelectedExchange}
        setShowExchangeModal={setShowExchangeModal}
        handleInspectRawPrice={handleInspectRawPrice}
        filteredOpportunities={filteredOpportunities}
        searchQueryQueue={searchQueryQueue}
        setSearchQueryQueue={setSearchQueryQueue}
        expandedTxId={expandedTxId}
        setExpandedTxId={setExpandedTxId}
        agentStatus={agentStatus}
        setAgentStatus={setAgentStatus}
        minSpreadCriteria={minSpreadCriteria}
        setMinSpreadCriteria={setMinSpreadCriteria}
        numAgents={numAgents}
        setNumAgents={setNumAgents}
        coinCategory={coinCategory}
        setCoinCategory={setCoinCategory}
        agentLogs={agentLogs}
        discoveredCoins={discoveredCoins}
        handleAddMockCoin={handleAddMockCoin}
        searchQueryBalances={searchQueryBalances}
        setSearchQueryBalances={setSearchQueryBalances}
        exchangeBalances={exchangeBalances}
        coinAssets={coinAssets}
        searchQueryPortfolio={searchQueryPortfolio}
        setSearchQueryPortfolio={setSearchQueryPortfolio}
        exchangesDb={exchangesDb}
        loadingExchangesDb={loadingExchangesDb}
        errorExchangesDb={errorExchangesDb}
        exchangesViewMode={exchangesViewMode}
        setExchangesViewMode={setExchangesViewMode}
        fetchExchangesDb={fetchExchangesDb}
        openExchangeDbPage={openExchangeDbPage}
        showExchangeModal={showExchangeModal}
        setExchangeDetails={setExchangeDetails}
        exchangeDetails={exchangeDetails}
        loadingExchange={loadingExchange}
        searchQueryModalTokens={searchQueryModalTokens}
        setSearchQueryModalTokens={setSearchQueryModalTokens}
        selectedExchangeDb={selectedExchangeDb}
        exchangeDbDetailTab={exchangeDbDetailTab}
        setExchangeDbDetailTab={setExchangeDbDetailTab}
        closeExchangeDbPage={closeExchangeDbPage}
        showConfirmModal={showConfirmModal}
        setShowRawModal={setShowRawModal}
        handleExecuteTransaction={handleExecuteTransaction}
        showRawModal={showRawModal}
        rawModalExchange={rawModalExchange}
        rawModalSymbol={rawModalSymbol}
        rawModalLoading={rawModalLoading}
        rawModalError={rawModalError}
        rawModalData={rawModalData}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
        isExchangeDetailPage={isExchangeDetailPage}
      />
    </AppShell>
  );
}

export default App;
