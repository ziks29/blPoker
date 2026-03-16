import { Player } from '../lib/poker';
import { Card } from './Card';
import { clsx } from 'clsx';
import { motion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';

function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const spring = useSpring(value, { bounce: 0, duration: 600 });
  const display = useTransform(spring, (current) => `${prefix}${Math.round(current)}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

const positionClasses = [
  "bottom-[-2.5rem] sm:bottom-[-2rem] left-1/2 -translate-x-1/2",
  "bottom-[10%] left-[-1rem] sm:bottom-[10%] sm:left-[5%]",
  "top-1/2 left-[-1.5rem] sm:left-[-2rem] -translate-y-1/2",
  "top-[10%] left-[-1rem] sm:top-[10%] sm:left-[5%]",
  "top-[-2.5rem] sm:top-[-2rem] left-[25%] sm:left-[30%] -translate-x-1/2",
  "top-[-2.5rem] sm:top-[-2rem] right-[25%] sm:right-[30%] translate-x-1/2",
  "top-[10%] right-[-1rem] sm:top-[10%] sm:right-[5%]",
  "top-1/2 right-[-1.5rem] sm:right-[-2rem] -translate-y-1/2",
  "bottom-[10%] right-[-1rem] sm:bottom-[10%] sm:right-[5%]",
];

export function PlayerSeat({
  player,
  isActive,
  isDealer,
  showCards,
  positionIndex,
  currentHand,
}: {
  key?: string | number;
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  showCards: boolean;
  positionIndex: number;
  currentHand?: string;
}) {
  const posClass = positionClasses[positionIndex];

  return (
    <div
      className={clsx(
        "absolute flex flex-col items-center gap-1 sm:gap-2 transition-all duration-300 z-10",
        player.hasFolded && "opacity-50",
        posClass
      )}
    >
      <div className="relative flex -space-x-4">
        {player.cards.map((card, i) => (
          <div key={i} className={clsx("transform transition-transform", i === 1 && "rotate-6 translate-y-1")}>
            <Card card={card} hidden={!showCards && !player.isHuman} />
          </div>
        ))}
      </div>

      <div
        className={clsx(
          "bg-charcoal border-2 rounded-sm px-1.5 py-0.5 sm:px-4 sm:py-2 text-center min-w-[64px] sm:min-w-[120px] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors",
          isActive ? "border-amber shadow-[0_0_20px_rgba(212,162,90,0.3)]" : "border-wood/50"
        )}
      >
        <div className="text-[9px] sm:text-xs font-heading tracking-widest text-cream/70 uppercase truncate max-w-[60px] sm:max-w-[100px] mx-auto">
          {player.name}
        </div>
        <div className="text-xs sm:text-lg font-heading tracking-wider text-amber">
          <AnimatedNumber value={player.chips} prefix="$" />
        </div>
        {currentHand && !player.hasFolded && (
          <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 bg-charcoal/90 text-amber/90 text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-sm whitespace-nowrap font-heading tracking-widest uppercase border border-amber/20 shadow-sm">
            {currentHand}
          </div>
        )}
        {player.currentBet > 0 && (
          <div className="absolute -top-5 sm:-top-8 left-1/2 -translate-x-1/2 bg-wood/90 text-cream text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-sm whitespace-nowrap font-heading tracking-widest uppercase border border-amber/30">
            Bet: <AnimatedNumber value={player.currentBet} prefix="$" />
          </div>
        )}
        {isDealer && (
          <div className="absolute -right-2 -top-2 sm:-right-3 sm:-top-3 w-4 h-4 sm:w-6 sm:h-6 bg-cream text-charcoal rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold shadow-md border border-charcoal">
            D
          </div>
        )}
        {player.hasFolded && (
          <div className="absolute inset-0 bg-charcoal/80 flex items-center justify-center rounded-sm text-[9px] sm:text-xs text-red-400 font-heading tracking-widest uppercase backdrop-blur-sm">
            Folded
          </div>
        )}
      </div>
    </div>
  );
}
