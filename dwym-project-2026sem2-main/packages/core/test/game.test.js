import { describe, expect, it } from 'vitest';
import {
  boardModel,
  canPlaceShip,
  columnLabel,
  coordLabel,
  evaluateShot,
  randomFleet,
  shipCells,
  validateFleet,
  VERTICAL,
} from '../src/game.js';

const board = { width: 10, height: 10, ships: { carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2 } };

const fleet = {
  carrier: shipCells([0, 0], 5),
  battleship: shipCells([0, 1], 4),
  cruiser: shipCells([9, 0], 3, VERTICAL),
  submarine: shipCells([5, 5], 3),
  destroyer: shipCells([0, 9], 2),
};

describe('etiquetas de coordenadas', () => {
  it('usa letras para columnas y números desde 1 para filas', () => {
    expect(coordLabel([0, 0])).toBe('A1');
    expect(coordLabel([9, 9])).toBe('J10');
    expect(columnLabel(26)).toBe('AA');
  });
});

describe('validateFleet', () => {
  it('acepta una flota válida, con barcos adyacentes', () => {
    expect(validateFleet(board, fleet)).toBeNull();
  });

  it('rechaza barcos faltantes o desconocidos', () => {
    const { destroyer, ...rest } = fleet;
    expect(validateFleet(board, rest)).toMatch(/Faltan/);
    expect(validateFleet(board, { ...fleet, yacht: [[3, 3]] })).toMatch(/desconocidos/);
  });

  it('rechaza largo incorrecto, fuera del tablero, diagonales y huecos', () => {
    expect(validateFleet(board, { ...fleet, destroyer: [[0, 9]] })).toMatch(/2 casillas/);
    expect(validateFleet(board, { ...fleet, destroyer: [[9, 9], [10, 9]] })).toMatch(/fuera/);
    expect(validateFleet(board, { ...fleet, destroyer: [[3, 3], [4, 4]] })).toMatch(/línea recta/);
    expect(validateFleet(board, { ...fleet, cruiser: [[9, 0], [9, 1], [9, 3]] })).toMatch(/línea recta/);
  });

  it('rechaza superposiciones', () => {
    expect(validateFleet(board, { ...fleet, destroyer: [[0, 0], [0, 1]] })).toMatch(/superponerse/);
  });
});

describe('canPlaceShip / randomFleet', () => {
  it('impide pisar otro barco pero permite reubicar el mismo', () => {
    expect(canPlaceShip(board, fleet, 'destroyer', [[0, 0], [1, 0]])).toBe(false);
    expect(canPlaceShip(board, fleet, 'carrier', shipCells([1, 0], 5))).toBe(true);
  });

  it('genera siempre flotas válidas', () => {
    for (let i = 0; i < 50; i++) expect(validateFleet(board, randomFleet(board))).toBeNull();
  });
});

describe('evaluateShot', () => {
  it('distingue agua, tocado y hundido', () => {
    expect(evaluateShot(fleet, [], [4, 4])).toBe('water');
    expect(evaluateShot(fleet, [], [0, 9])).toBe('hit');
    expect(evaluateShot(fleet, [[0, 9]], [1, 9])).toBe('sunk');
  });
});

describe('boardModel', () => {
  it('marca el barco hundido completo cuando la flota es conocida', () => {
    const rows = boardModel(board, { fleet, shots: [[[0, 9], 'hit'], [[1, 9], 'sunk']] });
    expect(rows[9][0]).toMatchObject({ ship: 'destroyer', result: 'sunk' });
    expect(rows[9][1]).toMatchObject({ ship: 'destroyer', result: 'sunk' });
  });

  it('infiere el barco hundido en el tablero rival desconocido', () => {
    const shots = [[[2, 3], 'hit'], [[3, 3], 'hit'], [[4, 3], 'sunk'], [[6, 3], 'hit']];
    const rows = boardModel(board, { shots });
    expect(rows[3].slice(2, 5).map((c) => c.result)).toEqual(['sunk', 'sunk', 'sunk']);
    expect(rows[3][6].result).toBe('hit');
    expect(rows[3][2].ship).toBeNull();
  });
});
