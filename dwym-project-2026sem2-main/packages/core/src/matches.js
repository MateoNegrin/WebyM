/**
 * Derivación del estado de una partida desde el punto de vista de un usuario.
 * La API devuelve el Match "crudo"; aquí calculamos a quién le toca, qué
 * flota es la propia, el log de disparos, etc.
 */

import { coordLabel } from './game.js';

export const NORTH = 'north';
export const SOUTH = 'south';

export const otherSide = (side) => (side === NORTH ? SOUTH : NORTH);

export const isMatchEnded = (match) => match.endedAt != null || match.winner != null;

/** 'north' | 'south' | null si el usuario no juega la partida. */
export function sideOf(match, userId) {
  if (match.playerNorth === userId) return NORTH;
  if (match.playerSouth === userId) return SOUTH;
  return null;
}

export const playerIdOf = (match, side) => (side === NORTH ? match.playerNorth : match.playerSouth);
export const fleetOf = (match, side) => (side === NORTH ? match.fleetNorth : match.fleetSouth);
/** Disparos HECHOS por `side`. */
export const shotsBy = (match, side) => (side === NORTH ? match.shotsNorth : match.shotsSouth) ?? [];

/**
 * Lado que dispara a continuación, asumiendo ambas flotas ubicadas.
 * Norte siempre dispara primero y luego se alternan los turnos.
 */
export function nextShooter(match) {
  return shotsBy(match, NORTH).length <= shotsBy(match, SOUTH).length ? NORTH : SOUTH;
}

export const PHASE = {
  PLACE_FLEET: 'place-fleet',
  MY_TURN: 'my-turn',
  RIVAL_TURN: 'rival-turn',
  ENDED: 'ended',
};

/**
 * Vista de la partida para `userId`.
 *
 * Nota: mientras la partida está en curso la API devuelve `null` como flota
 * del rival, así que no podemos saber con certeza si ya ubicó sus barcos.
 * Solo lo sabemos cuando hay algún disparo. `rivalMaybePlacing` marca ese caso.
 */
export function matchPerspective(match, userId) {
  const side = sideOf(match, userId);
  if (!side) return null;
  const rivalSide = otherSide(side);
  const ended = isMatchEnded(match);
  const myFleet = fleetOf(match, side);
  const rivalFleet = fleetOf(match, rivalSide);
  const myShots = shotsBy(match, side);
  const rivalShots = shotsBy(match, rivalSide);
  const anyShot = myShots.length + rivalShots.length > 0;

  let phase;
  if (ended) phase = PHASE.ENDED;
  else if (!myFleet) phase = PHASE.PLACE_FLEET;
  else phase = nextShooter(match) === side ? PHASE.MY_TURN : PHASE.RIVAL_TURN;

  return {
    side,
    rivalSide,
    myId: userId,
    rivalId: playerIdOf(match, rivalSide),
    myFleet,
    rivalFleet,
    myShots,
    rivalShots,
    ended,
    won: ended && match.winner === side,
    phase,
    rivalMaybePlacing: !ended && !anyShot && !rivalFleet,
  };
}

/**
 * Estado resumido para listados. `tone` es la variante visual del chip
 * ('acc' resalta lo que requiere acción del usuario).
 */
export function matchStatus(match, userId) {
  const p = matchPerspective(match, userId);
  if (!p) return neutralMatchStatus(match);
  switch (p.phase) {
    case PHASE.ENDED:
      return p.won
        ? { label: 'Victoria', tone: 'ok', actionable: false, action: 'Ver resultado' }
        : { label: 'Derrota', tone: 'ink', actionable: false, action: 'Ver resultado' };
    case PHASE.PLACE_FLEET:
      return { label: 'Colocar flota', tone: 'acc', actionable: true, action: 'Colocar' };
    case PHASE.MY_TURN:
      return { label: 'Tu turno', tone: 'acc', actionable: true, action: 'Jugar' };
    default:
      return {
        label: p.rivalMaybePlacing ? 'Esperando al rival' : 'Turno del rival',
        tone: '',
        actionable: false,
        action: 'Abrir',
      };
  }
}

/** Estado para quien mira una partida en la que no juega (p. ej. el organizador). */
export function neutralMatchStatus(match) {
  if (isMatchEnded(match)) return { label: 'Terminada', tone: 'ink', actionable: false, action: null };
  const shots = shotsBy(match, NORTH).length + shotsBy(match, SOUTH).length;
  if (shots === 0) return { label: 'Esperando flotas', tone: '', actionable: false, action: null };
  return { label: 'En curso', tone: '', actionable: false, action: null };
}

/** Breve detalle textual de la partida para el listado. */
export function matchDetail(match, userId, board) {
  const p = matchPerspective(match, userId);
  if (!p) return '';
  if (p.ended) {
    const total = p.myShots.length + p.rivalShots.length;
    return board && !endedBySinking(match, board) ? 'Terminada por el organizador' : `Terminada · ${total} disparos`;
  }
  if (!p.myFleet) return 'Aún no ubicaste tus barcos';
  if (p.myShots.length + p.rivalShots.length === 0) return 'Tu flota ya está lista';
  return `${p.myShots.length} disparos tuyos · ${p.rivalShots.length} del rival`;
}

/** ¿La partida terminó porque una flota fue hundida por completo? */
export function endedBySinking(match, board) {
  if (!isMatchEnded(match) || !match.winner) return false;
  const shipCount = Object.keys(board.ships).length;
  return shotsBy(match, match.winner).filter(([, r]) => r === 'sunk').length >= shipCount;
}

/**
 * Log de disparos de una partida en curso, a partir de shotsNorth/shotsSouth.
 * Norte dispara primero, así que el orden es N0, S0, N1, S1...
 * @returns {{ n: number, side: string, coord: string, result: string }[]}
 */
export function shotLog(match) {
  const north = shotsBy(match, NORTH);
  const south = shotsBy(match, SOUTH);
  const log = [];
  for (let i = 0; i < Math.max(north.length, south.length); i++) {
    if (north[i]) log.push({ n: log.length + 1, side: NORTH, coord: coordLabel(north[i][0]), result: north[i][1] });
    if (south[i]) log.push({ n: log.length + 1, side: SOUTH, coord: coordLabel(south[i][0]), result: south[i][1] });
  }
  return log;
}

const isShotMove = (move) => Array.isArray(move) && move.length === 2 && move.every(Number.isInteger);

/**
 * Historial completo de una partida terminada, a partir de MatchMove[].
 * Los MatchMove no incluyen el resultado del disparo: lo tomamos de
 * shotsNorth/shotsSouth, que están en el mismo orden.
 * @returns {{ n: number, side: string, kind: 'fleet' | 'shot', coord?: string, result?: string }[]}
 */
export function moveHistory(moves, match) {
  const counters = { [NORTH]: 0, [SOUTH]: 0 };
  return [...moves]
    .sort((a, b) => a.index - b.index)
    .map((m) => {
      if (!isShotMove(m.move)) return { n: m.index, side: m.player, kind: 'fleet' };
      const shot = shotsBy(match, m.player)[counters[m.player]++];
      return { n: m.index, side: m.player, kind: 'shot', coord: coordLabel(m.move), result: shot?.[1] ?? null };
    });
}

/** Ordena partidas: primero las que requieren acción, luego en curso, luego terminadas. */
export function sortMatchesForUser(matches, userId) {
  const rank = (m) => {
    const s = matchStatus(m, userId);
    if (s.actionable) return 0;
    return isMatchEnded(m) ? 2 : 1;
  };
  return [...matches].sort((a, b) => rank(a) - rank(b) || String(b.createdAt).localeCompare(String(a.createdAt)));
}
