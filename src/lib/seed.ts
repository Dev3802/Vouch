import { Persona, Attestation, AttestationType } from './types';
import { createGenesisBlock, appendBlock } from './chain';

// Deterministic fake pubkeys for seed personas
const KEYS = {
  marcus: '7Mrc1s2x9KqPvBz3nFhJ4dR8wYtG6uAe5mXs2L9NoPQ',
  jordan: '3Jrd4n5x7KmQrCz1nDhK6eS0wXtH8vBf2mYs4N1RqPQ',
  alex:   '9Alx2s4x6KnRsEz8nGiL5fT9wZuI7wCg1mWs3P2SrPQ',
  priya:  '5Pry4a6x8LoStFz0nHjM4gU8wAvJ6xDh0mUs5Q3TsPQ',
  sam:    '2Sam1s3x5KpTuGz2nIkN3hV7wBwK5yEi9mTs6R4UsPQ',
  riley:  '8Rly3s5x7LqUvHz4nJlO2iW6wCxL4zFj8mSs7S5VsPQ',
  taylor: '4Tyl2s4x6KrVwIz6nKmP1jX5wDyM3aGk7mRs8T6WsPQ',
  casey:  '6Csy1s3x5KsWxJz8nLnQ0kY4wEzN2bHl6mQs9U7XsPQ',
};

function buildHistory(
  targetKey: string,
  interactions: { from: string; type: AttestationType }[],
  startTime: number,
  blockGap: number
) {
  let chain = [createGenesisBlock()];
  interactions.forEach((int, i) => {
    const attestation: Attestation = {
      type: int.type,
      from: int.from,
      to: targetKey,
      dateId: `date-${i + 1}`,
      timestamp: startTime + (i * blockGap),
    };
    chain = appendBlock(chain, attestation);
  });
  return chain;
}

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const START = Date.now() - TWO_YEARS_MS;
const GAP = Math.floor(TWO_YEARS_MS / 200);

// Marcus: 40 vouches, mostly endorsements. Score = 50 + (30*10) + (10*5) = 400
const marcusInteractions = [
  ...Array(30).fill(null).map((_, i) => ({
    from: [KEYS.priya, KEYS.riley, KEYS.casey, KEYS.sam][i % 4],
    type: 'endorsed' as AttestationType,
  })),
  ...Array(10).fill(null).map((_, i) => ({
    from: [KEYS.taylor, KEYS.jordan, KEYS.alex, KEYS.priya][i % 4],
    type: 'showed_up' as AttestationType,
  })),
];

// Jordan: 12 vouches, starts good, then 3 no-shows. Score = 50 + (6*10) + (3*5) + (3*-20) = 65
const jordanInteractions = [
  ...Array(6).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.riley][i % 3],
    type: 'endorsed' as AttestationType,
  })),
  ...Array(3).fill(null).map((_, i) => ({
    from: [KEYS.casey, KEYS.sam, KEYS.taylor][i % 3],
    type: 'showed_up' as AttestationType,
  })),
  ...Array(3).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.riley][i % 3],
    type: 'no_show' as AttestationType,
  })),
];

// Priya: 25 showed_up. Score = 50 + (25*5) = 175
const priyaInteractions = Array(25).fill(null).map((_, i) => ({
  from: [KEYS.marcus, KEYS.jordan, KEYS.riley, KEYS.casey, KEYS.sam][i % 5],
  type: 'showed_up' as AttestationType,
}));

// Sam: 8 mixed. Score = 50 + (3*10) + (3*5) + (1*-20) + (1*-10) = 75
const samInteractions = [
  ...Array(3).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.riley][i % 3],
    type: 'endorsed' as AttestationType,
  })),
  ...Array(3).fill(null).map((_, i) => ({
    from: [KEYS.casey, KEYS.taylor, KEYS.jordan][i % 3],
    type: 'showed_up' as AttestationType,
  })),
  { from: KEYS.marcus, type: 'no_show' as AttestationType },
  { from: KEYS.priya, type: 'ghosted' as AttestationType },
];

// Riley: 15 heavy on endorsements. Score = 50 + (12*10) + (3*5) = 185
const rileyInteractions = [
  ...Array(12).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.casey, KEYS.sam][i % 4],
    type: 'endorsed' as AttestationType,
  })),
  ...Array(3).fill(null).map((_, i) => ({
    from: [KEYS.jordan, KEYS.taylor, KEYS.marcus][i % 3],
    type: 'showed_up' as AttestationType,
  })),
];

// Taylor: 5 vouches, one ghosted. Score = 50 + (3*5) + (1*10) + (1*-10) = 65
const taylorInteractions = [
  ...Array(3).fill(null).map(() => ({ from: KEYS.sam, type: 'showed_up' as AttestationType })),
  { from: KEYS.riley, type: 'endorsed' as AttestationType },
  { from: KEYS.marcus, type: 'ghosted' as AttestationType },
];

// Casey: 18 steady positive. Score = 50 + (10*5) + (8*10) = 180
const caseyInteractions = [
  ...Array(10).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.riley, KEYS.sam, KEYS.taylor][i % 5],
    type: 'showed_up' as AttestationType,
  })),
  ...Array(8).fill(null).map((_, i) => ({
    from: [KEYS.marcus, KEYS.priya, KEYS.riley, KEYS.jordan][i % 4],
    type: 'endorsed' as AttestationType,
  })),
];

export const PERSONAS: Persona[] = [
  { name: 'Marcus', pubkey: KEYS.marcus, avatar: 'M', bio: 'Two years of trust, every vouch signed.', chain: buildHistory(KEYS.marcus, marcusInteractions, START, GAP) },
  { name: 'Jordan', pubkey: KEYS.jordan, avatar: 'J', bio: 'Started strong. Then stopped showing up.', chain: buildHistory(KEYS.jordan, jordanInteractions, START, GAP) },
  { name: 'Alex', pubkey: KEYS.alex, avatar: 'A', bio: 'Brand new here.', chain: [createGenesisBlock()] },
  { name: 'Priya', pubkey: KEYS.priya, avatar: 'P', bio: 'Always shows up. Every single time.', chain: buildHistory(KEYS.priya, priyaInteractions, START, GAP) },
  { name: 'Sam', pubkey: KEYS.sam, avatar: 'S', bio: 'Some good days, some bad days.', chain: buildHistory(KEYS.sam, samInteractions, START, GAP) },
  { name: 'Riley', pubkey: KEYS.riley, avatar: 'R', bio: 'People remember Riley fondly.', chain: buildHistory(KEYS.riley, rileyInteractions, START, GAP) },
  { name: 'Taylor', pubkey: KEYS.taylor, avatar: 'T', bio: 'New-ish. Building a record.', chain: buildHistory(KEYS.taylor, taylorInteractions, START, GAP) },
  { name: 'Casey', pubkey: KEYS.casey, avatar: 'C', bio: 'Steady. Consistent. Trustworthy.', chain: buildHistory(KEYS.casey, caseyInteractions, START, GAP) },
];

export function getPersona(pubkey: string): Persona | undefined {
  return PERSONAS.find(p => p.pubkey === pubkey);
}
