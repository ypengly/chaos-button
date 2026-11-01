import { Moon, Sun, Zap } from 'lucide-react';
import { THEME_OPTIONS } from '../features/settings/settingsService';
import type { ThemeName } from '../types';

interface ThemeToggleProps {
  theme: ThemeName;
  onChange: (theme: ThemeName) => void;
}

const ICONS = { light: Sun, dark: Moon, chaos: Zap } as const;

/** Cycles Light, Dark, Chaos. The accessible name states the current theme and the next one. */
export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const index = THEME_OPTIONS.findIndex((option) => option.id === theme);
  const current = THEME_OPTIONS[index] ?? THEME_OPTIONS[0];
  const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];
  const Icon = ICONS[current.id];

  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => onChange(next.id)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`Theme: ${current.label}`}
      data-testid="theme-toggle"
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
