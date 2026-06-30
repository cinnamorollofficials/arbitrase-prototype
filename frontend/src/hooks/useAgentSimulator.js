import { useEffect, useMemo, useState } from 'react';
import useUrlState from './useUrlState';

export default function useAgentSimulator({ symbolsList, setSymbolsList, setSpreads }) {
  const [agentStatus, setAgentStatus] = useState('running');
  const [minSpreadCriteria, setMinSpreadCriteria] = useUrlState('spread', 1.5);
  const [numAgents, setNumAgents] = useUrlState('agents', 1);
  const [coinCategory, setCoinCategory] = useUrlState('cat', 'ALL');
  const [agentLogs, setAgentLogs] = useState([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Memulai agen AI pemindai spreads...`,
    `[${new Date().toLocaleTimeString()}] [INFO] Kriteria: Min Spread > 1.50%`
  ]);
  const [discoveredCoins, setDiscoveredCoins] = useState([
    { symbol: 'NEIRO', name: 'Neiro Solana', spread: 3.45, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN', added: false },
    { symbol: 'MOG', name: 'Mog Coin', spread: 3.12, buyEx: 'Bybit', sellEx: 'Gate.io', category: 'MICIN', added: false }
  ]);

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

  return {
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
  };
}
