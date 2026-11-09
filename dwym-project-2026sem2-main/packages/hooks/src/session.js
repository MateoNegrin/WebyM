import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ApiError, createApiClient } from '@batalla/core';
import { configureSessionStorage, getToken, useSessionStore } from './sessionStore.js';

/** Contexto solo para el cliente de la API: el usuario y el token viven en zustand. */
const ApiContext = createContext(null);

/**
 * Crea el QueryClient con valores por defecto razonables para esta app.
 * No reintenta errores 4xx: son respuestas definitivas de la API.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5_000,
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });
}

/**
 * Provee el cliente de la API y react-query, y conecta el store de sesión
 * (zustand) con el almacenamiento de la plataforma.
 *
 * @param {object} props
 * @param {{ baseUrl: string, apiKey: string }} props.config
 * @param {import('zustand/middleware').StateStorage} props.storage
 *   dónde persistir la sesión (localStorage en web, SecureStore en móvil)
 * @param {QueryClient} [props.queryClient]
 */
export function SessionProvider({ config, storage, queryClient, children }) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  return createElement(QueryClientProvider, { client }, createElement(SessionBridge, { config, storage }, children));
}

function SessionBridge({ config, storage, children }) {
  const queryClient = useQueryClient();

  // Carga la sesión guardada en el almacenamiento de la plataforma.
  useEffect(() => {
    configureSessionStorage(storage);
  }, [storage]);

  // Al cambiar de usuario (login / logout / sesión vencida) se descarta la caché.
  useEffect(
    () =>
      useSessionStore.subscribe((state, prev) => {
        if (state.session?.token !== prev.session?.token) queryClient.clear();
      }),
    [queryClient],
  );

  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        getToken,
        // Un 401 significa que el token ya no sirve: se cierra la sesión local.
        onUnauthorized: () => useSessionStore.getState().clearSession(),
      }),
    [config.baseUrl, config.apiKey],
  );

  return createElement(ApiContext.Provider, { value: api }, children);
}

/** Cliente de la API (agrega x-api-key y el token de la sesión). */
export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi debe usarse dentro de <SessionProvider>');
  return api;
}

/** { session, ready, api, login, logout } */
export function useSession() {
  const api = useApi();
  const session = useSessionStore((s) => s.session);
  const ready = useSessionStore((s) => s.hydrated);

  const login = useCallback(
    async (email, password) => {
      const result = await api.login(email.trim(), password);
      useSessionStore.getState().setSession(result);
      return result;
    },
    [api],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Aunque falle la API (p. ej. token ya vencido) cerramos la sesión local.
    }
    useSessionStore.getState().clearSession();
  }, [api]);

  return useMemo(() => ({ session, ready, api, login, logout }), [session, ready, api, login, logout]);
}
