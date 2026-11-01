import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ThemeName } from '../types';
import { SoundToggle } from './SoundToggle';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  theme: ThemeName;
  soundEnabled: boolean;
  onThemeChange: (theme: ThemeName) => void;
  onSoundChange: (enabled: boolean) => void;
}

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#about', label: 'About' },
] as const;

export function Header({ theme, soundEnabled, onThemeChange, onSoundChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile menu and returns focus to its button.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <a
          href="#home"
          className="flex items-center gap-2 rounded-full font-display text-xl font-extrabold text-ink"
          aria-label="Chaos Button, back to top"
        >
          <span aria-hidden="true" className="text-2xl">
            💥
          </span>
          Chaos Button
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-ink hover:bg-line"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SoundToggle enabled={soundEnabled} onToggle={onSoundChange} />
          <ThemeToggle theme={theme} onChange={onThemeChange} />
          <button
            ref={menuButtonRef}
            type="button"
            className="icon-btn md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line px-4 pb-4 pt-2 md:hidden">
          <ul className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex min-h-[2.75rem] items-center rounded-xl px-3 text-base font-bold text-ink hover:bg-line"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
