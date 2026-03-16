import { useReducer, useEffect, useCallback } from 'react';
import { createDeck, shuffleDeck, Card, Player, GamePhase, evaluateHand } from '../lib/poker';
import { Hand } from 'pokersolver';
import { sounds } from '../lib/audio';

export type GameState = {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  phase: GamePhase;
  activePlayerIndex: number;
  dealerIndex: number;
  winners: { player: Player; description: string }[];
  logs: string[];
  smallBlind: number;
  bigBlind: number;
};

type Action =
  | { type: 'INIT'; numPlayers: number }
  | { type: 'START_HAND' }
  | { type: 'PLAYER_ACTION'; playerId: string; action: 'fold' | 'call' | 'raise'; amount?: number }
  | { type: 'END_HAND' };

function getNextPhase(phase: GamePhase): GamePhase {
  if (phase === 'preflop') return 'flop';
  if (phase === 'flop') return 'turn';
  if (phase === 'turn') return 'river';
  return 'showdown';
}

function processShowdown(state: GameState, players: Player[], pot: number): GameState {
  const notFolded = players.filter(p => !p.hasFolded);
  let winners: { player: Player; description: string }[] = [];
  
  if (notFolded.length === 1) {
    winners = [{ player: notFolded[0], description: 'Everyone else folded' }];
  } else {
    const evaluated = notFolded.map(p => {
      const hand = evaluateHand(p.cards, state.communityCards);
      return { player: p, hand };
    });
    
    const hands = evaluated.map(e => e.hand);
    const winningHands = Hand.winners(hands);
    
    // Find winners by matching hand objects
    winners = evaluated
      .filter(e => winningHands.some((wh: any) => wh === e.hand))
      .map(e => ({ player: e.player, description: e.hand.name }));
  }

  const newPlayers = [...players];
  const winAmount = Math.floor(pot / winners.length);
  for (const w of winners) {
    const pIndex = newPlayers.findIndex(p => p.id === w.player.id);
    newPlayers[pIndex].chips += winAmount;
  }

  return {
    ...state,
    players: newPlayers,
    phase: 'showdown',
    winners,
    pot,
    logs: [...state.logs, `Showdown! ${winners.map(w => w.player.name).join(', ')} wins ${winAmount}.`],
  };
}

function processNextPhase(state: GameState, players: Player[], pot: number): GameState {
  const newPlayers = players.map(p => ({ ...p, currentBet: 0, hasActed: false }));
  const newDeck = [...state.deck];
  const newCommunity = [...state.communityCards];
  let log = '';

  if (state.phase === 'preflop') {
    newCommunity.push(newDeck.pop()!, newDeck.pop()!, newDeck.pop()!);
    log = 'Flop dealt.';
  } else if (state.phase === 'flop' || state.phase === 'turn') {
    newCommunity.push(newDeck.pop()!);
    log = state.phase === 'flop' ? 'Turn dealt.' : 'River dealt.';
  }

  let nextIndex = (state.dealerIndex + 1) % newPlayers.length;
  let loopCount = 0;
  while ((newPlayers[nextIndex].hasFolded || newPlayers[nextIndex].isAllIn) && loopCount < newPlayers.length) {
    nextIndex = (nextIndex + 1) % newPlayers.length;
    loopCount++;
  }

  const canAct = newPlayers.filter(p => !p.hasFolded && !p.isAllIn).length;
  if (canAct < 2) {
    while (newCommunity.length < 5) {
      newCommunity.push(newDeck.pop()!);
    }
    return processShowdown({ ...state, deck: newDeck, communityCards: newCommunity }, newPlayers, pot);
  }

  return {
    ...state,
    players: newPlayers,
    deck: newDeck,
    communityCards: newCommunity,
    currentBet: 0,
    pot,
    phase: getNextPhase(state.phase),
    activePlayerIndex: nextIndex,
    logs: [...state.logs, log],
  };
}

function pokerReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'INIT': {
      const initialPlayers: Player[] = Array.from({ length: action.numPlayers }).map((_, i) => ({
        id: `p${i}`,
        name: i === 0 ? 'You' : `Player ${i + 1}`,
        isHuman: i === 0,
        chips: 1000,
        cards: [],
        currentBet: 0,
        hasFolded: false,
        isAllIn: false,
        hasActed: false,
      }));
      return {
        players: initialPlayers,
        deck: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
        phase: 'idle',
        activePlayerIndex: -1,
        dealerIndex: 0,
        winners: [],
        logs: ['Game initialized.'],
        smallBlind: 10,
        bigBlind: 20,
      };
    }
    case 'START_HAND': {
      let deck = shuffleDeck(createDeck());
      const players = state.players.map(p => ({
        ...p,
        cards: [deck.pop()!, deck.pop()!],
        currentBet: 0,
        hasFolded: p.chips === 0,
        isAllIn: p.chips === 0,
        hasActed: false,
      }));

      const numActive = players.filter(p => !p.hasFolded).length;
      if (numActive < 2) return state;

      const sbIndex = (state.dealerIndex + 1) % players.length;
      const bbIndex = (state.dealerIndex + 2) % players.length;
      
      let pot = 0;
      const sbAmount = Math.min(players[sbIndex].chips, state.smallBlind);
      players[sbIndex].chips -= sbAmount;
      players[sbIndex].currentBet = sbAmount;
      if (players[sbIndex].chips === 0) players[sbIndex].isAllIn = true;
      pot += sbAmount;

      const bbAmount = Math.min(players[bbIndex].chips, state.bigBlind);
      players[bbIndex].chips -= bbAmount;
      players[bbIndex].currentBet = bbAmount;
      if (players[bbIndex].chips === 0) players[bbIndex].isAllIn = true;
      pot += bbAmount;

      const activePlayerIndex = (state.dealerIndex + 3) % players.length;

      return {
        ...state,
        players,
        deck,
        communityCards: [],
        pot,
        currentBet: state.bigBlind,
        phase: 'preflop',
        activePlayerIndex,
        winners: [],
        logs: ['Hand started. Blinds posted.'],
      };
    }
    case 'PLAYER_ACTION': {
      const { playerId, action: playerAction, amount } = action;
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex !== state.activePlayerIndex) return state;

      const player = state.players[playerIndex];
      const newPlayers = [...state.players];
      let newPot = state.pot;
      let newCurrentBet = state.currentBet;
      let log = '';

      if (playerAction === 'fold') {
        newPlayers[playerIndex] = { ...player, hasFolded: true, hasActed: true };
        log = `${player.name} folds.`;
      } else if (playerAction === 'call') {
        const callAmount = Math.min(player.chips, state.currentBet - player.currentBet);
        newPlayers[playerIndex] = {
          ...player,
          chips: player.chips - callAmount,
          currentBet: player.currentBet + callAmount,
          hasActed: true,
          isAllIn: player.chips - callAmount === 0,
        };
        newPot += callAmount;
        log = callAmount === 0 ? `${player.name} checks.` : `${player.name} calls ${callAmount}.`;
      } else if (playerAction === 'raise') {
        const raiseAmount = amount || (state.currentBet * 2);
        const totalBet = Math.min(player.chips + player.currentBet, raiseAmount);
        const addedAmount = totalBet - player.currentBet;
        
        newPlayers[playerIndex] = {
          ...player,
          chips: player.chips - addedAmount,
          currentBet: totalBet,
          hasActed: true,
          isAllIn: player.chips - addedAmount === 0,
        };
        newPot += addedAmount;
        newCurrentBet = totalBet;
        
        for (let i = 0; i < newPlayers.length; i++) {
          if (i !== playerIndex && !newPlayers[i].hasFolded && !newPlayers[i].isAllIn) {
            newPlayers[i].hasActed = false;
          }
        }
        log = `${player.name} raises to ${totalBet}.`;
      }

      const activePlayers = newPlayers.filter(p => !p.hasFolded && !p.isAllIn);
      const allActed = activePlayers.every(p => p.hasActed);
      const betsMatched = activePlayers.every(p => p.currentBet === newCurrentBet);
      const notFolded = newPlayers.filter(p => !p.hasFolded);

      const stateWithLogs = { ...state, logs: [...state.logs, log] };

      if (notFolded.length === 1) {
        return processShowdown(stateWithLogs, newPlayers, newPot);
      } else if (allActed && betsMatched) {
        if (state.phase === 'river') {
          return processShowdown(stateWithLogs, newPlayers, newPot);
        } else {
          return processNextPhase(stateWithLogs, newPlayers, newPot);
        }
      } else {
        let nextIndex = (state.activePlayerIndex + 1) % newPlayers.length;
        while (newPlayers[nextIndex].hasFolded || newPlayers[nextIndex].isAllIn) {
          nextIndex = (nextIndex + 1) % newPlayers.length;
        }
        return {
          ...stateWithLogs,
          players: newPlayers,
          pot: newPot,
          currentBet: newCurrentBet,
          activePlayerIndex: nextIndex,
        };
      }
    }
    case 'END_HAND': {
      return {
        ...state,
        phase: 'idle',
        pot: 0,
        dealerIndex: (state.dealerIndex + 1) % state.players.length,
        winners: [],
        communityCards: [],
        logs: [...state.logs, 'Hand ended. Ready for next hand.'],
      };
    }
    default:
      return state;
  }
}

export function usePokerGame(numPlayers: number = 9) {
  const [state, dispatch] = useReducer(pokerReducer, {
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    phase: 'idle',
    activePlayerIndex: -1,
    dealerIndex: 0,
    winners: [],
    logs: [],
    smallBlind: 10,
    bigBlind: 20,
  });

  useEffect(() => {
    dispatch({ type: 'INIT', numPlayers });
  }, [numPlayers]);

  const startHand = useCallback(() => {
    sounds.deal();
    dispatch({ type: 'START_HAND' });
  }, []);
  
  const endHand = useCallback(() => dispatch({ type: 'END_HAND' }), []);
  
  const playerAction = useCallback((playerId: string, action: 'fold' | 'call' | 'raise', amount?: number) => {
    if (action === 'fold') sounds.fold();
    else sounds.bet();
    dispatch({ type: 'PLAYER_ACTION', playerId, action, amount });
  }, []);

  // Sound effects for phase changes
  useEffect(() => {
    if (state.phase === 'flop' || state.phase === 'turn' || state.phase === 'river') {
      sounds.deal();
    } else if (state.phase === 'showdown' && state.winners.length > 0) {
      sounds.win();
    }
  }, [state.phase, state.winners]);

  // AI Logic
  useEffect(() => {
    if (state.phase === 'idle' || state.phase === 'showdown') return;

    const activePlayer = state.players[state.activePlayerIndex];
    if (activePlayer && !activePlayer.isHuman && !activePlayer.hasFolded && !activePlayer.isAllIn) {
      const timer = setTimeout(() => {
        const toCall = state.currentBet - activePlayer.currentBet;
        if (toCall === 0) {
          if (Math.random() < 0.1) {
            playerAction(activePlayer.id, 'raise', state.currentBet + state.bigBlind * 2);
          } else {
            playerAction(activePlayer.id, 'call');
          }
        } else {
          if (toCall > activePlayer.chips * 0.5) {
            if (Math.random() < 0.8) playerAction(activePlayer.id, 'fold');
            else playerAction(activePlayer.id, 'call');
          } else {
            const rand = Math.random();
            if (rand < 0.2) playerAction(activePlayer.id, 'fold');
            else if (rand < 0.3) playerAction(activePlayer.id, 'raise', state.currentBet + state.bigBlind * 2);
            else playerAction(activePlayer.id, 'call');
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.phase, state.activePlayerIndex, state.players, state.currentBet, playerAction, state.bigBlind]);

  return { state, startHand, endHand, playerAction };
}
