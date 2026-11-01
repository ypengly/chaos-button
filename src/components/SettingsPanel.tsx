import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  BUTTON_COLOR_OPTIONS,
  EMOJI_THEMES,
  INTENSITY_OPTIONS,
  THEME_OPTIONS,
} from '../features/settings/settingsService';
import type { ButtonColor, EmojiTheme, Intensity, Settings, ThemeName } from '../types';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  /** True when the operating system asks for reduced motion (it overrides the setting). */
  osReducedMotion: boolean;
}

interface OptionGroupProps<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string; hint?: string }>;
  onChange: (value: T) => void;
  renderLabel?: (option: { id: T; label: string }) => ReactNode;
}

function OptionGroup<T extends string>({ legend, name, value, options, onChange, renderLabel }: OptionGroupProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-bold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="group inline-flex min-h-[2.75rem] cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-2"
            title={option.hint}
          >
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <Check size={14} aria-hidden="true" className="hidden group-has-[:checked]:inline" />
            {renderLabel ? renderLabel(option) : option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SWATCHES: Record<ButtonColor, string> = {
  violet: 'linear-gradient(160deg,#8b5cf6,#5b21b6)',
  coral: 'linear-gradient(160deg,#f43f5e,#be123c)',
  blue: 'linear-gradient(160deg,#3b82f6,#1d4ed8)',
  sunny: 'linear-gradient(160deg,#fde047,#f59e0b)',
  pink: 'linear-gradient(160deg,#ec4899,#be185d)',
};

function Switch({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
        </label>
        <p id={`${id}-desc`} className="text-sm text-muted">
          {description}
        </p>
      </div>
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-describedby={`${id}-desc`}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-muted bg-line transition-colors checked:border-accent checked:bg-accent
          relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-muted before:transition-transform before:content-[''] checked:before:translate-x-5 checked:before:bg-on-accent"
      />
    </div>
  );
}

export function SettingsPanel({ settings, onChange, osReducedMotion }: SettingsPanelProps) {
  return (
    <section aria-labelledby="settings-title" className="card space-y-6 p-5 sm:p-6">
      <div>
        <h2 id="settings-title" className="font-display text-2xl font-extrabold text-ink">
          Customize
        </h2>
        <p className="mt-1 text-sm text-muted">Saved in this browser and restored next time.</p>
      </div>

      <OptionGroup<ThemeName>
        legend="Theme"
        name="theme"
        value={settings.theme}
        options={THEME_OPTIONS}
        onChange={(theme) => onChange({ theme })}
      />

      <OptionGroup<ButtonColor>
        legend="Button colour"
        name="button-color"
        value={settings.buttonColor}
        options={BUTTON_COLOR_OPTIONS}
        onChange={(buttonColor) => onChange({ buttonColor })}
        renderLabel={(option) => (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border border-black/20"
              style={{ background: SWATCHES[option.id] }}
            />
            {option.label}
          </>
        )}
      />

      <OptionGroup<EmojiTheme>
        legend="Emoji particles"
        name="emoji-theme"
        value={settings.emojiTheme}
        options={(Object.keys(EMOJI_THEMES) as EmojiTheme[]).map((id) => ({ id, label: EMOJI_THEMES[id].label }))}
        onChange={(emojiTheme) => onChange({ emojiTheme })}
        renderLabel={(option) => (
          <>
            <span aria-hidden="true">{EMOJI_THEMES[option.id].emojis[0]}</span>
            {option.label}
          </>
        )}
      />

      <div>
        <OptionGroup<Intensity>
          legend="Animation intensity"
          name="intensity"
          value={settings.intensity}
          options={INTENSITY_OPTIONS}
          onChange={(intensity) => onChange({ intensity })}
        />
        {osReducedMotion ? (
          <p className="mt-2 text-sm font-medium text-muted" data-testid="os-reduced-note">
            Your device asks for reduced motion, so animations stay calm whatever you choose here.
          </p>
        ) : null}
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <Switch
          id="setting-sound"
          label="Sound effects"
          description="Short, synthesised blips. Off by default."
          checked={settings.soundEnabled}
          onChange={(soundEnabled) => onChange({ soundEnabled })}
        />
        <Switch
          id="setting-decorations"
          label="Background decorations"
          description="Floating emoji and colour blobs behind the page."
          checked={settings.decorations}
          onChange={(decorations) => onChange({ decorations })}
        />
      </div>
    </section>
  );
}
