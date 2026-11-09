/**
 * Reglas del juego de Batalla Naval, independientes de cualquier interfaz.
 *
 * Tipos (ver enunciado, sección 5):
 *  - Board:           { height, width, ships: { [nombre]: largo } }
 *  - BoardCoordinate: [columna, fila], ambas desde 0
 *  - FleetSetup:      { [nombre]: BoardCoordinate[] }
 *  - Shot:            [BoardCoordinate, 'water' | 'hit' | 'sunk']
 */

export const HORIZONTAL = 'horizontal';
export const VERTICAL = 'vertical';

/** Clave estable para usar coordenadas en objetos / Sets. */
export const coordKey = ([x, y]) => `${x},${y}`;

export const sameCoord = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Etiqueta de columna estilo planilla: A..Z, AA, AB... */
export function columnLabel(x) {
  let label = '';
  let n = x + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export const rowLabel = (y) => String(y + 1);

/** [0, 0] → "A1" */
export const coordLabel = ([x, y]) => columnLabel(x) + rowLabel(y);

export function isInside(board, [x, y]) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < board.width && y < board.height;
}

/** Casillas que ocupa un barco de `length` casillas que empieza en `origin`. */
export function shipCells(origin, length, orientation = HORIZONTAL) {
  const [x, y] = origin;
  return Array.from({ length }, (_, i) => (orientation === HORIZONTAL ? [x + i, y] : [x, y + i]));
}

/** Orientación de un barco ya ubicado (un barco de una casilla se toma como horizontal). */
export function shipOrientation(cells) {
  if (cells.length < 2) return HORIZONTAL;
  return cells[0][1] === cells[1][1] ? HORIZONTAL : VERTICAL;
}

/** Mapa "x,y" → nombre del barco que ocupa la casilla. */
export function occupancy(fleet) {
  const map = {};
  if (!fleet) return map;
  for (const [name, cells] of Object.entries(fleet)) {
    for (const c of cells) map[coordKey(c)] = name;
  }
  return map;
}

function isStraightAndContiguous(cells) {
  if (cells.length <= 1) return true;
  const horizontal = cells.every((c) => c[1] === cells[0][1]);
  const vertical = cells.every((c) => c[0] === cells[0][0]);
  if (!horizontal && !vertical) return false;
  const axis = horizontal ? 0 : 1;
  const values = cells.map((c) => c[axis]).sort((a, b) => a - b);
  return values.every((v, i) => i === 0 || v === values[i - 1] + 1);
}

const isCoordinate = (c) => Array.isArray(c) && c.length === 2 && c.every(Number.isInteger);

/**
 * Valida una ubicación de barcos según las reglas del enunciado.
 * @returns {string | null} mensaje de error o null si es válida.
 */
export function validateFleet(board, fleet) {
  if (!fleet || typeof fleet !== 'object' || Array.isArray(fleet)) return 'La flota no tiene un formato válido.';
  const expected = Object.keys(board.ships);
  const given = Object.keys(fleet);
  const missing = expected.filter((n) => !given.includes(n));
  if (missing.length) return `Faltan barcos: ${missing.join(', ')}.`;
  const extra = given.filter((n) => !expected.includes(n));
  if (extra.length) return `Barcos desconocidos: ${extra.join(', ')}.`;

  const used = new Set();
  for (const name of expected) {
    const cells = fleet[name];
    if (!Array.isArray(cells) || !cells.every(isCoordinate)) return `El barco ${name} no tiene coordenadas válidas.`;
    if (cells.length !== board.ships[name]) return `El barco ${name} debe ocupar ${board.ships[name]} casillas.`;
    if (!cells.every((c) => isInside(board, c))) return `El barco ${name} queda fuera del tablero.`;
    if (!isStraightAndContiguous(cells)) return `El barco ${name} debe estar en línea recta y sin huecos.`;
    for (const c of cells) {
      const k = coordKey(c);
      if (used.has(k)) return 'Los barcos no pueden superponerse.';
      used.add(k);
    }
  }
  return null;
}

/** ¿Se puede ubicar `cells` para el barco `name` sin salirse ni pisar otros barcos? */
export function canPlaceShip(board, fleet, name, cells) {
  if (!cells.every((c) => isInside(board, c))) return false;
  const occ = occupancy(fleet);
  return cells.every((c) => {
    const other = occ[coordKey(c)];
    return other === undefined || other === name;
  });
}

/** Ubicación aleatoria válida de toda la flota. */
export function randomFleet(board, random = Math.random) {
  const names = Object.keys(board.ships).sort((a, b) => board.ships[b] - board.ships[a]);
  for (let attempt = 0; attempt < 200; attempt++) {
    const fleet = {};
    const ok = names.every((name) => {
      for (let tries = 0; tries < 200; tries++) {
        const orientation = random() < 0.5 ? HORIZONTAL : VERTICAL;
        const origin = [Math.floor(random() * board.width), Math.floor(random() * board.height)];
        const cells = shipCells(origin, board.ships[name], orientation);
        if (canPlaceShip(board, fleet, name, cells)) {
          fleet[name] = cells;
          return true;
        }
      }
      return false;
    });
    if (ok) return fleet;
  }
  throw new Error('No se pudo ubicar la flota en el tablero.');
}

/**
 * Resultado de disparar a `target` sobre `fleet`, sabiendo los disparos previos.
 * @param {BoardCoordinate[]} previous coordenadas ya disparadas sobre esa flota
 */
export function evaluateShot(fleet, previous, target) {
  const name = occupancy(fleet)[coordKey(target)];
  if (name === undefined) return 'water';
  const hits = new Set([...previous, target].map(coordKey));
  return fleet[name].every((c) => hits.has(coordKey(c))) ? 'sunk' : 'hit';
}

/** Nombres de los barcos de `fleet` hundidos por `shots` (pares [coordenada, resultado]). */
export function sunkShipNames(fleet, shots) {
  if (!fleet) return [];
  const hits = new Set(shots.map(([c]) => coordKey(c)));
  return Object.keys(fleet).filter((n) => fleet[n].every((c) => hits.has(coordKey(c))));
}

export function countSunk(shots) {
  return shots.filter(([, r]) => r === 'sunk').length;
}

export function isFleetSunk(fleet, shots) {
  return sunkShipNames(fleet, shots).length === Object.keys(fleet).length;
}

/**
 * Cuando no conocemos la flota (tablero rival en una partida en curso), la API
 * solo marca como 'sunk' la casilla del disparo que hundió el barco. Para
 * mostrar el barco hundido completo, extendemos esa marca a los tocados
 * contiguos en línea recta. Es una aproximación: dos barcos tocados pegados
 * podrían verse como uno solo hasta que termine la partida.
 */
function inferSunkCells(results) {
  const out = { ...results };
  for (const [k, r] of Object.entries(results)) {
    if (r !== 'sunk') continue;
    const [x, y] = k.split(',').map(Number);
    const run = (dx, dy) => {
      const cells = [];
      for (let i = 1; results[`${x + dx * i},${y + dy * i}`] === 'hit'; i++) cells.push(`${x + dx * i},${y + dy * i}`);
      return cells;
    };
    const horizontal = [...run(1, 0), ...run(-1, 0)];
    const vertical = [...run(0, 1), ...run(0, -1)];
    const line = horizontal.length >= vertical.length ? horizontal : vertical;
    for (const c of line) out[c] = 'sunk';
  }
  return out;
}

/**
 * Modelo de un tablero listo para dibujar: filas de casillas con
 *  { x, y, ship: nombre | null, result: 'water' | 'hit' | 'sunk' | null }.
 *
 * @param {Board} board
 * @param {{ fleet?: FleetSetup | null, shots?: Shot[] }} options
 *   fleet: barcos que se conocen en este tablero (propios, o del rival al terminar)
 *   shots: disparos recibidos por este tablero
 */
export function boardModel(board, { fleet = null, shots = [] } = {}) {
  const occ = occupancy(fleet);
  let results = {};
  for (const [c, r] of shots) results[coordKey(c)] = r;

  if (fleet) {
    // Con la flota conocida marcamos como hundido el barco entero.
    for (const name of sunkShipNames(fleet, shots)) {
      for (const c of fleet[name]) results[coordKey(c)] = 'sunk';
    }
  } else {
    results = inferSunkCells(results);
  }

  return Array.from({ length: board.height }, (_, y) =>
    Array.from({ length: board.width }, (_, x) => {
      const k = `${x},${y}`;
      return { x, y, ship: occ[k] ?? null, result: results[k] ?? null };
    }),
  );
}
