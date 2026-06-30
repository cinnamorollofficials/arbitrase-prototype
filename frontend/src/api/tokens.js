import { requestJson } from './client';

export const getTokensDb = () => requestJson('/api/tokens-db');
