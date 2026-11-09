/**
 * Datos de ejemplo. Se generan usando las mismas reglas del store, así que
 * siempre son consistentes (flotas válidas, turnos alternados, etc.).
 *
 * Contraseña de todos los usuarios: "123456"
 */
import { randomFleet, shipCells, VERTICAL } from '@batalla/core';
import { BOARD } from './store.js';

/** Generador pseudoaleatorio determinístico, para que el seed sea reproducible. */
function seededRandom(seedValue) {
  let s = seedValue;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FLEET_A = {
  carrier: shipCells([1, 1], 5),
  battleship: shipCells([8, 2], 4, VERTICAL),
  cruiser: shipCells([2, 4], 3, VERTICAL),
  submarine: shipCells([4, 7], 3),
  destroyer: shipCells([0, 9], 2),
};

export function seed(store) {
  const random = seededRandom(42);
  const password = '123456';
  const u = {};
  for (const [name, role] of [
    ['admin', 'admin'],
    ['mauro', 'organiser'],
    ['marta', 'organiser'],
    ['lucia', 'player'],
    ['diego', 'player'],
    ['sofia', 'player'],
    ['camila', 'player'],
    ['mateo', 'player'],
    ['ana', 'player'],
    ['nicolas', 'player'],
  ]) {
    u[name] = store.createUser({ email: `${name}@correo.uy`, password, role });
  }

  const tournament = (organiser, name, players) => {
    const t = store.createTournament(organiser, name);
    const invitations = Object.fromEntries(players.map((p) => [p, store.invite(organiser, u[p].id, t.id)]));
    return { t, invitations };
  };
  const accept = (inv) => store.respondInvitation(inv, true);

  // Copa Almirante (mauro): lucia, diego, sofia y mateo aceptaron; camila pendiente; ana rechazó.
  const copa = tournament(u.mauro, 'Copa Almirante', ['lucia', 'diego', 'sofia', 'mateo', 'camila', 'ana']);
  ['lucia', 'diego', 'sofia', 'mateo'].forEach((p) => accept(copa.invitations[p]));
  store.respondInvitation(copa.invitations.ana, false);

  // Liga del Puerto (mauro): lucia, camila y nicolas aceptaron.
  const liga = tournament(u.mauro, 'Liga del Puerto', ['lucia', 'camila', 'nicolas']);
  ['lucia', 'camila', 'nicolas'].forEach((p) => accept(liga.invitations[p]));

  // Torneo de Primavera (marta): invitación pendiente para lucia.
  const primavera = tournament(u.marta, 'Torneo de Primavera', ['lucia', 'ana', 'sofia']);
  accept(primavera.invitations.ana);
  accept(primavera.invitations.sofia);

  const match = (t, north, south) => store.createMatch(t, { playerNorth: u[north].id, playerSouth: u[south].id });
  const place = (m, side, fleet = randomFleet(BOARD, random)) => store.play(m, side, { fleetSetup: fleet });
  const allCells = [];
  for (let y = 0; y < BOARD.height; y++) for (let x = 0; x < BOARD.width; x++) allCells.push([x, y]);
  const shuffled = () => [...allCells].sort(() => random() - 0.5);
  /**
   * Juega `turns` disparos alternados (o hasta que termine la partida).
   * `sharpshooter` apunta casi siempre a barcos, para decidir quién gana.
   */
  const playShots = (m, turns, sharpshooter = null) => {
    const targets = { north: shuffled(), south: shuffled() };
    if (sharpshooter) {
      const rivalFleet = sharpshooter === 'north' ? m.fleetSouth : m.fleetNorth;
      const ships = new Set(Object.values(rivalFleet).flat().map((c) => c.join()));
      const hits = targets[sharpshooter].filter((c) => ships.has(c.join()));
      const misses = targets[sharpshooter].filter((c) => !ships.has(c.join()));
      // Orden de tiro: tres disparos al agua y luego los barcos, con algún fallo intercalado.
      const order = misses.splice(-3);
      hits.forEach((c, i) => order.push(c, ...(i % 4 === 3 ? misses.splice(-1) : [])));
      targets[sharpshooter] = [...misses, ...order.reverse()]; // se consumen con pop()
    }
    for (let i = 0; i < turns && !m.winner; i++) {
      const side = m.shotsNorth.length <= m.shotsSouth.length ? 'north' : 'south';
      store.play(m, side, { shot: targets[side].pop() });
    }
  };

  // lucia vs diego: en curso, le toca a lucia.
  const m1 = match(copa.t, 'lucia', 'diego');
  place(m1, 'north', FLEET_A);
  place(m1, 'south');
  playShots(m1, 16);

  // sofia vs lucia: lucia (sur) espera que sofia ubique su flota.
  const m2 = match(copa.t, 'sofia', 'lucia');
  place(m2, 'south');

  // mateo vs lucia: terminada, lucia gana hundiendo todo.
  const m3 = match(copa.t, 'mateo', 'lucia');
  place(m3, 'north');
  place(m3, 'south', FLEET_A);
  playShots(m3, 400, 'south');

  // sofia vs diego: en curso, entre otros jugadores.
  const m4 = match(copa.t, 'sofia', 'diego');
  place(m4, 'north');
  place(m4, 'south');
  playShots(m4, 9);

  // lucia vs camila: nadie ubicó la flota todavía.
  match(liga.t, 'lucia', 'camila');
  // nicolas vs lucia: terminada por el organizador (abandono de lucia).
  const m6 = match(liga.t, 'nicolas', 'lucia');
  place(m6, 'north');
  place(m6, 'south');
  playShots(m6, 6);
  store.endMatch(m6, 'north');

  // ana vs sofia en Primavera, terminada; sofia ganó el torneo.
  const m7 = match(primavera.t, 'ana', 'sofia');
  place(m7, 'north');
  place(m7, 'south');
  playShots(m7, 400, 'south');
  store.updateTournament(primavera.t, { winner: u.sofia.id });
}
