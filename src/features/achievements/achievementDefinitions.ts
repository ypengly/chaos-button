import type { AchievementDefinition } from '../../types';
import { registry } from '../chaos/eventRegistry';
import { MAX_LEVEL } from '../statistics/statisticsService';

export const achievementDefinitions: readonly AchievementDefinition[] = [
  {
    id: 'first-contact',
    name: 'First Contact',
    description: 'Press the button once.',
    emoji: '👆',
    target: 1,
    progress: (lifetime) => lifetime.totalPresses,
  },
  {
    id: 'button-addict',
    name: 'Button Addict',
    description: 'Reach 25 presses.',
    emoji: '🔘',
    target: 25,
    progress: (lifetime) => lifetime.totalPresses,
  },
  {
    id: 'rare-collector',
    name: 'Rare Collector',
    description: 'Discover a rare event.',
    emoji: '💎',
    target: 1,
    progress: (lifetime) => lifetime.rareEventIds.length,
  },
  {
    id: 'chaos-legend',
    name: 'Chaos Legend',
    description: 'Reach Level 5.',
    emoji: '🏆',
    target: MAX_LEVEL,
    progress: (lifetime) => lifetime.highestLevel,
  },
  {
    id: 'everything-is-broken',
    name: 'Everything Is Broken',
    description: 'Discover 10 different event types.',
    emoji: '🧩',
    target: 10,
    progress: (lifetime) => lifetime.discoveredEventIds.length,
  },
  {
    id: 'triple-threat',
    name: 'Triple Threat',
    description: 'Discover every rare event.',
    emoji: '🌟',
    target: registry.rareEvents.length,
    progress: (lifetime) => lifetime.rareEventIds.length,
  },
  {
    id: 'seen-it-all',
    name: 'Seen It All',
    description: 'Discover every single event.',
    emoji: '🔭',
    target: registry.events.length,
    progress: (lifetime) => lifetime.discoveredEventIds.length,
  },
];
