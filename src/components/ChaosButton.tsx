import { forwardRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { BUTTON_LABELS } from '../features/chaos/buttonLabels';
import type { ButtonMode } from '../hooks/useChaos';

interface ChaosButtonProps {
  mode: ButtonMode;
  onPress: () => void;
  disabled?: boolean;
  reduced: boolean;
}

/** The giant, tactile centrepiece. A native <button>, so Enter and Space work out of the box. */
export const ChaosButton = forwardRef<HTMLButtonElement, ChaosButtonProps>(function ChaosButton(
  { mode, onPress, disabled = false, reduced },
  ref,
) {
  const controls = useAnimationControls();
  const [impact, setImpact] = useState(0);

  const handleClick = () => {
    setImpact((n) => n + 1);
    if (!reduced) {
      void controls.start({ scale: [1, 1.1, 0.97, 1.03, 1], transition: { duration: 0.45 } });
    }
    onPress();
  };

  const label = BUTTON_LABELS[mode];

  return (
    <div className="relative grid place-items-center pb-4">
      {impact > 0 && !reduced ? (
        <motion.span
          key={impact}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 bottom-4 m-auto rounded-full border-4 border-white/80"
          style={{ width: 'min(76vw, 20rem)', height: 'min(76vw, 20rem)' }}
          initial={{ scale: 0.92, opacity: 0.75 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      ) : null}
      <motion.button
        ref={ref}
        type="button"
        data-testid="chaos-button"
        className="chaos-btn"
        disabled={disabled}
        onClick={handleClick}
        animate={controls}
        whileHover={reduced || disabled ? undefined : { scale: 1.03 }}
        whileTap={reduced || disabled ? undefined : { scale: 0.94, y: 6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <span className={`chaos-btn__label${mode === 'rare' ? ' chaos-btn__label--long' : ''}`}>{label}</span>
      </motion.button>
    </div>
  );
});
