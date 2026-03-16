import { Player, Card as CardType, GamePhase, evaluateHand } from '../lib/poker';
import { PlayerSeat } from './PlayerSeat';
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

export function Table({
  players,
  communityCards,
  pot,
  activePlayerIndex,
  dealerIndex,
  phase,
  winners,
}: {
  players: Player[];
  communityCards: CardType[];
  pot: number;
  activePlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  winners: { player: Player; description: string }[];
}) {
  const showCards = phase === 'showdown';

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-4xl aspect-[1/1.4] sm:aspect-[2/1] bg-wood rounded-[140px] sm:rounded-[200px] border-8 border-charcoal shadow-2xl flex items-center justify-center mx-auto bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]">
      {/* Table Felt */}
      <div className="absolute inset-2 sm:inset-4 bg-charcoal/90 rounded-[130px] sm:rounded-[190px] border border-amber/20 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center">
      </div>
      
      {/* Community Cards & Pot */}
      <div className="relative z-20 flex flex-col items-center gap-3 sm:gap-6">
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          {/* Black Lantern & Title */}
          <div className="flex flex-col items-center">
            <div className="relative w-8 h-10 sm:w-12 sm:h-16 flex flex-col items-center justify-end drop-shadow-2xl z-10">
              <svg viewBox="0 0 64 80" className="w-full h-full relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Handle */}
                <path d="M24 16C24 6 40 6 40 16" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
                {/* Top */}
                <path d="M28 16H36L42 24H22L28 16Z" fill="#111"/>
                <path d="M18 24H46L48 28H16L18 24Z" fill="#111"/>
                {/* Body */}
                <path d="M20 28L16 64H48L44 28H20Z" fill="#1a1a1a" stroke="#111" strokeWidth="4" strokeLinejoin="round"/>
                {/* Bars */}
                <line x1="24" y1="28" x2="22" y2="64" stroke="#111" strokeWidth="3"/>
                <line x1="40" y1="28" x2="42" y2="64" stroke="#111" strokeWidth="3"/>
                <line x1="32" y1="28" x2="32" y2="64" stroke="#111" strokeWidth="3"/>
                {/* Base */}
                <path d="M14 64H50L54 72H10L14 64Z" fill="#111"/>
                <path d="M12 72H52V76H12V72Z" fill="#111"/>
                {/* Flame */}
                <path d="M32 38C32 38 26 46 26 52C26 55.3137 28.6863 58 32 58C35.3137 58 38 55.3137 38 52C38 46 32 38 32 38Z" fill="#F59E0B" className="animate-pulse"/>
              </svg>
              {/* Glow effect behind/around the lantern */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 bg-amber-500/20 blur-xl rounded-full pointer-events-none animate-pulse" />
            </div>
            <div className="font-heading text-amber/60 tracking-[0.3em] uppercase text-[10px] sm:text-sm -mt-1 sm:-mt-2 drop-shadow-md">
              Black Lantern
            </div>
          </div>

          {pot > 0 && (
            <div className="bg-charcoal/90 px-4 py-1 sm:px-8 sm:py-2 rounded-sm border border-amber/30 text-amber font-heading text-lg sm:text-2xl shadow-[0_0_15px_rgba(212,162,90,0.2)] tracking-wider mt-1 sm:mt-2">
              Pot: <AnimatedNumber value={pot} prefix="$" />
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-1 sm:gap-4 min-h-[3.5rem] sm:min-h-[7.5rem]">
          {communityCards.map((card, i) => (
            <div key={i} className="animate-in fade-in zoom-in duration-300">
              <Card card={card} />
            </div>
          ))}
          {/* Placeholders for community cards */}
          {Array.from({ length: Math.max(0, 5 - communityCards.length) }).map((_, i) => (
            <div key={`placeholder-${i}`} className="w-10 h-14 sm:w-14 sm:h-20 rounded-md border border-white/5 bg-charcoal/40 shadow-inner" />
          ))}
        </div>

        {/* Winners Announcement */}
        {winners.length > 0 && (
          <div className="absolute top-full mt-4 sm:mt-8 bg-amber text-charcoal px-4 py-2 sm:px-8 sm:py-3 rounded-sm font-heading text-base sm:text-2xl shadow-[0_0_30px_rgba(212,162,90,0.4)] whitespace-nowrap animate-in slide-in-from-bottom-4 tracking-wider uppercase z-50 text-center">
            {winners.map(w => w.player.name).join(', ')} wins!
            <div className="text-[10px] sm:text-sm opacity-80 mt-0.5 sm:mt-1">{winners[0].description}</div>
          </div>
        )}
      </div>

      {/* Players */}
      {players.map((player, i) => {
        let currentHandDesc = undefined;
        if (player.isHuman && player.cards.length > 0 && phase !== 'idle' && phase !== 'showdown') {
          const hand = evaluateHand(player.cards, communityCards);
          currentHandDesc = hand.name;
        }

        return (
          <PlayerSeat
            key={player.id}
            player={player}
            isActive={i === activePlayerIndex}
            isDealer={i === dealerIndex}
            showCards={showCards}
            positionIndex={i}
            currentHand={currentHandDesc}
          />
        );
      })}
    </div>
  );
}
