import { RotateCcw, Trash2 } from 'lucide-react';

export type ResetKind = 'session' | 'all';

interface FooterProps {
  onRequestReset: (kind: ResetKind) => void;
}

export function Footer({ onRequestReset }: FooterProps) {
  return (
    <footer className="relative z-10 mt-16 border-t border-line bg-surface/70 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2 text-sm text-muted">
          <p className="font-display text-lg font-extrabold text-ink">
            <span aria-hidden="true">💥</span> Chaos Button
          </p>
          <p>
            Disclaimer: pressing the button may cause confetti, mild existential dread and an unreasonable urge to press it
            again. No productivity was harmed because none was present.
          </p>
          <p>
            Built with React, TypeScript, Vite, Tailwind CSS and Framer Motion. Open source under the MIT licence. Everything
            runs in your browser.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-bold text-ink">Reset controls</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="pill" onClick={() => onRequestReset('session')}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset session
            </button>
            <button type="button" className="pill border-coral text-coral" onClick={() => onRequestReset('all')}>
              <Trash2 size={16} aria-hidden="true" />
              Reset all progress
            </button>
          </div>
          <p className="max-w-sm text-xs text-muted">
            Session reset keeps your badges and lifetime stats. Reset all erases them from this browser.
          </p>
        </div>
      </div>
    </footer>
  );
}
