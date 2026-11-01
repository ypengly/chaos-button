import { getSelectionWeights } from '../features/chaos/chaosEngine';
import { registry } from '../features/chaos/eventRegistry';
import { LEVELS } from '../features/statistics/statisticsService';
import { formatPercent } from '../utils/formatters';

const rareChance = getSelectionWeights(registry.events)
  .filter((item) => item.event.rarity === 'rare')
  .reduce((sum, item) => sum + item.probability, 0);

export function AboutSection() {
  const standardCount = registry.events.length - registry.rareEvents.length;

  return (
    <section id="about" aria-labelledby="about-title" className="px-4">
      <div className="card p-6 sm:p-8">
        <p className="eyebrow">About</p>
        <h2 id="about-title" className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
          What is this, and why?
        </h2>
        <div className="mt-4 grid gap-6 text-base text-muted md:grid-cols-2">
          <div className="space-y-3">
            <p>
              Chaos Button is a tiny toy with one job: turn a single click into a random, harmless disaster. There are{' '}
              <strong className="text-ink">{standardCount} standard events</strong> and{' '}
              <strong className="text-ink">{registry.rareEvents.length} rare ones</strong>. Rare events show up roughly{' '}
              <strong className="text-ink">{formatPercent(rareChance)}</strong> of the time, and the same event never
              fires twice in a row.
            </p>
            <p>
              Presses earn chaos levels, from {LEVELS[0].title} to {LEVELS[LEVELS.length - 1].title}. Levels follow your
              presses in the current session. Badges and lifetime totals are remembered between visits.
            </p>
          </div>
          <div className="space-y-3">
            <p>
              <strong className="text-ink">Privacy:</strong> there is no server, no account and no tracking. Settings,
              statistics and badges live in your browser&apos;s storage and never leave your device.
            </p>
            <p>
              <strong className="text-ink">Comfort:</strong> sound is off until you turn it on, nothing flashes rapidly,
              and if your device asks for reduced motion the experience switches to calm, fade-only effects.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
