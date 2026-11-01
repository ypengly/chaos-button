import { cssVars, FX_TARGET } from '../utils/css';

interface DecorItem {
  emoji?: string;
  blob?: 'decor-1' | 'decor-2' | 'decor-3';
  left: string;
  top: string;
  size: number;
  /** Hide the smaller screens' extra items to keep the page calm and cheap. */
  desktopOnly?: boolean;
}

const ITEMS: readonly DecorItem[] = [
  { blob: 'decor-1', left: '-8%', top: '2%', size: 360 },
  { blob: 'decor-2', left: '72%', top: '8%', size: 300 },
  { blob: 'decor-3', left: '55%', top: '55%', size: 260, desktopOnly: true },
  { emoji: '🎈', left: '6%', top: '14%', size: 44 },
  { emoji: '⭐', left: '88%', top: '24%', size: 36 },
  { emoji: '🧨', left: '10%', top: '48%', size: 40, desktopOnly: true },
  { emoji: '🪩', left: '92%', top: '58%', size: 46, desktopOnly: true },
  { emoji: '🍿', left: '4%', top: '78%', size: 38 },
  { emoji: '💥', left: '84%', top: '86%', size: 42 },
  { emoji: '🫧', left: '48%', top: '30%', size: 30, desktopOnly: true },
];

/** Purely decorative backdrop. Hidden from assistive tech and never interactive. */
export function Decorations() {
  return (
    <div className="decor-layer" aria-hidden="true" data-testid="decorations">
      {ITEMS.map((item, index) => (
        <span
          key={index}
          className={`decor-item ${FX_TARGET}${item.desktopOnly ? ' hidden md:block' : ''}`}
          style={{
            left: item.left,
            top: item.top,
            ...(item.blob
              ? {
                  width: item.size,
                  height: item.size,
                  borderRadius: '9999px',
                  background: `radial-gradient(circle, rgb(var(--${item.blob}) / 0.55), transparent 70%)`,
                  opacity: 1,
                }
              : { fontSize: item.size }),
            ...cssVars({ '--decor-delay': `${(index % 5) * -1.3}s`, '--float-delay': `${(index % 4) * 0.18}s` }),
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
