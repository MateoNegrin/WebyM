import { useMemo } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { hasRole, isMatchEnded } from '@batalla/core';
import { useSession } from './session.js';

/** Cada cuánto se consulta una partida abierta (la API no notifica jugadas). */
export const MATCH_POLL_MS = 3_000;

export const keys = {
  board: ['board'],
  myInvitations: ['me', 'invitations'],
  myMatches: ['me', 'matches'],
  myTournaments: ['me', 'tournaments'],
  tournament: (id) => ['tournament', id],
  tournamentMatches: (id) => ['tournament', id, 'matches'],
  tournamentInvitations: (id) => ['tournament', id, 'invitations'],
  match: (id) => ['match', id],
  matchMoves: (id) => ['match', id, 'moves'],
  users: ['users'],
  user: (id) => ['user', id],
};

function useApiQuery(key, fn, options = {}) {
  const { api, session } = useSession();
  return useQuery({ queryKey: key, queryFn: () => fn(api), enabled: Boolean(session) && options.enabled !== false, ...options });
}

// --- consultas ---

/** El tablero casi nunca cambia: se pide una vez por sesión. */
export const useBoard = () => useApiQuery(keys.board, (api) => api.getBoard(), { staleTime: Infinity });
export const useMyInvitations = () => useApiQuery(keys.myInvitations, (api) => api.getMyInvitations());
export const useMyMatches = () => useApiQuery(keys.myMatches, (api) => api.getMyMatches());
export const useMyTournaments = () => useApiQuery(keys.myTournaments, (api) => api.getMyTournaments());
export const useTournament = (id) => useApiQuery(keys.tournament(id), (api) => api.getTournament(id), { enabled: Boolean(id) });
export const useTournamentMatches = (id) =>
  useApiQuery(keys.tournamentMatches(id), (api) => api.getTournamentMatches(id), { enabled: Boolean(id) });
export const useTournamentInvitations = (id) =>
  useApiQuery(keys.tournamentInvitations(id), (api) => api.getTournamentInvitations(id), { enabled: Boolean(id) });
export const useUser = (id) => useApiQuery(keys.user(id), (api) => api.getUser(id), { enabled: Boolean(id) });

/**
 * Partida con polling cada MATCH_POLL_MS mientras no haya terminado.
 * El polling se detiene solo al desmontar la pantalla (react-query).
 */
export const useMatch = (id) =>
  useApiQuery(keys.match(id), (api) => api.getMatch(id), {
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data && isMatchEnded(query.state.data) ? false : MATCH_POLL_MS),
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

/** Historial de jugadas: solo disponible cuando la partida terminó. */
export const useMatchMoves = (id, enabled) =>
  useApiQuery(keys.matchMoves(id), (api) => api.getMatchMoves(id), { enabled: Boolean(id) && enabled, staleTime: Infinity });

/**
 * Varios torneos por id (p. ej. para mostrar el nombre de cada partida).
 * Devuelve un mapa id → Tournament con los que se pudieron obtener.
 */
export function useTournamentsById(ids) {
  const { api, session } = useSession();
  const unique = useMemo(() => [...new Set(ids.filter(Boolean))].sort(), [ids]);
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: keys.tournament(id),
      queryFn: () => api.getTournament(id),
      enabled: Boolean(session),
    })),
  });
  const dataKey = results.map((r) => r.dataUpdatedAt).join();
  return useMemo(() => {
    const map = {};
    results.forEach((r) => {
      if (r.data) map[r.data.id] = r.data;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);
}

/** Lista de usuarios: solo para organizadores y admins (GET /api/users). */
export function useUsers() {
  const { session } = useSession();
  return useApiQuery(keys.users, (api) => api.getUsers(), { enabled: Boolean(session) && hasRole(session.role, 'organiser') });
}

/**
 * Directorio id → usuario para mostrar correos en vez de ids. Los jugadores
 * no pueden listar usuarios, así que para ellos solo se conoce su propio correo.
 */
export function useUserDirectory() {
  const { session } = useSession();
  const { data: users } = useUsers();
  return useMemo(() => {
    const dir = {};
    (users ?? []).forEach((u) => {
      dir[u.id] = u;
    });
    if (session) dir[session.userId] = { id: session.userId, email: session.email, role: session.role };
    return dir;
  }, [users, session]);
}

// --- mutaciones ---

/**
 * Mutación contra la API que invalida las consultas indicadas al terminar bien.
 * @param {(api: object, variables: any) => Promise<any>} fn
 * @param {{ invalidate?: (vars: any, data: any) => unknown[][], onSuccess?: Function }} [options]
 */
export function useApiMutation(fn, { invalidate, onSuccess } = {}) {
  const { api } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => fn(api, variables),
    onSuccess: async (data, variables) => {
      await onSuccess?.(data, variables, queryClient);
      await Promise.all((invalidate?.(variables, data) ?? []).map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export const useRespondInvitation = () =>
  useApiMutation((api, { id, accept }) => (accept ? api.acceptInvitation(id) : api.rejectInvitation(id)), {
    invalidate: () => [keys.myInvitations, keys.myTournaments],
  });

/** Guarda en caché el Match que devuelve la API tras una jugada. */
const storeMatch = (match, _vars, queryClient) => queryClient.setQueryData(keys.match(match.id), match);

export const usePlaceFleet = (matchId) =>
  useApiMutation((api, fleet) => api.placeFleet(matchId, fleet), { onSuccess: storeMatch, invalidate: () => [keys.myMatches] });

export const useShoot = (matchId) =>
  useApiMutation((api, coord) => api.shoot(matchId, coord), { onSuccess: storeMatch, invalidate: () => [keys.myMatches] });
