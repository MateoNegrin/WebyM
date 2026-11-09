import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Store global de la sesión (zustand). Guarda el `Login` que devuelve la API
 * (`{ email, role, token, userId }`) y lo persiste para que el usuario siga
 * logueado al recargar o reabrir la app.
 *
 * El almacenamiento depende de la plataforma (localStorage en la web,
 * SecureStore en el móvil), así que cada app lo configura con
 * `configureSessionStorage` antes de hidratar el store.
 */
export const SESSION_STORAGE_KEY = 'batalla-naval.session';

/** @type {import('zustand/middleware').StateStorage | null} */
let backend = null;

/** Delegamos en el almacenamiento que configure la app (puede ser asíncrono). */
const storageBridge = {
  getItem: (name) => (backend ? backend.getItem(name) : null),
  setItem: (name, value) => backend?.setItem(name, value),
  removeItem: (name) => backend?.removeItem(name),
};

export const useSessionStore = create()(
  persist(
    (set) => ({
      /** Login de la API, o null si no hay sesión. */
      session: null,
      /** true cuando ya se leyó la sesión guardada (al iniciar la app). */
      hydrated: false,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => storageBridge),
      // Solo se persiste la sesión, no los flags de estado.
      partialize: (state) => ({ session: state.session }),
      // La hidratación la dispara la app cuando ya configuró el almacenamiento.
      skipHydration: true,
      onRehydrateStorage: () => () => useSessionStore.setState({ hydrated: true }),
    },
  ),
);

/**
 * Define dónde se persiste la sesión y la carga.
 * @param {import('zustand/middleware').StateStorage} storage
 */
export function configureSessionStorage(storage) {
  backend = storage;
  return useSessionStore.persist.rehydrate();
}

/** JWT de la sesión actual, para usar fuera de React (p. ej. el cliente HTTP). */
export const getToken = () => useSessionStore.getState().session?.token ?? null;

// Selectores para componentes
export const useCurrentSession = () => useSessionStore((s) => s.session);
export const useToken = () => useSessionStore((s) => s.session?.token ?? null);
export const useSessionReady = () => useSessionStore((s) => s.hydrated);
