import { Card as CardType } from '../lib/poker';
import { clsx } from 'clsx';

export function Card({ card, hidden = false, className }: { card?: CardType; hidden?: boolean; className?: string }) {
  if (hidden || !card) {
    return (
      <div className={clsx("w-10 h-14 sm:w-14 sm:h-20 rounded-md bg-charcoal border-2 border-wood flex items-center justify-center shadow-md", className)}>
        <div className="w-6 h-10 sm:w-10 sm:h-14 border border-wood/50 rounded-sm bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(212,162,90,0.1)_2px,rgba(212,162,90,0.1)_4px)]"></div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }[card.suit];

  return (
    <div className={clsx("w-10 h-14 sm:w-14 sm:h-20 rounded-md bg-cream flex flex-col justify-between p-1 shadow-md", className)}>
      <div className={clsx("text-xs sm:text-sm font-bold leading-none", isRed ? "text-red-600" : "text-charcoal")}>
        {card.rank}
        <br />
        {suitSymbol}
      </div>
      <div className={clsx("text-xl sm:text-3xl self-center -mt-2", isRed ? "text-red-600" : "text-charcoal")}>
        {suitSymbol}
      </div>
    </div>
  );
}
