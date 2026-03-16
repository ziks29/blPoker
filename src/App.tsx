import { usePokerGame } from './hooks/usePokerGame';
import { Table } from './components/Table';
import { Controls } from './components/Controls';
import { useEffect, useRef, useState } from 'react';
import { sounds } from './lib/audio';

export default function App() {
  const { state, startHand, endHand, playerAction } = usePokerGame(9);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoAction, setAutoAction] = useState<'check/fold' | 'call' | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.logs]);

  const humanPlayer = state.players[0];
  const isHumanTurn = state.activePlayerIndex === 0 && state.phase !== 'idle' && state.phase !== 'showdown';

  useEffect(() => {
    if (isHumanTurn && humanPlayer && autoAction) {
      const toCall = state.currentBet - humanPlayer.currentBet;
      const timer = setTimeout(() => {
        if (autoAction === 'check/fold') {
          if (toCall === 0) {
            playerAction(humanPlayer.id, 'call');
          } else {
            playerAction(humanPlayer.id, 'fold');
          }
        } else if (autoAction === 'call') {
          playerAction(humanPlayer.id, 'call');
        }
        setAutoAction(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isHumanTurn, humanPlayer, autoAction, state.currentBet, playerAction]);

  const handleStartHand = () => {
    sounds.init();
    setAutoAction(null);
    startHand();
  };

  return (
    <div className="h-[100dvh] bg-charcoal text-cream font-body overflow-hidden flex flex-col relative w-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,162,90,0.1)_0%,transparent_70%)] pointer-events-none" />

      <main className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 w-full">
        {state.phase === 'idle' ? (
          <div className="text-center space-y-4 sm:space-y-8 z-10">
            <button
              onClick={handleStartHand}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-amber hover:bg-amber/90 text-charcoal rounded-sm font-heading text-xl sm:text-2xl tracking-wider transition-all shadow-[0_0_20px_rgba(212,162,90,0.3)] hover:shadow-[0_0_30px_rgba(212,162,90,0.5)]"
            >
              Deal Hand
            </button>
            {state.winners.length > 0 && (
              <div className="text-amber font-bold text-sm sm:text-xl px-4">
                Last Hand: {state.winners.map(w => w.player.name).join(', ')} won with {state.winners[0].description}
              </div>
            )}
          </div>
        ) : (
          <Table
            players={state.players}
            communityCards={state.communityCards}
            pot={state.pot}
            activePlayerIndex={state.activePlayerIndex}
            dealerIndex={state.dealerIndex}
            phase={state.phase}
            winners={state.winners}
          />
        )}

        {/* Game Logs */}
        <div className="absolute top-4 left-4 w-64 h-48 overflow-y-auto bg-charcoal/80 border border-wood/30 rounded-md p-3 text-xs text-cream/70 font-mono hidden md:block">
          {state.logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </main>

      {humanPlayer && state.phase !== 'idle' && state.phase !== 'showdown' && (
        <Controls
          player={humanPlayer}
          currentBet={state.currentBet}
          pot={state.pot}
          onAction={(action, amount) => playerAction(humanPlayer.id, action, amount)}
          isHumanTurn={isHumanTurn}
          autoAction={autoAction}
          setAutoAction={setAutoAction}
        />
      )}
      
      {state.phase === 'showdown' && (
        <div className="w-full bg-charcoal/90 border-t border-wood/50 p-2 sm:p-4 backdrop-blur-md z-50 flex justify-center shrink-0">
          <button
            onClick={endHand}
            className="px-6 py-2 sm:px-8 sm:py-3 bg-amber hover:bg-amber/90 text-charcoal rounded-sm font-heading text-lg sm:text-xl tracking-wider transition-all"
          >
            Next Hand
          </button>
        </div>
      )}
    </div>
  );
}
