/** Textos, roles y formatos compartidos por ambas interfaces. */

export const ROLES = ['player', 'organiser', 'admin'];

export const ROLE_LABELS = {
  player: 'Jugador',
  organiser: 'Organizador',
  admin: 'Admin',
};

export const ROLE_TONES = { player: '', organiser: 'ink', admin: 'acc' };

/** Jerarquía: admin ⊇ organizador ⊇ jugador. */
export function hasRole(role, required) {
  return ROLES.indexOf(role) >= ROLES.indexOf(required);
}

/** Nombres en español para las claves de barcos más habituales. */
const SHIP_NAMES = {
  carrier: 'Portaaviones',
  aircraftcarrier: 'Portaaviones',
  battleship: 'Acorazado',
  cruiser: 'Crucero',
  submarine: 'Submarino',
  destroyer: 'Destructor',
  patrolboat: 'Patrullero',
};

export function shipLabel(name) {
  const known = SHIP_NAMES[name.toLowerCase().replace(/[^a-z]/g, '')];
  if (known) return known;
  const spaced = name.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const SHOT_LABELS = { water: 'Agua', hit: 'Tocado', sunk: 'Hundido' };
export const SHOT_TONES = { water: '', hit: 'acc', sunk: 'ink' };

export function invitationState(invitation) {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.rejectedAt) return 'rejected';
  return 'pending';
}

export const INVITATION_LABELS = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada' };
export const INVITATION_TONES = { pending: '', accepted: 'ok', rejected: 'line' };

/** "18/11/2026" */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "hoy", "ayer", "hace 3 días" o la fecha. */
export function relativeDay(iso, now = new Date()) {
  if (!iso) return '';
  const d = new Date(iso);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return formatDate(iso);
}

/**
 * Nombre visible de un usuario. Los jugadores no pueden listar usuarios
 * (GET /api/users es solo para organizadores), así que cuando no conocemos
 * el correo mostramos un identificador corto.
 * @param {string} userId
 * @param {Record<string, {email: string}>} [directory] usuarios conocidos por id
 */
export function userLabel(userId, directory) {
  if (!userId) return '—';
  const email = directory?.[userId]?.email;
  if (email) return email;
  return `Jugador ${String(userId).slice(-4).toUpperCase()}`;
}

/** Parte local del correo, para textos cortos ("diego"). */
export function shortUserLabel(userId, directory) {
  const label = userLabel(userId, directory);
  return label.includes('@') ? label.split('@')[0] : label;
}

/** Correo del usuario si se conoce, o null. */
export const knownEmail = (userId, directory) => directory?.[userId]?.email ?? null;

/** Un torneo se considera finalizado cuando el organizador define al ganador. */
export const tournamentStatus = (tournament) =>
  tournament.winner ? { label: 'Finalizado', tone: 'ok' } : { label: 'En curso', tone: '' };
