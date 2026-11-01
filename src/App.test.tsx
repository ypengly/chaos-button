import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { SETTINGS_KEY } from './features/settings/settingsService';
import { LIFETIME_KEY } from './features/statistics/statisticsService';

/** Sequential rng so presses are deterministic without depending on animation timing. */
function cyclingRng(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

const setup = (rng = cyclingRng([0.05, 0.5, 0.9, 0.3])) => {
  const user = userEvent.setup();
  render(<App rng={rng} />);
  return { user, button: screen.getByRole('button', { name: /press for chaos|chaos activated/i }) };
};

const statValue = (id: string) => within(screen.getByTestId(`stat-${id}`)).getAllByText(/./)[1];

describe('main button', () => {
  it('has an accessible name and triggers an event', async () => {
    const { user, button } = setup();
    expect(button).toHaveAccessibleName('PRESS FOR CHAOS');
    await user.click(button);
    expect(screen.getByTestId('chaos-button')).toHaveTextContent('CHAOS ACTIVATED!');
    expect(screen.getAllByTestId('feed-entry')).toHaveLength(1);
    await waitFor(() =>
      expect(screen.getByTestId('chaos-message')).not.toHaveTextContent('Waiting for your terrible decision.'),
    );
  });

  it('works from the keyboard', async () => {
    const { user, button } = setup();
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(screen.getAllByTestId('feed-entry')).toHaveLength(2);
  });

  it('Surprise me also triggers an event', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /surprise me/i }));
    expect(screen.getAllByTestId('feed-entry')).toHaveLength(1);
    expect(await screen.findByText(/surprise pick/i)).toBeInTheDocument();
  });

  it('never repeats the previous event on consecutive presses', async () => {
    const { user, button } = setup(() => 0);
    await user.click(button);
    await user.click(button);
    await user.click(button);
    const names = screen.getAllByTestId('feed-entry').map((el) => el.textContent);
    expect(names).toHaveLength(3);
    // Adjacent presses must differ even though the rng always rolls the first slot.
    expect(names[0]).not.toBe(names[1]);
    expect(names[1]).not.toBe(names[2]);
  });
});

describe('statistics', () => {
  it('updates after presses and persists lifetime totals', async () => {
    const { user, button } = setup();
    expect(statValue('presses')).toHaveTextContent('0');
    await user.click(button);
    await user.click(button);
    expect(statValue('presses')).toHaveTextContent('2');
    expect(JSON.parse(localStorage.getItem(LIFETIME_KEY) ?? '{}').totalPresses).toBe(2);
    expect(screen.getByTestId('achievement-first-contact')).toHaveAttribute('data-unlocked', 'true');
  });

  it('shows the level title and a labelled progress bar', async () => {
    const { user, button } = setup();
    await user.click(button);
    expect(screen.getByRole('heading', { name: /level 1: curious/i })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /progress to next chaos level/i })).toBeInTheDocument();
  });
});

describe('event feed', () => {
  it('lists new events and can be cleared', async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(button);
    expect(screen.getAllByTestId('feed-entry')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /clear feed/i }));
    expect(screen.queryAllByTestId('feed-entry')).toHaveLength(0);
  });
});

describe('settings', () => {
  it('changes the theme from the settings panel and persists it', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').theme).toBe('dark');
  });

  it('cycles the theme with the header toggle', async () => {
    const { user } = setup();
    await user.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('dark');
    await user.click(screen.getByTestId('theme-toggle'));
    expect(document.documentElement.dataset.theme).toBe('chaos');
  });

  it('keeps sound off by default and toggles it', async () => {
    const { user } = setup();
    const toggle = screen.getByTestId('sound-toggle');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('switch', { name: /sound effects/i })).toBeChecked();
  });

  it('changes animation intensity and the emoji theme', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: 'Reduced' }));
    expect(document.querySelector('.app-root')).toHaveAttribute('data-motion', 'reduced');
    await user.click(screen.getByRole('radio', { name: /snacks/i }));
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').emojiTheme).toBe('food');
  });

  it('hides background decorations when switched off', async () => {
    const { user } = setup();
    expect(screen.getByTestId('decorations')).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: /background decorations/i }));
    expect(screen.queryByTestId('decorations')).not.toBeInTheDocument();
  });

  it('restores saved settings on the next visit', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: 'chaos', buttonColor: 'coral' }));
    render(<App />);
    expect(document.querySelector('.app-root')).toHaveAttribute('data-theme', 'chaos');
    expect(document.querySelector('.app-root')).toHaveAttribute('data-button', 'coral');
  });

  it('shows a friendly notice when stored data is corrupt', () => {
    localStorage.setItem(LIFETIME_KEY, '{broken');
    render(<App />);
    expect(screen.getByTestId('storage-notice')).toHaveTextContent(/unreadable/i);
  });
});

describe('reset confirmation', () => {
  it('does nothing until confirmed and can be cancelled', async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(screen.getByRole('button', { name: /reset all progress/i }));
    const dialog = screen.getByRole('alertdialog', { name: /erase all saved progress/i });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(statValue('presses')).toHaveTextContent('1');
    expect(localStorage.getItem(LIFETIME_KEY)).not.toBeNull();
  });

  it('closes on Escape without resetting', async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(screen.getByRole('button', { name: /reset session/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(statValue('presses')).toHaveTextContent('1');
  });

  it('session reset keeps badges and lifetime stats', async () => {
    const { user, button } = setup();
    await user.click(button);
    await user.click(screen.getByRole('button', { name: /reset session/i }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /^reset session$/i }));
    expect(statValue('presses')).toHaveTextContent('0');
    expect(screen.getByTestId('achievement-first-contact')).toHaveAttribute('data-unlocked', 'true');
    expect(JSON.parse(localStorage.getItem(LIFETIME_KEY) ?? '{}').totalPresses).toBe(1);
  });

  it('reset all erases badges and saved stats but keeps settings', async () => {
    const { user, button } = setup();
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(button);
    await user.click(screen.getByRole('button', { name: /reset all progress/i }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/cannot be undone/i);
    await user.click(screen.getByRole('button', { name: /erase everything/i }));
    expect(statValue('presses')).toHaveTextContent('0');
    expect(screen.getByTestId('achievement-first-contact')).toHaveAttribute('data-unlocked', 'false');
    expect(localStorage.getItem(LIFETIME_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}').theme).toBe('dark');
  });
});

describe('accessibility basics', () => {
  it('labels icon-only controls and navigation', () => {
    setup();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sound effects$/i })).toBeInTheDocument();
    expect(screen.getByTestId('theme-toggle')).toHaveAccessibleName(/theme: light/i);
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
  });

  it('hides decorative effects from assistive tech and has one live region for messages', () => {
    setup();
    expect(screen.getByTestId('effects-layer')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('chaos-message')).toHaveAttribute('aria-live', 'polite');
  });

  it('opens and closes the mobile menu', async () => {
    const { user } = setup();
    const menu = screen.getByRole('button', { name: /open menu/i });
    await user.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });

  it('every nav link points at an existing section', () => {
    setup();
    for (const link of screen.getAllByRole('link', { name: /^(home|achievements|about)$/i })) {
      const id = link.getAttribute('href')!.slice(1);
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});
