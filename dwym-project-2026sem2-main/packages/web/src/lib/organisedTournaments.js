import { useCallback, useSyncExternalStore } from 'react';

/**
 * La API no tiene un endpoint para listar los torneos que organiza un usuario
 * (solo GET /api/me/tournaments, que devuelve aquellos en los que participa).
 * Por eso recordamos en el navegador los ids de los torneos que el organizador
 * crea o abre, separados por usuario y por base de datos (x-api-key).
 */
const listeners = new Set();
const storageKey = (apiKey, userId) => `batalla-naval.organised.${apiKey}.${userId}`;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch {
    return [];
  }
}

const cache = new Map();
function snapshot(key) {
  const raw = localStorage.getItem(key) ?? '[]';
  if (cache.get(key)?.raw !== raw) cache.set(key, { raw, ids: read(key) });
  return cache.get(key).ids;
}

function write(key, ids) {
  localStorage.setItem(key, JSON.stringify([...new Set(ids)]));
  listeners.forEach((l) => l());
}

export function useOrganisedTournamentIds(apiKey, userId) {
  const key = storageKey(apiKey, userId);
  const ids = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot(key),
  );
  const add = useCallback((id) => write(key, [id, ...read(key)]), [key]);
  const remove = useCallback((id) => write(key, read(key).filter((x) => x !== id)), [key]);
  return { ids, add, remove };
}
