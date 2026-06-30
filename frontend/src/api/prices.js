import { requestJson } from './client';

export const getPrices = (symbol) => requestJson(`/api/prices?symbol=${encodeURIComponent(symbol)}`);
export const getOpportunities = () => requestJson('/api/opportunities');
