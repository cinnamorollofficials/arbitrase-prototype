import { useState } from 'react';

export default function useUrlState(key, defaultValue) {
  const getFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    // attempt to coerce type to match default
    if (typeof defaultValue === 'number') return isNaN(Number(raw)) ? defaultValue : Number(raw);
    return raw;
  };

  const [state, _setState] = useState(getFromUrl);

  const setState = (valueOrFn) => {
    _setState(prev => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      const params = new URLSearchParams(window.location.search);
      if (next === defaultValue || next === null || next === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(next));
      }
      const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
      return next;
    });
  };

  return [state, setState];
}
