import { appendBlock, payloadMessage } from "./chain";
import { pubFromPriv, signMessage } from "./keys";
import type { AttestationType, Block, Persona, VouchPayload } from "./types";

// Deterministic PRNG so the seed history is stable in shape.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const privFor = (i: number) => (i + 1).toString(16).padStart(64, "0");

interface PersonaSpec {
  name: string;
  age: number;
  bio: string;
  gradient: string;
}

// Index 0 = Marcus (trustworthy), 1 = Dana (turns bad), 2 = Riley (brand new).
const SPECS: PersonaSpec[] = [
  {
    name: "Marcus Webb",
    age: 32,
    bio: "Two years of showing up. Ask anyone I've met.",
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    name: "Dana Cole",
    age: 29,
    bio: "Spontaneous. Sometimes too spontaneous.",
    gradient: "from-rose-300 to-red-500",
  },
  {
    name: "Riley Nash",
    age: 27,
    bio: "New here. You'll just have to trust me?",
    gradient: "from-stone-300 to-stone-500",
  },
  {
    name: "Priya Anand",
    age: 30,
    bio: "Coffee dates and long walks, verified on-chain.",
    gradient: "from-violet-300 to-indigo-500",
  },
  {
    name: "Jordan Silva",
    age: 34,
    bio: "Climber, cook, chronically on time.",
    gradient: "from-sky-300 to-blue-600",
  },
  {
    name: "Sofia Marino",
    age: 28,
    bio: "Will judge your bookshelf, kindly.",
    gradient: "from-amber-200 to-orange-400",
  },
  {
    name: "Theo Brandt",
    age: 31,
    bio: "Vinyl, dive bars, honest reviews.",
    gradient: "from-teal-300 to-cyan-600",
  },
  {
    name: "Amara Okafor",
    age: 26,
    bio: "Marathoner. I show up, and early.",
    gradient: "from-indigo-300 to-blue-500",
  },
];

interface SeedEvent {
  from: number;
  to: number;
  attestation: AttestationType;
  bothSigned: boolean;
}

function buildEvents(rng: () => number): SeedEvent[] {
  const TOTAL = 210;
  const slots: (SeedEvent | null)[] = new Array(TOTAL).fill(null);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const othersOf = (exclude: number[]) =>
    [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => i !== 2 && !exclude.includes(i));

  // Dana (1): 12 vouches, good start, three no-shows in a row at the end.
  const danaAtt: AttestationType[] = [
    "endorsed", "showed_up", "endorsed", "showed_up", "endorsed",
    "showed_up", "endorsed", "showed_up", "ghosted",
    "no_show", "no_show", "no_show",
  ];
  // Negative attestations require both keys or they never commit,
  // so every committed negative in the seed history is both-signed.
  const negBothSigned = (att: AttestationType, positiveBoth: boolean) =>
    att === "no_show" || att === "ghosted" ? true : positiveBoth;

  const danaSlots = [14, 29, 44, 58, 72, 88, 105, 126, 150, 181, 194, 206];
  danaSlots.forEach((slot, i) => {
    slots[slot] = {
      from: pick(othersOf([1])),
      to: 1,
      attestation: danaAtt[i],
      bothSigned: negBothSigned(danaAtt[i], true),
    };
  });

  // Marcus (0): 40 vouches spread across the whole history, mostly endorsements.
  const marcusAtt: AttestationType[] = [
    ...Array<AttestationType>(25).fill("endorsed"),
    ...Array<AttestationType>(13).fill("showed_up"),
    "ghosted",
    "showed_up",
  ];
  // shuffle deterministically
  for (let i = marcusAtt.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [marcusAtt[i], marcusAtt[j]] = [marcusAtt[j], marcusAtt[i]];
  }
  let placed = 0;
  for (let slot = 1; slot < TOTAL && placed < 40; slot += 5) {
    let s = slot;
    while (s < TOTAL && slots[s] !== null) s++;
    if (s >= TOTAL) break;
    slots[s] = {
      from: pick(othersOf([0])),
      to: 0,
      attestation: marcusAtt[placed],
      bothSigned: negBothSigned(marcusAtt[placed], rng() < 0.7),
    };
    placed++;
  }

  // Filler: everyone else vouching among themselves. Riley (2) never appears.
  const fillerTargets = [3, 4, 5, 6, 7];
  const fillerAtt: AttestationType[] = [
    "endorsed", "showed_up", "showed_up", "endorsed", "showed_up",
    "ghosted", "endorsed", "showed_up", "no_show", "endorsed",
  ];
  for (let slot = 0; slot < TOTAL; slot++) {
    if (slots[slot] !== null) continue;
    const to = pick(fillerTargets);
    const from = pick(othersOf([to]));
    const attestation = fillerAtt[Math.floor(rng() * fillerAtt.length)];
    slots[slot] = {
      from,
      to,
      attestation,
      bothSigned: negBothSigned(attestation, rng() < 0.6),
    };
  }
  return slots as SeedEvent[];
}

export interface SeedResult {
  personas: Persona[];
  chain: Block[];
}

export function buildSeed(): SeedResult {
  const rng = mulberry32(1337);

  const personas: Persona[] = SPECS.map((spec, i) => {
    const priv = privFor(i);
    return {
      id: `p${i}`,
      ...spec,
      priv,
      pub: pubFromPriv(priv),
      joinedBlock: 0,
    };
  });

  const TWO_YEARS = 730 * 24 * 60 * 60 * 1000;
  const start = Date.now() - TWO_YEARS;
  const events = buildEvents(rng);
  const step = (TWO_YEARS - 3 * 24 * 60 * 60 * 1000) / (events.length + 1);

  let chain: Block[] = appendBlock(
    [],
    { kind: "genesis", note: "Vouch genesis \u2014 reputation you can't reset." },
    "",
    start
  );

  events.forEach((ev, i) => {
    const payload: VouchPayload = {
      kind: "vouch",
      attestation: ev.attestation,
      from: personas[ev.from].pub,
      to: personas[ev.to].pub,
      bothSigned: ev.bothSigned,
    };
    const signature = signMessage(payloadMessage(payload), personas[ev.from].priv);
    const jitter = (rng() - 0.5) * step * 0.8;
    chain = appendBlock(chain, payload, signature, Math.round(start + (i + 1) * step + jitter));
  });

  // joinedBlock = first block a persona appears in. Riley never appears: joined "now".
  personas.forEach((p) => {
    const first = chain.findIndex(
      (b) =>
        b.payload.kind === "vouch" &&
        (b.payload.from === p.pub || b.payload.to === p.pub)
    );
    p.joinedBlock = first === -1 ? chain.length : first;
  });

  return { personas, chain };
}
