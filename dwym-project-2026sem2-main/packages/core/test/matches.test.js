import { describe, expect, it, vi } from 'vitest';
import { createApiClient, ApiError } from '../src/api.js';
import { matchPerspective, matchStatus, moveHistory, PHASE, shotLog } from '../src/matches.js';

const base = {
  id: 'm1',
  tournament: 't1',
  playerNorth: 'ana',
  playerSouth: 'beto',
  endedAt: null,
  winner: null,
  fleetNorth: null,
  fleetSouth: null,
  shotsNorth: [],
  shotsSouth: [],
};
const someFleet = { destroyer: [[0, 0], [1, 0]] };

describe('matchPerspective', () => {
  it('pide colocar la flota mientras no se ubicó', () => {
    expect(matchPerspective(base, 'ana').phase).toBe(PHASE.PLACE_FLEET);
    expect(matchStatus(base, 'beto')).toMatchObject({ label: 'Colocar flota', actionable: true });
  });

  it('norte dispara primero y luego se alternan los turnos', () => {
    const placed = { ...base, fleetNorth: someFleet };
    expect(matchPerspective(placed, 'ana').phase).toBe(PHASE.MY_TURN);
    expect(matchPerspective(placed, 'ana').rivalMaybePlacing).toBe(true);

    const afterNorth = { ...base, fleetSouth: someFleet, shotsNorth: [[[0, 0], 'hit']] };
    expect(matchPerspective(afterNorth, 'beto').phase).toBe(PHASE.MY_TURN);
    expect(matchStatus({ ...afterNorth, fleetNorth: someFleet, fleetSouth: null }, 'ana').label).toBe('Turno del rival');
  });

  it('informa victoria o derrota al terminar', () => {
    const ended = { ...base, endedAt: '2026-11-18T13:00:00.000Z', winner: 'south' };
    expect(matchStatus(ended, 'beto').label).toBe('Victoria');
    expect(matchStatus(ended, 'ana').label).toBe('Derrota');
  });

  it('devuelve un estado neutral para quien no juega', () => {
    expect(matchPerspective(base, 'org')).toBeNull();
    expect(matchStatus(base, 'org').label).toBe('Esperando flotas');
  });
});

describe('logs de jugadas', () => {
  const match = {
    ...base,
    shotsNorth: [[[0, 0], 'hit'], [[1, 0], 'sunk']],
    shotsSouth: [[[5, 5], 'water']],
  };

  it('intercala disparos de norte y sur', () => {
    expect(shotLog(match).map((l) => `${l.side}:${l.coord}:${l.result}`)).toEqual([
      'north:A1:hit',
      'south:F6:water',
      'north:B1:sunk',
    ]);
  });

  it('combina MatchMove[] con los resultados de los disparos', () => {
    const moves = [
      { index: 1, player: 'south', move: someFleet },
      { index: 0, player: 'north', move: someFleet },
      { index: 2, player: 'north', move: [0, 0] },
      { index: 3, player: 'south', move: [5, 5] },
      { index: 4, player: 'north', move: [1, 0] },
    ];
    expect(moveHistory(moves, match).map((m) => [m.n, m.kind, m.coord, m.result])).toEqual([
      [0, 'fleet', undefined, undefined],
      [1, 'fleet', undefined, undefined],
      [2, 'shot', 'A1', 'hit'],
      [3, 'shot', 'F6', 'water'],
      [4, 'shot', 'B1', 'sunk'],
    ]);
  });
});

describe('createApiClient', () => {
  const response = (status, body) => ({ ok: status < 400, status, text: async () => (body ? JSON.stringify(body) : '') });

  it('envía x-api-key, el token y el cuerpo JSON', async () => {
    const fetchImpl = vi.fn(async () => response(200, { id: 'm1' }));
    const api = createApiClient({ baseUrl: 'http://x/', apiKey: 'k', getToken: () => 'tok', fetchImpl });
    await api.shoot('m1', [1, 2]);
    expect(fetchImpl).toHaveBeenCalledWith('http://x/api/matches/m1/moves', {
      method: 'POST',
      headers: { 'x-api-key': 'k', Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: JSON.stringify({ shot: [1, 2] }),
    });
  });

  it('usa el mensaje { error } de los 400 y avisa los 401', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(400, { error: 'No es tu turno' }))
      .mockResolvedValueOnce(response(401));
    const api = createApiClient({ baseUrl: '', apiKey: 'k', getToken: () => null, onUnauthorized, fetchImpl });
    await expect(api.shoot('m1', [0, 0])).rejects.toThrow('No es tu turno');
    await expect(api.getMyMatches()).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
