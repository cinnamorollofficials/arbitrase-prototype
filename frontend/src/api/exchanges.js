import { requestJson } from './client';

export const getExchangesDb = () => requestJson('/api/exchanges-db');
export const getExchangeDetails = (name) => requestJson(`/api/exchanges/${encodeURIComponent(name)}`);
export const getExchangeMarketData = (exchangeId) => requestJson(`/api/exchanges-db/${exchangeId}/market-data`);
