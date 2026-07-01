import { useCallback, useEffect, useState } from 'react';

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

function useExchangeRoute({ exchanges, setActiveTab, onRouteDetailOpened, onRouteDetailClosed }) {
  const [exchangeRouteKey, setExchangeRouteKey] = useState(getExchangeRouteKeyFromPath);
  const [selectedExchangeDb, setSelectedExchangeDb] = useState(null);

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
  }, [setActiveTab]);

  useEffect(() => {
    if (!exchangeRouteKey) return;

    const match = exchanges.find((exchange) => {
      const id = String(exchange.id ?? '');
      const name = String(exchange.name ?? '');
      return id === exchangeRouteKey || name.toLowerCase() === exchangeRouteKey.toLowerCase();
    });

    if (match) {
      onRouteDetailOpened?.(match);
      setSelectedExchangeDb(match);
    }
  }, [exchangeRouteKey, exchanges, onRouteDetailOpened]);

  const openExchangeDbPage = useCallback((exchange) => {
    window.history.pushState(null, '', buildExchangeDetailPath(exchange));
    setExchangeRouteKey(String(exchange?.id ?? exchange?.name ?? ''));
    setActiveTab('exchanges');
    onRouteDetailOpened?.(exchange);
    setSelectedExchangeDb(exchange);
  }, [onRouteDetailOpened, setActiveTab]);

  const closeExchangeDbPage = useCallback(() => {
    window.history.pushState(null, '', buildExchangesListPath());
    setExchangeRouteKey(null);
    onRouteDetailClosed?.();
    setSelectedExchangeDb(null);
  }, [onRouteDetailClosed]);

  return {
    exchangeRouteKey,
    selectedExchangeDb,
    openExchangeDbPage,
    closeExchangeDbPage
  };
}

export default useExchangeRoute;
