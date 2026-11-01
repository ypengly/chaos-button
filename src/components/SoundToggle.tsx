import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  const Icon = enabled ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Sound effects"
      aria-pressed={enabled}
      title={enabled ? 'Sound on. Click to mute' : 'Sound off. Click to turn on'}
      onClick={() => onToggle(!enabled)}
      data-testid="sound-toggle"
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  );
}
