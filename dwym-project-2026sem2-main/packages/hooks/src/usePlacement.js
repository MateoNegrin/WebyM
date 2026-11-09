import { useCallback, useMemo, useState } from 'react';
import {
  canPlaceShip,
  coordKey,
  HORIZONTAL,
  occupancy,
  randomFleet,
  shipCells,
  shipOrientation,
  VERTICAL,
} from '@batalla/core';

/**
 * Estado de la ubicación de barcos (primer movimiento de la partida).
 *
 * Interacción:
 *  - se elige un barco (o queda elegido el siguiente sin ubicar),
 *  - tocar una casilla lo ubica empezando ahí con la orientación actual,
 *  - tocar un barco ya ubicado lo selecciona para moverlo,
 *  - "Rotar" cambia la orientación (y gira el barco si ya estaba ubicado).
 */
export function usePlacement(board) {
  const names = useMemo(() => (board ? Object.keys(board.ships) : []), [board]);
  const [fleet, setFleet] = useState({});
  const [selected, setSelected] = useState(null);
  const [orientation, setOrientation] = useState(HORIZONTAL);

  const firstUnplaced = (f, except) => names.find((n) => !f[n] && n !== except) ?? null;
  const current = selected ?? firstUnplaced(fleet);
  const occ = useMemo(() => occupancy(fleet), [fleet]);

  /** Casillas que ocuparía el barco elegido si empieza en `origin`, y si es válido. */
  const preview = useCallback(
    (origin) => {
      if (!board || !current || !origin) return null;
      const cells = shipCells(origin, board.ships[current], orientation);
      return { cells, valid: canPlaceShip(board, fleet, current, cells) };
    },
    [board, current, orientation, fleet],
  );

  const select = useCallback(
    (name) => {
      setSelected(name);
      if (fleet[name]) setOrientation(shipOrientation(fleet[name]));
    },
    [fleet],
  );

  /** Acción al tocar la casilla `coord`. Devuelve false si no se pudo ubicar. */
  const tap = useCallback(
    (coord) => {
      const onShip = occ[coordKey(coord)];
      if (onShip && onShip !== current) {
        select(onShip);
        return true;
      }
      const p = preview(coord);
      if (!p?.valid) return false;
      const next = { ...fleet, [current]: p.cells };
      setFleet(next);
      setSelected(firstUnplaced(next));
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occ, current, preview, fleet, select],
  );

  const rotate = useCallback(() => {
    const nextOrientation = orientation === HORIZONTAL ? VERTICAL : HORIZONTAL;
    setOrientation(nextOrientation);
    const placed = current && fleet[current];
    if (placed) {
      const cells = shipCells(placed[0], board.ships[current], nextOrientation);
      if (canPlaceShip(board, fleet, current, cells)) setFleet({ ...fleet, [current]: cells });
    }
  }, [orientation, current, fleet, board]);

  const remove = useCallback(
    (name) => {
      const { [name]: _removed, ...rest } = fleet;
      setFleet(rest);
      setSelected(name);
    },
    [fleet],
  );

  const randomize = useCallback(() => {
    setFleet(randomFleet(board));
    setSelected(null);
  }, [board]);

  const clear = useCallback(() => {
    setFleet({});
    setSelected(null);
  }, []);

  const placedCount = names.filter((n) => fleet[n]).length;
  return {
    names,
    fleet,
    selected: current,
    orientation,
    placedCount,
    total: names.length,
    complete: names.length > 0 && placedCount === names.length,
    preview,
    select,
    tap,
    rotate,
    remove,
    randomize,
    clear,
  };
}
