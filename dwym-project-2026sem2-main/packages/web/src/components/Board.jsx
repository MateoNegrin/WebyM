import { columnLabel, coordLabel, rowLabel, SHOT_LABELS } from '@batalla/core';

/**
 * Tablero con etiquetas de filas y columnas. Funciona con cualquier tamaño
 * (lo define GET /api/board).
 *
 * @param {object} props
 * @param {{ width: number, height: number }} props.board
 * @param {Array<Array<{x,y,ship,result}>>} props.rows  ver boardModel() en @batalla/core
 * @param {'ship' | 'rev' | null} [props.shipClass]  cómo pintar los barcos conocidos
 * @param {(cell) => string} [props.extraClass]  clases adicionales por casilla
 * @param {(cell) => void} [props.onCellClick]  si se pasa, las casillas son botones
 * @param {(cell) => boolean} [props.isDisabled]
 * @param {(cell | null) => void} [props.onCellHover]
 * @param {string} props.label  descripción accesible del tablero
 */
export function Board({ board, rows, shipClass = 'ship', extraClass, onCellClick, isDisabled, onCellHover, label }) {
  const interactive = Boolean(onCellClick);
  return (
    <div
      className={`bf${interactive ? ' click' : ''}`}
      style={{ '--cols': board.width }}
      role="grid"
      aria-label={label}
      onMouseLeave={onCellHover ? () => onCellHover(null) : undefined}
    >
      <div className="l" aria-hidden="true" />
      {Array.from({ length: board.width }, (_, x) => (
        <div key={`c${x}`} className="l" aria-hidden="true">
          {columnLabel(x)}
        </div>
      ))}
      {rows.map((row, y) => [
        <div key={`r${y}`} className="l" aria-hidden="true">
          {rowLabel(y)}
        </div>,
        ...row.map((cell) => {
          const classes = ['cell'];
          if (cell.ship && shipClass) classes.push(shipClass);
          if (cell.result) classes.push(cell.result);
          const extra = extraClass?.(cell);
          if (extra) classes.push(extra);
          const name = `${coordLabel([cell.x, cell.y])}${cell.result ? `, ${SHOT_LABELS[cell.result]}` : ''}${cell.ship && shipClass ? ', barco' : ''}`;
          return interactive ? (
            <button
              key={`${cell.x},${cell.y}`}
              type="button"
              className={classes.join(' ')}
              aria-label={name}
              disabled={isDisabled?.(cell)}
              onClick={() => onCellClick(cell)}
              onMouseEnter={onCellHover ? () => onCellHover(cell) : undefined}
              onFocus={onCellHover ? () => onCellHover(cell) : undefined}
            />
          ) : (
            <div key={`${cell.x},${cell.y}`} className={classes.join(' ')} role="gridcell" aria-label={name} />
          );
        }),
      ])}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="legend" style={{ marginTop: 14 }}>
      {items.map(([color, text]) => (
        <span key={text}>
          <i style={{ background: color }} />
          {text}
        </span>
      ))}
    </div>
  );
}
