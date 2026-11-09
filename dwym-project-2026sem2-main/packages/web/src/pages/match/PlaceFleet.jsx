import { useEffect, useMemo, useState } from 'react';
import { boardModel, coordKey, HORIZONTAL, shipLabel } from '@batalla/core';
import { usePlaceFleet, usePlacement } from '@batalla/hooks';
import { Board, Legend } from '../../components/Board.jsx';
import { Chip, PageHead } from '../../components/ui.jsx';

/** Primer movimiento: ubicar los barcos en el tablero propio. */
export function PlaceFleet({ match, board, crumbs }) {
  const placement = usePlacement(board);
  const placeFleet = usePlaceFleet(match.id);
  const [hover, setHover] = useState(null);

  // Atajo de teclado: R para rotar.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && e.target.tagName !== 'INPUT') placement.rotate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [placement]);

  const rows = useMemo(() => boardModel(board, { fleet: placement.fleet }), [board, placement.fleet]);
  const preview = hover ? placement.preview([hover.x, hover.y]) : null;
  const previewKeys = new Set(preview?.cells.map(coordKey));

  const extraClass = (cell) => {
    const k = coordKey([cell.x, cell.y]);
    if (previewKeys.has(k) && (!cell.ship || cell.ship === placement.selected)) return preview.valid ? 'ghost' : 'ghost bad';
    if (cell.ship && cell.ship === placement.selected) return 'picked';
    return '';
  };

  const confirm = () => {
    if (!window.confirm('¿Confirmar la flota? Después no podrás cambiarla.')) return;
    placeFleet.mutate(placement.fleet);
  };

  return (
    <>
      <PageHead
        crumbs={crumbs}
        title="Coloca tu flota"
        sub="Tu primera jugada es ubicar los barcos. No hace falta esperar a tu rival."
        aside={<Chip tone="acc">Colocar flota</Chip>}
      />
      <div className="split">
        <section className="card main" aria-labelledby="tb">
          <h2 id="tb">Tu tablero</h2>
          <p className="lead">
            {placement.selected
              ? `Toca una casilla para ubicar el ${shipLabel(placement.selected).toLowerCase()} (${placement.orientation === HORIZONTAL ? 'horizontal' : 'vertical'}). Pulsa R para rotar.`
              : 'Todos los barcos están ubicados. Toca uno para moverlo o confirma la flota.'}{' '}
            Los barcos no pueden superponerse, pero sí tocarse.
          </p>
          <div style={{ maxWidth: 600 }}>
            <Board
              board={board}
              rows={rows}
              label="Tu tablero"
              extraClass={extraClass}
              onCellHover={setHover}
              onCellClick={(cell) => placement.tap([cell.x, cell.y])}
            />
          </div>
          <Legend
            items={[
              ['#0B2239', 'Barco colocado'],
              ['#1B5E8C', 'Vista previa / seleccionado'],
              ['#EAF1F5', 'Agua'],
            ]}
          />
        </section>
        <aside className="card side" aria-labelledby="fl">
          <h2 id="fl">Barcos</h2>
          <p className="lead">
            {placement.placedCount} de {placement.total} colocados
          </p>
          <div>
            {placement.names.map((name) => {
              const placed = Boolean(placement.fleet[name]);
              const active = placement.selected === name;
              return (
                <div className={`fleet-row${active ? ' active' : ''}`} key={name}>
                  <button
                    type="button"
                    className="nm"
                    style={{ border: 0, background: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 600, color: 'inherit' }}
                    onClick={() => placement.select(name)}
                    aria-pressed={active}
                  >
                    {shipLabel(name)}
                    {active && <div className="xs muted b">{placed ? 'Toca otra casilla para moverlo' : 'Eligiendo posición'}</div>}
                  </button>
                  <div className="blocks" aria-label={`${board.ships[name]} casillas`}>
                    {Array.from({ length: board.ships[name] }, (_, i) => (
                      <i key={i} className={placed ? undefined : 'p'} />
                    ))}
                  </div>
                  <div className="acts">
                    {active && (
                      <button className="btn sm out" onClick={placement.rotate}>
                        Rotar
                      </button>
                    )}
                    {placed && (
                      <button className="btn sm out" onClick={() => placement.remove(name)}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn sm out" onClick={placement.randomize}>
              Ubicar al azar
            </button>
            <button className="btn sm out" onClick={placement.clear} disabled={placement.placedCount === 0}>
              Vaciar tablero
            </button>
          </div>
          {placeFleet.isError ? (
            <div className="alert err" role="alert" style={{ marginTop: 20 }}>
              {placeFleet.error.message}
            </div>
          ) : (
            <div className="alert" style={{ marginTop: 20 }}>
              {placement.complete
                ? 'Flota lista. Una vez confirmada, no podrás cambiarla.'
                : `Para confirmar, coloca los ${placement.total} barcos. Una vez confirmada, no podrás cambiar la flota.`}
            </div>
          )}
          <button
            className={`btn block ${placement.complete ? 'acc' : ''}`}
            style={{ marginTop: 16 }}
            disabled={!placement.complete || placeFleet.isPending}
            onClick={confirm}
          >
            {placeFleet.isPending ? 'Confirmando…' : 'Confirmar flota'}
          </button>
        </aside>
      </div>
    </>
  );
}
