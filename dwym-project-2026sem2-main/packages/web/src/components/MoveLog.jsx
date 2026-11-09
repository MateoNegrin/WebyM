import { SHOT_LABELS, SHOT_TONES } from '@batalla/core';
import { Chip } from './ui.jsx';

/**
 * Lista de jugadas. Cada entrada: { n, who, coord?, result?, kind? }.
 * Las de kind 'fleet' representan la ubicación de la flota.
 */
export function MoveLog({ entries, maxHeight, emptyText = 'Todavía no hay disparos.' }) {
  if (entries.length === 0) return <p className="muted sm">{emptyText}</p>;
  return (
    <ol className="log" style={{ maxHeight, margin: 0, padding: 0, listStyle: 'none' }}>
      {entries.map((m) => (
        <li className="m" key={m.n}>
          <span className="n mono">#{m.n}</span>
          <span className="w">
            <b>{m.who}</b> · <span className="mono">{m.kind === 'fleet' ? 'Flota' : m.coord}</span>
          </span>
          {m.kind === 'fleet' ? <Chip tone="line">Ubicada</Chip> : <Chip tone={SHOT_TONES[m.result]}>{SHOT_LABELS[m.result]}</Chip>}
        </li>
      ))}
    </ol>
  );
}
