# Chaos Button 💥

**One button. Infinite bad decisions.**

Chaos Button is a playful, browser-only web toy built with React, TypeScript and Vite. The whole site revolves around one giant button: **PRESS FOR CHAOS**. Every press fires a random, harmless, ridiculous event, such as emoji rain, an earthquake, a fake loading bar or an existential crisis. You earn chaos levels and badges as you go.

## Feature highlights

- **18 chaos events**: 15 standard and 3 rare (Rainbow Overload, The Void, Supreme Chaos), picked by weighted random selection. The same event never fires twice in a row.
- **Chaos levels** from *Curious* to *CHAOS LEGEND*, based purely on press count, with a level-up celebration.
- **7 achievement badges** with progress bars for the locked ones.
- **Funny message generator** with several messages per event and no immediate repeats. Rare events get a special style.
- **Live stats and an event feed** (last 20 events, clearable).
- **Themes**: Light, Dark and Chaos, plus 5 button colours, 4 emoji particle themes and 3 animation intensities (Reduced, Normal, Extra).
- **Optional sound**, off by default. Sounds are synthesised with the Web Audio API, so there are no audio files.
- **Accessible and responsive**: keyboard friendly, reduced-motion aware, tested down to a 375px-wide phone.
- **No backend.** Everything runs and is stored in your browser.

## Screenshots

> No screenshots are committed yet. Run the app (see below) and add your own to a `docs/` folder, then reference them here.

| View | File |
| --- | --- |
| Desktop home | _placeholder: `docs/screenshot-desktop.png`_ |
| Mobile home | _placeholder: `docs/screenshot-mobile.png`_ |

## Technology stack

React 18 (hooks), TypeScript (strict), Vite 5, Tailwind CSS 3, Framer Motion 11, Lucide React, Vitest 2 with React Testing Library, ESLint 9 (flat config) and browser storage for settings and stats.

## Prerequisites

- Node.js **18.18 or newer** (20 LTS or newer recommended)
- npm 9 or newer

## Installation

```bash
git clone <your-repo-url> chaos-button
cd chaos-button
npm install
```

## Development commands

These are the exact scripts from `package.json`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and create the production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run all tests once (`vitest run`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint the project with ESLint |
| `npm run typecheck` | Type-check without emitting files |

## Production build and preview

```bash
npm run build
npm run preview
```

Vite is configured with `base: './'`, so the build works from any path. No environment variables are needed.

## Testing and linting

```bash
npm test
npm run lint
npm run typecheck
```

The tests cover the chaos engine (unique IDs, weighted selection, previous-event avoidance, single-event registries, deterministic injected randomness), levels and achievements, persistence and reset behaviour (including corrupt JSON and blocked storage), the effect controller's cleanup and particle budget, and the main UI flows (pressing, stats, feed, settings, reset dialogs, accessible names). They avoid asserting exact animation timing.

## Project structure

```
chaos-button/
├── public/favicon.svg
├── src/
│   ├── components/            UI: Header, Hero, ChaosButton, EffectsLayer, StatsPanel, ...
│   ├── features/
│   │   ├── chaos/             events, registry, weights, engine, controller, reducer
│   │   ├── achievements/      definitions and unlock logic
│   │   ├── statistics/        levels, session and lifetime stats
│   │   └── settings/          settings defaults, validation and options
│   ├── hooks/                 useChaos, useLocalStorage, useReducedMotion, useSound, ...
│   ├── utils/                 random, storage, formatters, css helpers
│   ├── types/index.ts
│   ├── test/                  test setup
│   ├── App.tsx, main.tsx, index.css
├── tests/chaosEngine.test.ts
├── netlify.toml, vercel.json
└── README.md, LICENSE
```

## How the chaos event system works

Every event is plain data in `src/features/chaos/chaosEvents.ts`: an ID, name, emoji, description, rarity, duration, messages and a list of **effect configs** such as `rain`, `burst`, `wash` or `class`. The `EffectsLayer` component interprets those configs, so the app has no per-event branching.

- **Selection** (`chaosEngine.ts`): each event has a weight (standard = 10, rare = 3, Supreme Chaos = 1.5). With the current registry, rare events appear roughly 5% of the time. The previous event is excluded when an alternative exists. Randomness is injectable for testing.
- **Coordination** (`chaosController.ts`): one controller owns every timer. It caps simultaneous effects at 4, shares a particle budget of 150, replaces a repeated event instead of stacking it, and cancels everything when the tab is hidden or the component unmounts.
- **Adding an event**: append a definition to `chaosEvents.ts`. The engine, feed, stats and achievements pick it up automatically. For a new visual type, add one `EffectConfig` variant and render it in `EffectsLayer`.

## Levels, achievements and local persistence

| Level | Title | Presses |
| --- | --- | --- |
| 1 | Curious | 1 to 10 |
| 2 | Trouble Maker | 11 to 25 |
| 3 | Chaos Agent | 26 to 50 |
| 4 | Certified Menace | 51 to 100 |
| 5 | CHAOS LEGEND | 101+ |

Levels follow **session** presses. Badges are First Contact, Button Addict, Rare Collector, Chaos Legend, Everything Is Broken, Triple Threat and Seen It All. They are based on **lifetime** stats.

| Data | Where | Cleared by |
| --- | --- | --- |
| Settings | `localStorage` | Never resets (you change them yourself) |
| Lifetime stats and badges | `localStorage` | **Reset all progress** |
| Current session | `sessionStorage` | **Reset session** or closing the tab |

- **Reset session** starts a fresh session and keeps lifetime stats and badges.
- **Reset all progress** erases lifetime stats, badges and the session. It asks for confirmation first and keeps your settings.
- Corrupt or unavailable storage never crashes the app. Bad fields fall back to defaults and a dismissible notice explains what happened.

## Accessibility and performance notes

- Semantic landmarks, a skip link, visible focus rings and labelled icon-only buttons.
- A single polite live region announces each event message. Rarity is written out as text, not only colour.
- The confirmation dialog is modal, traps focus, closes on Escape and returns focus afterwards.
- `prefers-reduced-motion` always wins over app settings and the Chaos theme. Moving particles are replaced with calm fades.
- No rapid flashing: effects use slow gradients, fades and transforms only.
- Animations use `transform` and `opacity`, particles are capped, smaller screens get fewer particles, and decorative animation pauses when the tab is hidden.

## Deployment

Both platforms detect Vite automatically. Config files are included.

**Vercel**
1. Push the repository to GitHub.
2. In Vercel choose **Add New, Project** and import the repo.
3. Keep the detected settings (build `npm run build`, output `dist`) and deploy.

**Netlify**
1. Push the repository to GitHub.
2. In Netlify choose **Add new site, Import an existing project** and pick the repo.
3. Build command `npm run build`, publish directory `dist` (already set in `netlify.toml`), then deploy.

Verify locally first with `npm run build && npm run preview`.

## Privacy

There is no backend, account, analytics or network request for data. Settings, statistics and badges are stored only in your browser's storage and never leave your device.

## Troubleshooting

- **Progress is not saved**: your browser may block storage (private mode or strict settings). The app shows a notice and still works.
- **Few or no animations**: check Animation intensity in *Customize*, and your operating system's reduced-motion setting.
- **No sound**: sound is off by default. Turn it on with the speaker icon. Browsers only start audio after a click.
- **`npm install` peer dependency errors**: use the versions in `package.json`. ESLint is pinned to v9 because `@eslint/js` v10 requires ESLint 10.

## Contributing

1. Fork the repo and create a branch.
2. Make your change with tests where it makes sense.
3. Run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. All four must pass.
4. Open a pull request describing what changed and why.

Keep jokes original and effects free of rapid flashing.

## License

MIT. See [LICENSE](./LICENSE).
