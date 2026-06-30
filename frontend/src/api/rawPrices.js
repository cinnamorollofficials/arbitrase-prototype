import { API_BASE_URL } from './client';

export async function getRawPrices(exchangeName, symbol) {
  const query = new URLSearchParams({ exchange: exchangeName, symbol });
  const response = await fetch(`${API_BASE_URL}/api/raw-prices?${query}`);
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Redis tidak aktif atau gagal terhubung di backend.');
    }
    throw new Error(`Gagal memuat data mentah dari Redis (HTTP ${response.status})`);
  }
  return response.json();
}
