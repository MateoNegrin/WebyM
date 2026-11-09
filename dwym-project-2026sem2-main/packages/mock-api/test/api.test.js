import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApiClient, randomFleet, shipCells } from '@batalla/core';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

beforeAll(async () => {
  server = createApp({ apiKeys: ['test'], withSeed: true }).listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server.close());

/** Cliente con su propia sesión. */
async function client(email, apiKey = 'test') {
  let token = null;
  const api = createApiClient({ baseUrl, apiKey, getToken: () => token });
  if (email) token = (await api.login(email, '123456')).token;
  return api;
}

describe('autenticación', () => {
  it('responde 404 sin x-api-key válida, antes que cualquier otro control', async () => {
    const api = await client(null, 'otra');
    await expect(api.login('admin@correo.uy', '123456')).rejects.toMatchObject({ status: 404 });
  });

  it('valida credenciales y exige token', async () => {
    const anon = await client(null);
    await expect(anon.login('admin@correo.uy', 'mal')).rejects.toMatchObject({ status: 400 });
    await expect(anon.me()).rejects.toMatchObject({ status: 401 });
    const admin = await client('admin@correo.uy');
    expect(await admin.me()).toMatchObject({ email: 'admin@correo.uy', role: 'admin' });
    expect(await admin.me()).not.toHaveProperty('password');
  });

  it('invalida el token al cerrar sesión', async () => {
    const api = await client('lucia@correo.uy');
    await api.logout();
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
  });

  it('responde 403 si el rol no alcanza', async () => {
    const lucia = await client('lucia@correo.uy');
    await expect(lucia.getUsers()).rejects.toMatchObject({ status: 403 });
  });
});

describe('flujo completo de un torneo', () => {
  it('crea torneo, invita, arma partida y se juega hasta hundir la flota', async () => {
    const admin = await client('admin@correo.uy');
    const north = await admin.createUser({ email: 'norte@correo.uy', password: '123456', role: 'player' });
    const south = await admin.createUser({ email: 'sur@correo.uy', password: '123456', role: 'player' });
    const org = await client('marta@correo.uy');
    const n = await client('norte@correo.uy');
    const s = await client('sur@correo.uy');

    const t = await org.createTournament('Copa Test');
    const invN = await org.invite(north.id, t.id);
    await expect(org.invite(north.id, t.id)).rejects.toThrow(/ya está invitado/);
    await org.invite(south.id, t.id);
    await expect(org.createMatch(t.id, north.id, south.id)).rejects.toThrow(/aceptado/);

    await n.acceptInvitation(invN.id);
    await expect(n.acceptInvitation(invN.id)).rejects.toMatchObject({ status: 400 });
    const [invS] = await s.getMyInvitations();
    await s.acceptInvitation(invS.id);
    expect((await n.getMyTournaments()).map((x) => x.id)).toEqual([t.id]);

    const match = await org.createMatch(t.id, north.id, south.id);
    const board = await n.getBoard();
    const target = {
      carrier: shipCells([0, 0], 5),
      battleship: shipCells([0, 1], 4),
      cruiser: shipCells([0, 2], 3),
      submarine: shipCells([0, 3], 3),
      destroyer: shipCells([0, 4], 2),
    };

    await expect(n.shoot(match.id, [0, 0])).rejects.toThrow(/ubicar/);
    await s.placeFleet(match.id, target);
    await expect(s.placeFleet(match.id, target)).rejects.toMatchObject({ status: 400 });
    const afterPlacing = await n.placeFleet(match.id, randomFleet(board));
    expect(afterPlacing.fleetSouth).toBeNull(); // la flota rival está oculta

    await expect(s.shoot(match.id, [0, 0])).rejects.toThrow(/turno/);
    await expect(org.getMatchMoves(match.id)).rejects.toMatchObject({ status: 400 });

    const southTargets = [];
    for (let y = 9; y >= 0; y--) for (let x = 9; x >= 0; x--) southTargets.push([x, y]);
    let current = afterPlacing;
    for (const cell of Object.values(target).flat()) {
      current = await n.shoot(match.id, cell);
      if (current.winner) break;
      await s.shoot(match.id, southTargets.shift());
    }
    expect(current.winner).toBe('north');
    expect(current.shotsNorth.at(-1)[1]).toBe('sunk');
    expect(current.fleetSouth).toEqual(target); // terminada: ambas flotas visibles
    await expect(n.shoot(match.id, [9, 9])).rejects.toThrow(/terminada/);

    const moves = await n.getMatchMoves(match.id);
    expect(moves).toHaveLength(2 + current.shotsNorth.length + current.shotsSouth.length);

    await expect(org.deleteInvitation(invN.id)).rejects.toThrow(/jugó/);
    await expect(admin.deleteUser(north.id)).rejects.toThrow(/participó/);
    await expect(org.updateTournament(t.id, { winner: south.id })).rejects.toMatchObject({ status: 400 });
    expect(await org.updateTournament(t.id, { winner: north.id })).toMatchObject({ winner: north.id });
  });

  it('oculta partidas ajenas con 404', async () => {
    const camila = await client('camila@correo.uy');
    const lucia = await client('lucia@correo.uy');
    const [foreign] = (await lucia.getMyMatches()).filter((m) => !m.winner);
    await expect(camila.getMatch(foreign.id)).rejects.toMatchObject({ status: 404 });
  });
});
