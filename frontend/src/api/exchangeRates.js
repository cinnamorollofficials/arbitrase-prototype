export async function getUsdIdrRate() {
  const response = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!response.ok) return null;
  const data = await response.json();
  return data.rates?.IDR ?? null;
}
