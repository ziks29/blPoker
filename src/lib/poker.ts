import { Hand } from 'pokersolver';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  chips: number;
  cards: Card[];
  currentBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
  hasActed: boolean;
}

export type GamePhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

export function evaluateHand(playerCards: Card[], communityCards: Card[]) {
  const allCards = [...playerCards, ...communityCards].map(c => {
    let suitChar = c.suit.charAt(0).toLowerCase();
    let rankChar = c.rank;
    return `${rankChar}${suitChar}`;
  });
  return Hand.solve(allCards);
}
