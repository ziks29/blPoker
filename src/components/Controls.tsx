import { useState, useEffect } from 'react';
import { Player } from '../lib/poker';

export function Controls({
  player,
  currentBet,
  pot,
  onAction,
  isHumanTurn,
  autoAction,
  setAutoAction,
}: {
  player: Player;
  currentBet: number;
  pot: number;
  onAction: (action: 'fold' | 'call' | 'raise', amount?: number) => void;
  isHumanTurn: boolean;
  autoAction: 'check/fold' | 'call' | null;
  setAutoAction: (action: 'check/fold' | 'call' | null) => void;
}) {
  const toCall = currentBet - player.currentBet;
  const canCheck = toCall === 0;
  
  const minRaise = currentBet === 0 ? 20 : currentBet * 2;
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  useEffect(() => {
    setRaiseAmount((prev) => Math.max(prev, minRaise));
  }, [minRaise]);

  const handleQuickRaise = (fraction: number) => {
    const amount = Math.floor(pot * fraction);
    setRaiseAmount(Math.min(player.chips, Math.max(minRaise, amount)));
  };

  return (
    <div className="w-full bg-charcoal/95 border-t border-wood/50 p-2 sm:p-3 backdrop-blur-md z-50 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        
        {/* Top Row: Status & Auto Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className={isHumanTurn ? "text-amber font-heading text-sm sm:text-lg leading-none" : "text-cream/50 font-heading text-sm sm:text-lg leading-none"}>
              {isHumanTurn ? 'Your Turn' : 'Waiting...'}
            </span>
            <span className="text-cream/60 text-[10px] sm:text-xs font-bold leading-none">To call: ${toCall}</span>
          </div>
          
          <div className="flex items-center gap-3 text-cream/80 text-[10px] sm:text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoAction === 'check/fold'}
                onChange={() => setAutoAction(autoAction === 'check/fold' ? null : 'check/fold')}
                className="w-3 h-3 accent-amber"
              />
              Auto C/F
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoAction === 'call'}
                onChange={() => setAutoAction(autoAction === 'call' ? null : 'call')}
                className="w-3 h-3 accent-amber"
              />
              Auto Call
            </label>
          </div>
        </div>

        {/* Slider & Quick Raises */}
        <div className="flex flex-col gap-2 bg-black/30 p-1.5 sm:p-2 rounded-md border border-white/5">
          <div className="flex justify-between gap-1 sm:gap-2">
            <button 
              disabled={!isHumanTurn || player.chips <= toCall}
              onClick={() => handleQuickRaise(0.5)}
              className="flex-1 py-1 bg-charcoal/50 hover:bg-charcoal text-cream/70 hover:text-amber text-[10px] sm:text-xs rounded border border-white/10 transition-colors disabled:opacity-50"
            >
              1/2 Pot
            </button>
            <button 
              disabled={!isHumanTurn || player.chips <= toCall}
              onClick={() => handleQuickRaise(0.75)}
              className="flex-1 py-1 bg-charcoal/50 hover:bg-charcoal text-cream/70 hover:text-amber text-[10px] sm:text-xs rounded border border-white/10 transition-colors disabled:opacity-50"
            >
              3/4 Pot
            </button>
            <button 
              disabled={!isHumanTurn || player.chips <= toCall}
              onClick={() => handleQuickRaise(1)}
              className="flex-1 py-1 bg-charcoal/50 hover:bg-charcoal text-cream/70 hover:text-amber text-[10px] sm:text-xs rounded border border-white/10 transition-colors disabled:opacity-50"
            >
              Pot
            </button>
            <button 
              disabled={!isHumanTurn || player.chips <= toCall}
              onClick={() => setRaiseAmount(player.chips)}
              className="flex-1 py-1 bg-charcoal/50 hover:bg-charcoal text-cream/70 hover:text-amber text-[10px] sm:text-xs rounded border border-white/10 transition-colors disabled:opacity-50"
            >
              Max
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cream/50 text-[10px] sm:text-xs font-mono">${minRaise}</span>
            <input
              type="range"
              disabled={!isHumanTurn || player.chips <= toCall}
              min={minRaise}
              max={player.chips}
              step={10}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="flex-1 h-1.5 sm:h-2 bg-charcoal rounded-lg appearance-none cursor-pointer accent-amber disabled:opacity-50"
            />
            <div className="flex items-center">
              <span className="text-amber font-bold text-xs sm:text-sm font-mono">$</span>
              <input
                type="number"
                disabled={!isHumanTurn || player.chips <= toCall}
                min={minRaise}
                max={player.chips}
                value={raiseAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setRaiseAmount(val);
                  }
                }}
                onBlur={() => {
                  setRaiseAmount(Math.min(player.chips, Math.max(minRaise, raiseAmount)));
                }}
                className="w-12 sm:w-16 bg-transparent text-amber font-bold text-xs sm:text-sm text-right font-mono outline-none border-b border-transparent focus:border-amber/50 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between gap-2">
          <button
            disabled={!isHumanTurn}
            onClick={() => onAction('fold')}
            className="flex-1 py-2 sm:py-3 bg-red-900/50 hover:bg-red-900 disabled:opacity-50 disabled:hover:bg-red-900/50 text-red-200 rounded-md font-bold uppercase tracking-wider transition-colors border border-red-900/50 text-[11px] sm:text-sm shadow-sm active:scale-95"
          >
            Fold
          </button>
          
          <button
            disabled={!isHumanTurn}
            onClick={() => onAction('call')}
            className="flex-1 py-2 sm:py-3 bg-wood/50 hover:bg-wood disabled:opacity-50 disabled:hover:bg-wood/50 text-cream rounded-md font-bold uppercase tracking-wider transition-colors border border-wood text-[11px] sm:text-sm shadow-sm active:scale-95"
          >
            {canCheck ? 'Check' : `Call $${toCall}`}
          </button>
          
          <button
            disabled={!isHumanTurn || player.chips <= toCall}
            onClick={() => onAction('raise', raiseAmount)}
            className="flex-1 py-2 sm:py-3 bg-amber/80 hover:bg-amber disabled:opacity-50 disabled:hover:bg-amber/80 text-charcoal rounded-md font-bold uppercase tracking-wider transition-colors border border-amber text-[11px] sm:text-sm shadow-sm active:scale-95"
          >
            Raise ${raiseAmount}
          </button>
        </div>
      </div>
    </div>
  );
}
