import { beforeEach, describe, expect, it } from 'vitest';
import { configureSessionStorage, getToken, SESSION_STORAGE_KEY, useSessionStore } from '../src/sessionStore.js';

/** Almacenamiento en memoria con la interfaz de localStorage. */
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
}

const login = { email: 'player1@example.com', role: 'player', token: 'jwt-123', userId: 'player1@example.com' };

describe('useSessionStore (zustand)', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, hydrated: false });
  });

  it('arranca sin sesión y sin hidratar', () => {
    expect(useSessionStore.getState().session).toBeNull();
    expect(useSessionStore.getState().hydrated).toBe(false);
    expect(getToken()).toBeNull();
  });

  it('carga la sesión guardada al configurar el almacenamiento', async () => {
    const storage = memoryStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ state: { session: login }, version: 0 }) });
    await configureSessionStorage(storage);
    expect(useSessionStore.getState().hydrated).toBe(true);
    expect(useSessionStore.getState().session).toEqual(login);
    expect(getToken()).toBe('jwt-123');
  });

  it('marca como hidratado aunque no haya nada guardado', async () => {
    await configureSessionStorage(memoryStorage());
    expect(useSessionStore.getState().hydrated).toBe(true);
    expect(useSessionStore.getState().session).toBeNull();
  });

  it('persiste solo la sesión al iniciar y la borra al cerrar', async () => {
    const storage = memoryStorage();
    await configureSessionStorage(storage);

    useSessionStore.getState().setSession(login);
    const saved = JSON.parse(storage.data.get(SESSION_STORAGE_KEY));
    expect(saved.state).toEqual({ session: login });
    expect(getToken()).toBe('jwt-123');

    useSessionStore.getState().clearSession();
    expect(getToken()).toBeNull();
    expect(JSON.parse(storage.data.get(SESSION_STORAGE_KEY)).state).toEqual({ session: null });
  });

  it('funciona con un almacenamiento asíncrono (como SecureStore)', async () => {
    const sync = memoryStorage({ [SESSION_STORAGE_KEY]: JSON.stringify({ state: { session: login }, version: 0 }) });
    const asyncStorage = {
      getItem: async (k) => sync.getItem(k),
      setItem: async (k, v) => sync.setItem(k, v),
      removeItem: async (k) => sync.removeItem(k),
    };
    await configureSessionStorage(asyncStorage);
    expect(useSessionStore.getState().session).toEqual(login);
  });
});
