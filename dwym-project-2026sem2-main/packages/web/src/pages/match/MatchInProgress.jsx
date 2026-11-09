import { useMemo, useState } from 'react';
import { boardModel, coordLabel, countSunk, PHASE, shotLog } from '@batalla/core';
import { MATCH_POLL_MS, useShoot } from '@batalla/hooks';
import { Board, Legend } from '../../components/Board.jsx';
import { LEGENDS } from '../../components/legends.js';
import { MoveLog } from '../../components/MoveLog.jsx';
import { Crumbs } from '../../components/ui.jsx';

/** Partida en curso: tablero rival para disparar, tablero propio y log de disparos. */
export function MatchInProgress({ match, board, perspective: p, rival, rivalShort, crumbs }) {
  const shoot = useShoot(match.id);
  const [selected, setSelected] = useState(null);
  const myTurn = p.phase === PHASE.MY_TURN;
  const shipCount = Object.keys(board.ships).length;

  const rivalRows = useMemo(() => boardModel(board, { shots: p.myShots }), [board, p.myShots]);
  const myRows = useMemo(() => boardModel(board, { fleet: p.myFleet, shots: p.rivalShots }), [board, p.myFleet, p.rivalShots]);
  const log = useMemo(
    () =>
      shotLog(match)
        .map((e) => ({ ...e, who: e.side === p.side ? 'Tú' : rivalShort }))
        .reverse(),
    [match, p.side, rivalShort],
  );

  const fire = () => {
    shoot.mutate([selected.x, selected.y], { onSuccess: () => setSelected(null) });
  };

  const banner = myTurn
    ? {
        cls: '',
        title: 'Tu turno',
        sub: p.rivalMaybePlacing
          ? 'Elige una casilla del tablero rival y dispara. Si tu rival aún no ubicó su flota, tendrás que esperarlo.'
          : 'Elige una casilla del tablero rival y dispara.',
      }
    : {
        cls: 'wait',
        title: p.rivalMaybePlacing ? `Esperando a ${rival}` : `Turno de ${rival}`,
        sub: p.rivalMaybePlacing
          ? 'Tu rival todavía no ubicó su flota o está por hacer el primer disparo. La partida se actualiza sola.'
          : 'Espera su disparo. La partida se actualiza sola.',
      };

  return (
    <>
      <Crumbs items={crumbs} />
      <div className={`turn ${banner.cls}`} style={{ marginBottom: 24 }} role="status" aria-live="polite">
        <div className="grow">
          <h2>{banner.title}</h2>
          <p>{banner.sub}</p>
        </div>
        <div className="sm">
          <span className="pulse" aria-hidden="true" />
          Actualizando cada {MATCH_POLL_MS / 1000} s
        </div>
      </div>
      <div className="boards">
        <section className="card" aria-labelledby="fr">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h2 id="fr">Flota rival</h2>
            <span className="sm muted">
              {countSunk(p.myShots)} de {shipCount} hundidos
            </span>
          </div>
          <p className="lead">Tus disparos sobre {rival}</p>
          <Board
            board={board}
            rows={rivalRows}
            shipClass={null}
            label="Tablero rival"
            onCellClick={myTurn ? (cell) => setSelected(cell) : undefined}
            isDisabled={(cell) => Boolean(cell.result)}
            extraClass={(cell) => (selected && selected.x === cell.x && selected.y === cell.y ? 'sel' : '')}
          />
          <Legend items={LEGENDS.shots} />
        </section>
        <section className="card" aria-labelledby="mf">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <h2 id="mf">Mi flota</h2>
            <span className="sm muted">
              {countSunk(p.rivalShots)} de {shipCount} hundidos
            </span>
          </div>
          <p className="lead">Disparos de {rival} sobre ti</p>
          <Board board={board} rows={myRows} label="Mi tablero" />
          <Legend items={LEGENDS.mine} />
        </section>
      </div>
      <div className="grid2" style={{ marginTop: 24 }}>
        <section className="card" aria-labelledby="td">
          <h2 id="td">Tu disparo</h2>
          <p className="lead">
            {!myTurn
              ? 'Podrás disparar cuando sea tu turno.'
              : selected
                ? 'Casilla elegida en el tablero rival. Cambia tu elección tocando otra.'
                : 'Toca una casilla del tablero rival para apuntar.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
            <div className="mono" style={{ fontSize: 56, lineHeight: 1, minWidth: 120, color: myTurn && selected ? '#C2410C' : '#53687A' }}>
              {myTurn && selected ? coordLabel([selected.x, selected.y]) : '—'}
            </div>
            <button className="btn acc" disabled={!myTurn || !selected || shoot.isPending} onClick={fire}>
              {shoot.isPending ? 'Disparando…' : 'Disparar'}
            </button>
          </div>
          {shoot.isError && (
            <div className="alert err" role="alert" style={{ marginTop: 16 }}>
              {shoot.error.message}
            </div>
          )}
        </section>
        <section className="card" aria-labelledby="jg">
          <h2 id="jg">Jugadas</h2>
          <p className="lead">Disparos de ambos, de la más reciente a la más antigua.</p>
          <MoveLog entries={log} />
        </section>
      </div>
    </>
  );
}
