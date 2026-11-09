/**
 * "Base de datos" en memoria del mock y las reglas de negocio de la API.
 * Cada x-api-key tiene su propia base, como en la API de la cátedra.
 */
import { randomUUID } from 'node:crypto';
import { evaluateShot, isFleetSunk, validateFleet } from '@batalla/core';

export const BOARD = {
  height: 10,
  width: 10,
  ships: { carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2 },
};

/** Error de negocio → HTTP 400 { error }. */
export class BadRequest extends Error {}

const now = () => new Date().toISOString();

function entity(fields) {
  return { id: randomUUID(), createdAt: now(), modifiedAt: null, ...fields };
}

function touch(record, changes) {
  Object.assign(record, changes, { modifiedAt: now() });
  return record;
}

export const withoutPassword = ({ password, ...user }) => user;

export function createStore() {
  const db = { users: [], tournaments: [], invitations: [], matches: [], moves: [], sessions: new Set() };
  const byId = (list, id) => db[list].find((r) => r.id === id) ?? null;

  const store = {
    db,
    findUser: (id) => byId('users', id),
    findTournament: (id) => byId('tournaments', id),
    findInvitation: (id) => byId('invitations', id),
    findMatch: (id) => byId('matches', id),

    // --- usuarios ---
    createUser({ email, password, role }) {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) throw new BadRequest('El correo electrónico no es válido.');
      if (typeof password !== 'string' || password.length === 0) throw new BadRequest('La contraseña no puede estar vacía.');
      if (!['player', 'organiser', 'admin'].includes(role)) throw new BadRequest('El rol no es válido.');
      const normalized = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === normalized)) throw new BadRequest('Ya existe un usuario con ese correo.');
      const user = entity({ email: normalized, password, role });
      db.users.push(user);
      return user;
    },
    updateUser(user, { password, role }) {
      const changes = {};
      if (password !== undefined) {
        if (typeof password !== 'string' || password.length === 0) throw new BadRequest('La contraseña no puede estar vacía.');
        changes.password = password;
      }
      if (role !== undefined) {
        if (!['player', 'organiser', 'admin'].includes(role)) throw new BadRequest('El rol no es válido.');
        changes.role = role;
      }
      return touch(user, changes);
    },
    deleteUser(user) {
      if (db.matches.some((m) => m.playerNorth === user.id || m.playerSouth === user.id)) {
        throw new BadRequest('No se puede quitar a un usuario que participó de alguna partida.');
      }
      db.users = db.users.filter((u) => u.id !== user.id);
      db.invitations = db.invitations.filter((i) => i.invitedUser !== user.id);
    },
    authenticate(email, password) {
      const user = db.users.find((u) => u.email === String(email ?? '').trim().toLowerCase());
      if (!user || user.password !== password) throw new BadRequest('Correo o contraseña no válidos.');
      return user;
    },

    // --- torneos ---
    createTournament(organiser, name) {
      if (typeof name !== 'string' || !name.trim()) throw new BadRequest('El torneo debe tener un nombre.');
      const t = entity({ name: name.trim(), organisedBy: organiser.id, winner: null });
      db.tournaments.push(t);
      return t;
    },
    updateTournament(t, { name, winner }) {
      const changes = {};
      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim()) throw new BadRequest('El torneo debe tener un nombre.');
        changes.name = name.trim();
      }
      if (winner !== undefined) {
        if (winner !== null && !store.tournamentMatchWinners(t.id).includes(winner)) {
          throw new BadRequest('El ganador del torneo debe haber ganado alguna partida del torneo.');
        }
        changes.winner = winner;
      }
      return touch(t, changes);
    },
    deleteTournament(t) {
      const matchIds = db.matches.filter((m) => m.tournament === t.id).map((m) => m.id);
      db.moves = db.moves.filter((mv) => !matchIds.includes(mv.match));
      db.matches = db.matches.filter((m) => m.tournament !== t.id);
      db.invitations = db.invitations.filter((i) => i.tournament !== t.id);
      db.tournaments = db.tournaments.filter((x) => x.id !== t.id);
    },
    tournamentMatchWinners(tournamentId) {
      return db.matches
        .filter((m) => m.tournament === tournamentId && m.winner)
        .map((m) => (m.winner === 'north' ? m.playerNorth : m.playerSouth));
    },
    isParticipant(userId, tournamentId) {
      return db.invitations.some((i) => i.tournament === tournamentId && i.invitedUser === userId);
    },
    acceptedUsers(tournamentId) {
      return db.invitations.filter((i) => i.tournament === tournamentId && i.acceptedAt).map((i) => i.invitedUser);
    },

    // --- invitaciones ---
    invite(organiser, invitedUser, tournament) {
      const t = store.findTournament(tournament);
      if (!t) throw new BadRequest('El torneo no existe.');
      if (!store.findUser(invitedUser)) throw new BadRequest('El usuario no existe.');
      if (invitedUser === t.organisedBy) throw new BadRequest('No se puede invitar al organizador a su propio torneo.');
      const existing = db.invitations.find((i) => i.tournament === tournament && i.invitedUser === invitedUser && !i.rejectedAt);
      if (existing) throw new BadRequest('Ese usuario ya está invitado al torneo.');
      const inv = entity({ invitedUser, invitingUser: organiser.id, tournament, acceptedAt: null, rejectedAt: null });
      db.invitations.push(inv);
      return inv;
    },
    respondInvitation(inv, accept) {
      if (inv.acceptedAt || inv.rejectedAt) throw new BadRequest('La invitación ya fue respondida.');
      return touch(inv, accept ? { acceptedAt: now() } : { rejectedAt: now() });
    },
    deleteInvitation(inv) {
      const played = db.matches.some(
        (m) => m.tournament === inv.tournament && (m.playerNorth === inv.invitedUser || m.playerSouth === inv.invitedUser),
      );
      if (played) throw new BadRequest('No se puede revocar la invitación de un jugador que ya jugó partidas del torneo.');
      db.invitations = db.invitations.filter((i) => i.id !== inv.id);
    },

    // --- partidas ---
    createMatch(t, { playerNorth, playerSouth }) {
      if (!playerNorth || !playerSouth) throw new BadRequest('Hay que elegir ambos jugadores.');
      if (playerNorth === playerSouth) throw new BadRequest('Un mismo usuario no puede jugar en ambos lados.');
      const accepted = store.acceptedUsers(t.id);
      if (!accepted.includes(playerNorth) || !accepted.includes(playerSouth)) {
        throw new BadRequest('Ambos jugadores deben haber aceptado la invitación al torneo.');
      }
      const m = entity({
        tournament: t.id,
        playerNorth,
        playerSouth,
        endedAt: null,
        winner: null,
        fleetNorth: null,
        fleetSouth: null,
        shotsNorth: [],
        shotsSouth: [],
      });
      db.matches.push(m);
      return m;
    },
    deleteMatch(m) {
      db.moves = db.moves.filter((mv) => mv.match !== m.id);
      db.matches = db.matches.filter((x) => x.id !== m.id);
    },
    endMatch(m, winner) {
      if (winner !== 'north' && winner !== 'south') throw new BadRequest('El ganador debe ser uno de los participantes.');
      if (m.winner) throw new BadRequest('La partida ya está terminada.');
      return touch(m, { winner, endedAt: now() });
    },
    movesOf(m) {
      if (!m.winner) throw new BadRequest('El historial solo está disponible cuando la partida terminó.');
      return db.moves.filter((mv) => mv.match === m.id).sort((a, b) => a.index - b.index);
    },
    play(m, side, body) {
      if (m.winner) throw new BadRequest('La partida está terminada.');
      const fleetKey = side === 'north' ? 'fleetNorth' : 'fleetSouth';
      const rivalFleetKey = side === 'north' ? 'fleetSouth' : 'fleetNorth';
      const shotsKey = side === 'north' ? 'shotsNorth' : 'shotsSouth';
      const recordMove = (move) =>
        db.moves.push(entity({ match: m.id, index: db.moves.filter((mv) => mv.match === m.id).length, player: side, move }));

      if (body && body.fleetSetup !== undefined) {
        if (m[fleetKey]) throw new BadRequest('Ya ubicaste tus barcos en esta partida.');
        const error = validateFleet(BOARD, body.fleetSetup);
        if (error) throw new BadRequest(error);
        recordMove(body.fleetSetup);
        return touch(m, { [fleetKey]: body.fleetSetup });
      }

      if (body && body.shot !== undefined) {
        if (!m.fleetNorth || !m.fleetSouth) throw new BadRequest('Ambos jugadores deben ubicar sus barcos antes de disparar.');
        const turn = m.shotsNorth.length <= m.shotsSouth.length ? 'north' : 'south';
        if (turn !== side) throw new BadRequest('No es tu turno.');
        const shot = body.shot;
        const valid = Array.isArray(shot) && shot.length === 2 && shot.every(Number.isInteger);
        if (!valid || shot[0] < 0 || shot[1] < 0 || shot[0] >= BOARD.width || shot[1] >= BOARD.height) {
          throw new BadRequest('El disparo está fuera del tablero.');
        }
        const previous = m[shotsKey].map(([c]) => c);
        if (previous.some((c) => c[0] === shot[0] && c[1] === shot[1])) throw new BadRequest('Ya disparaste a esa casilla.');
        const rivalFleet = m[rivalFleetKey];
        const result = evaluateShot(rivalFleet, previous, shot);
        recordMove(shot);
        const shots = [...m[shotsKey], [shot, result]];
        const changes = { [shotsKey]: shots };
        if (isFleetSunk(rivalFleet, shots)) Object.assign(changes, { winner: side, endedAt: now() });
        return touch(m, changes);
      }

      throw new BadRequest('La jugada debe ser { fleetSetup } o { shot }.');
    },
  };
  return store;
}
