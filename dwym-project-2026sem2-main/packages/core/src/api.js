/**
 * Cliente de la API REST de la cátedra (enunciado, sección 6).
 * Sin dependencias: usa `fetch`, disponible en navegadores y en React Native.
 */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const DEFAULT_MESSAGES = {
  0: 'No se pudo conectar con el servidor. Revisa tu conexión.',
  401: 'Tu sesión no es válida o expiró. Vuelve a ingresar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No se encontró lo que buscabas.',
};

/**
 * @param {object} config
 * @param {string} config.baseUrl     URL base de la API (sin /api), p. ej. "https://api.ejemplo.com"
 * @param {string} config.apiKey      identificador de base de datos (encabezado x-api-key)
 * @param {() => string | null} config.getToken  devuelve el JWT de la sesión actual
 * @param {(error: ApiError) => void} [config.onUnauthorized]  se llama ante un 401
 * @param {typeof fetch} [config.fetchImpl]
 */
export function createApiClient({ baseUrl, apiKey, getToken, onUnauthorized, fetchImpl }) {
  const root = String(baseUrl ?? '').replace(/\/+$/, '');
  const doFetch = fetchImpl ?? ((...args) => fetch(...args));

  async function request(method, path, body) {
    const headers = { 'x-api-key': apiKey ?? '' };
    const token = getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let res;
    try {
      res = await doFetch(`${root}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, DEFAULT_MESSAGES[0]);
    }

    const text = res.status === 204 ? '' : await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      const message = (data && typeof data.error === 'string' && data.error) || DEFAULT_MESSAGES[res.status] || `Error inesperado (${res.status}).`;
      const error = new ApiError(res.status, message);
      if (res.status === 401 && path !== '/api/me/session') onUnauthorized?.(error);
      throw error;
    }
    return data;
  }

  const get = (p) => request('GET', p);
  const put = (p, b) => request('PUT', p, b ?? {});
  const post = (p, b) => request('POST', p, b ?? {});
  const patch = (p, b) => request('PATCH', p, b ?? {});
  const del = (p) => request('DELETE', p);
  const id = encodeURIComponent;

  return {
    // --- sesión (todos los roles) ---
    login: (email, password) => put('/api/me/session', { email, password }),
    logout: () => del('/api/me/session'),
    me: () => get('/api/me'),

    // --- jugadores ---
    getBoard: () => get('/api/board'),
    getMyInvitations: () => get('/api/me/invitations'),
    getInvitation: (invitationId) => get(`/api/invitations/${id(invitationId)}`),
    acceptInvitation: (invitationId) => post(`/api/invitations/${id(invitationId)}/accept`),
    rejectInvitation: (invitationId) => post(`/api/invitations/${id(invitationId)}/reject`),
    getMyMatches: () => get('/api/me/matches'),
    getMatch: (matchId) => get(`/api/matches/${id(matchId)}`),
    getMatchMoves: (matchId) => get(`/api/matches/${id(matchId)}/moves`),
    placeFleet: (matchId, fleetSetup) => post(`/api/matches/${id(matchId)}/moves`, { fleetSetup }),
    shoot: (matchId, shot) => post(`/api/matches/${id(matchId)}/moves`, { shot }),
    getMyTournaments: () => get('/api/me/tournaments'),
    getTournament: (tournamentId) => get(`/api/tournaments/${id(tournamentId)}`),
    getTournamentMatches: (tournamentId) => get(`/api/tournaments/${id(tournamentId)}/matches`),

    // --- organizadores ---
    invite: (invitedUser, tournament) => put('/api/invitations', { invitedUser, tournament }),
    deleteInvitation: (invitationId) => del(`/api/invitations/${id(invitationId)}`),
    deleteMatch: (matchId) => del(`/api/matches/${id(matchId)}`),
    endMatch: (matchId, winner) => post(`/api/matches/${id(matchId)}/end`, { winner }),
    createTournament: (name) => put('/api/tournaments', { name }),
    updateTournament: (tournamentId, changes) => patch(`/api/tournaments/${id(tournamentId)}`, changes),
    deleteTournament: (tournamentId) => del(`/api/tournaments/${id(tournamentId)}`),
    getTournamentInvitations: (tournamentId) => get(`/api/tournaments/${id(tournamentId)}/invitations`),
    createMatch: (tournamentId, playerNorth, playerSouth) =>
      put(`/api/tournaments/${id(tournamentId)}/matches`, { playerNorth, playerSouth }),
    getUsers: () => get('/api/users'),

    // --- admins ---
    createUser: (user) => put('/api/users', user),
    getUser: (userId) => get(`/api/users/${id(userId)}`),
    updateUser: (userId, changes) => patch(`/api/users/${id(userId)}`, changes),
    deleteUser: (userId) => del(`/api/users/${id(userId)}`),
  };
}
