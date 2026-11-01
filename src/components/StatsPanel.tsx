import type { LifetimeStats, SessionStats } from '../types';
import { FX_TARGET } from '../utils/css';

interface StatsPanelProps {
  session: SessionStats;
  lifetime: LifetimeStats;
  levelNumber: number;
  levelTitle: string;
  totalEvents: number;
  totalRareEvents: number;
}

interface Tile {
  id: string;
  label: string;
  value: string;
  detail: string;
}

export function StatsPanel({
  session,
  lifetime,
  levelNumber,
  levelTitle,
  totalEvents,
  totalRareEvents,
}: StatsPanelProps) {
  const tiles: Tile[] = [
    {
      id: 'presses',
      label: 'Presses this session',
      value: String(session.presses),
      detail: `All-time: ${lifetime.totalPresses}`,
    },
    {
      id: 'level',
      label: 'Chaos level',
      value: `Level ${levelNumber}`,
      detail: levelTitle,
    },
    {
      id: 'discovered',
      label: 'Events discovered',
      value: `${session.discoveredEventIds.length} / ${totalEvents}`,
      detail: `All-time: ${lifetime.discoveredEventIds.length} / ${totalEvents}`,
    },
    {
      id: 'rare',
      label: 'Rare events discovered',
      value: `${session.rareEventIds.length} / ${totalRareEvents}`,
      detail: `All-time: ${lifetime.rareEventIds.length} / ${totalRareEvents}`,
    },
  ];

  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title" className="sr-only">
        Session statistics
      </h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.id} className={`card ${FX_TARGET} p-4`} data-testid={`stat-${tile.id}`}>
            <dt className="text-xs font-bold uppercase tracking-wide text-muted sm:text-sm">{tile.label}</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold leading-none text-ink sm:text-4xl">{tile.value}</dd>
            <dd className="mt-2 text-xs font-medium text-muted sm:text-sm">{tile.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
