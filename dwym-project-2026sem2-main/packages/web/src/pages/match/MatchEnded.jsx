import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { boardModel, endedBySinking, moveHistory } from '@batalla/core';
import { useMatchMoves } from '@batalla/hooks';
import { Board, Legend } from '../../components/Board.jsx';
import { LEGENDS } from '../../components/legends.js';
import { MoveLog } from '../../components/MoveLog.jsx';
import { Crumbs, ErrorState, Loading } from '../../components/ui.jsx';

/** Partida terminada: resultado, ambas flotas reveladas e historial completo. */
export function MatchEnded({ match, board, perspective: p, rival, rivalShort, crumbs }) {
  const movesQuery = useMatchMoves(match.id, true);
  const sunkAll = endedBySinking(match, board);

  const rivalRows = useMemo(() => boardModel(board, { fleet: p.rivalFleet, shots: p.myShots }), [board, p.rivalFleet, p.myShots]);
  const myRows = useMemo(() => boardModel(board, { fleet: p.myFleet, shots: p.rivalShots }), [board, p.myFleet, p.rivalShots]);
  const history = useMemo(
    () => (movesQuery.data ? moveHistory(movesQuery.data, match).map((m) => ({ ...m, who: m.side === p.side ? 'Tú' : rivalShort })) : []),
    [movesQuery.data, match, p.side, rivalShort],
  );

  const winnerShots = p.won ? p.myShots.length : p.rivalShots.length;
  const sub = !sunkAll
    ? p.won
      ? `El organizador dio la partida por terminada y te declaró ganador frente a ${rival}.`
      : `El organizador dio la partida por terminada y declaró ganador a ${rival}.`
    : p.won
      ? `Hundiste todos los barcos de ${rival} en ${winnerShots} disparos.`
      : `${rival} hundió todos tus barcos en ${winnerShots} disparos.`;

  return (
    <>
      <Crumbs items={crumbs} />
      <div className={`turn ${p.won ? 'win' : 'lose'}`} style={{ marginBottom: 24 }}>
        <div className="grow">
          <h2 style={{ fontSize: 44 }}>{p.won ? 'Victoria' : 'Derrota'}</h2>
          <p>{sub}</p>
        </div>
        <Link className="btn outw" to="/partidas">
          Volver a partidas
        </Link>
      </div>
      <div className="boards">
        <section className="card" aria-labelledby="fr">
          <h2 id="fr">Flota rival</h2>
          <p className="lead">Tus disparos sobre la flota de {rival}, ya revelada.</p>
          <Board board={board} rows={rivalRows} shipClass="rev" label="Tablero rival" />
          <Legend items={LEGENDS.revealed} />
        </section>
        <section className="card" aria-labelledby="mf">
          <h2 id="mf">Mi flota</h2>
          <p className="lead">Los disparos de {rival} sobre tu flota.</p>
          <Board board={board} rows={myRows} label="Mi tablero" />
          <Legend items={LEGENDS.mine} />
        </section>
      </div>
      <section className="card" style={{ marginTop: 24 }} aria-labelledby="hs">
        <h2 id="hs">Historial de jugadas</h2>
        <p className="lead">Todas las jugadas en orden, desde la ubicación de las flotas.</p>
        {movesQuery.isPending ? (
          <Loading label="Cargando historial…" />
        ) : movesQuery.isError ? (
          <ErrorState error={movesQuery.error} onRetry={() => movesQuery.refetch()} />
        ) : (
          <MoveLog entries={history} maxHeight={420} emptyText="La partida terminó sin jugadas." />
        )}
      </section>
    </>
  );
}
