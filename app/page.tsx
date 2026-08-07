"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import AttestationModal from "@/components/AttestationModal";
import ChainLedger from "@/components/ChainLedger";
import IdentitySetup from "@/components/IdentitySetup";
import MatchDeck from "@/components/MatchDeck";
import ProfilePanel, { type ProfileSubject } from "@/components/ProfilePanel";
import TopBar from "@/components/TopBar";
import { appendBlock, payloadMessage } from "@/lib/chain";
import { anchorHash, signMessage } from "@/lib/keys";
import { sendMemoTx } from "@/lib/solana";
import { buildSeed } from "@/lib/seed";
import { PERSONA_PHOTOS, PERSONA_VERIFIED } from "@/lib/ui";
import type {
  AttestationType,
  Block,
  DateObj,
  Identity,
  Persona,
  VouchPayload,
} from "@/lib/types";

const LS_IDENTITY = "vouch.identity.v1";
// v3: persona shape changed (no emoji, new gradient palette)
const LS_CHAIN = "vouch.chain.v3";
const LS_PERSONAS = "vouch.personas.v3";

export default function Home() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [ready, setReady] = useState(false);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [chain, setChain] = useState<Block[]>([]);
  const [swiped, setSwiped] = useState<Set<string>>(new Set());
  const [dates, setDates] = useState<DateObj[]>([]);
  const [selectedId, setSelectedId] = useState<string>("p0"); // start on Marcus for the demo
  const [attesting, setAttesting] = useState<DateObj | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // last known-good chain; tampering only ever mutates React state, never this
  const pristineRef = useRef<Block[]>([]);

  useEffect(() => {
    let seededPersonas: Persona[];
    let seededChain: Block[];
    try {
      const storedChain = localStorage.getItem(LS_CHAIN);
      const storedPersonas = localStorage.getItem(LS_PERSONAS);
      if (storedChain && storedPersonas) {
        seededChain = JSON.parse(storedChain);
        seededPersonas = JSON.parse(storedPersonas);
      } else {
        const seed = buildSeed();
        seededPersonas = seed.personas;
        seededChain = seed.chain;
        localStorage.setItem(LS_CHAIN, JSON.stringify(seededChain));
        localStorage.setItem(LS_PERSONAS, JSON.stringify(seededPersonas));
      }
      const storedIdentity = localStorage.getItem(LS_IDENTITY);
      if (storedIdentity) setIdentity(JSON.parse(storedIdentity));
    } catch {
      const seed = buildSeed();
      seededPersonas = seed.personas;
      seededChain = seed.chain;
    }
    setPersonas(seededPersonas);
    setChain(seededChain);
    pristineRef.current = seededChain;
    setReady(true);
  }, []);

  const personasById = useMemo(
    () => Object.fromEntries(personas.map((p) => [p.id, p])),
    [personas]
  );
  const personasByPub = useMemo(
    () => Object.fromEntries(personas.map((p) => [p.pub, p])),
    [personas]
  );

  const nameForKey = (pub: string): string | null => {
    if (identity && pub === identity.pub) return `${identity.name} (you)`;
    return personasByPub[pub]?.name ?? null;
  };

  const deck = personas.filter((p) => !swiped.has(p.id));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const persistChain = (next: Block[]) => {
    pristineRef.current = next;
    try {
      localStorage.setItem(LS_CHAIN, JSON.stringify(next));
    } catch {
      // storage full or unavailable; chain still lives in memory
    }
  };

  const handleLike = (p: Persona) => {
    setSwiped((s) => new Set(s).add(p.id));
    setDates((d) => [
      { id: `d${Date.now()}`, personaId: p.id, state: "proposed", createdAt: Date.now() },
      ...d,
    ]);
    setSelectedId(p.id);
    showToast(`It's a match with ${p.name}. Date proposed.`);
  };

  const handlePass = (p: Persona) => {
    setSwiped((s) => new Set(s).add(p.id));
  };

  const handleAdvance = (d: DateObj) => {
    setDates((ds) =>
      ds.map((x) =>
        x.id === d.id
          ? { ...x, state: x.state === "proposed" ? "confirmed" : "completed" }
          : x
      )
    );
  };

  const commitAttestation = async (
    date: DateObj,
    att: AttestationType
  ): Promise<{ signature: string; counterSignature?: string; blockIndex: number; solanaTxSig?: string }> => {
    const persona = personasById[date.personaId];
    const me = identity!;
    const negative = att === "no_show" || att === "ghosted";

    // Negative attestations require both keys or they never commit.
    // Positives stay one-sided. (Risk register: fixed in scope.)
    const payload: VouchPayload = {
      kind: "vouch",
      attestation: att,
      from: me.pub,
      to: persona.pub,
      bothSigned: negative,
    };
    const signature = signMessage(payloadMessage(payload), me.priv);
    const counterSignature = negative
      ? signMessage(payloadMessage(payload), persona.priv) // co-sign stubbed in demo
      : undefined;
    let next = appendBlock(pristineRef.current, payload, signature);
    const blockIndex = next.length - 1;

    if (!negative) {
      // prompted at the same moment, the counterparty attests back about you
      const back: VouchPayload = {
        kind: "vouch",
        attestation: att === "endorsed" ? "endorsed" : "showed_up",
        from: persona.pub,
        to: me.pub,
        bothSigned: false,
      };
      next = appendBlock(next, back, signMessage(payloadMessage(back), persona.priv));
    }

    // Attempt Solana memo tx -- best-effort, never blocks the local commit
    let solanaTxSig: string | undefined;
    if (connected && publicKey && signTransaction) {
      try {
        solanaTxSig = await sendMemoTx(connection, publicKey, signTransaction, payload);
        // Store tx sig on the attested block
        next = next.map((b, i) =>
          i === blockIndex ? { ...b, solanaTxSig } : b
        );
      } catch {
        // Solana tx failed -- attestation still committed locally
      }
    }

    setChain(next);
    persistChain(next);
    setDates((ds) =>
      ds.map((x) => (x.id === date.id ? { ...x, state: "attested" } : x))
    );
    setSelectedId(date.personaId);
    return { signature, counterSignature, blockIndex, solanaTxSig };
  };

  const handleTamper = (index: number, att: AttestationType) => {
    setChain((c) =>
      c.map((b, i) =>
        i === index && b.payload.kind === "vouch"
          ? { ...b, payload: { ...b.payload, attestation: att } }
          : b
      )
    );
    showToast(`Block #${index} edited. Watch the chain.`);
  };

  const handleReset = () => {
    setChain(pristineRef.current);
    showToast("Chain restored from the honest copy.");
  };

  const resetIdentity = () => {
    try {
      localStorage.removeItem(LS_IDENTITY);
    } catch {
      // ignore
    }
    setConfirmReset(false);
    setIdentity(null);
    setDates([]);
    setSwiped(new Set());
    setSelectedId("p0");
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="vouch-pulse font-mono text-sm text-mute">
          Loading chain{"\u2026"}
        </p>
      </div>
    );
  }

  if (!identity) {
    return (
      <IdentitySetup
        onCreate={(id) => {
          setIdentity(id);
          try {
            localStorage.setItem(LS_IDENTITY, JSON.stringify(id));
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  const selected: ProfileSubject =
    selectedId === "me"
      ? {
          name: identity.name,
          gradient: identity.gradient,
          pub: identity.pub,
          joinedBlock: chain.length,
          isMe: true,
          anchor: identity.anchor,
        }
      : {
          name: personasById[selectedId].name,
          gradient: personasById[selectedId].gradient,
          pub: personasById[selectedId].pub,
          bio: personasById[selectedId].bio,
          age: personasById[selectedId].age,
          joinedBlock: personasById[selectedId].joinedBlock,
          isMe: false,
          // seed personas are anchored by construction; stub hash for display
          anchor: anchorHash(personasById[selectedId].priv),
          photo: PERSONA_PHOTOS[selectedId],
          verified: PERSONA_VERIFIED[selectedId],
        };

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        identity={identity}
        chain={chain}
        onShowMe={() => setSelectedId("me")}
        onResetIdentity={() => setConfirmReset(true)}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[3fr_4fr_3fr] gap-3 p-3">
        <MatchDeck
          deck={deck}
          dates={dates}
          personasById={personasById}
          chain={chain}
          onLike={handleLike}
          onPass={handlePass}
          onSelect={(p) => setSelectedId(p.id)}
          onAdvance={handleAdvance}
          onAttest={(d) => setAttesting(d)}
        />
        <ProfilePanel subject={selected} chain={chain} nameForKey={nameForKey} />
        <ChainLedger
          chain={chain}
          nameForKey={nameForKey}
          onTamper={handleTamper}
          onReset={handleReset}
        />
      </main>

      {attesting && (
        <AttestationModal
          persona={personasById[attesting.personaId]}
          onClose={() => setAttesting(null)}
          onSign={(att) => commitAttestation(attesting, att)}
        />
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div className="vouch-pop w-full max-w-sm rounded-2xl border border-edge bg-panel p-5 shadow-xl">
            <h3 className="font-display text-xl font-semibold italic">
              Delete this key and start fresh?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-mute">
              Your vouches stay on the chain forever {"\u2014"} deleting the
              key doesn&apos;t erase them. The new key starts with zero
              vouches and zero trust. That&apos;s the point.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="rounded-full border border-edge bg-panel px-4 py-2 text-sm text-mute shadow-sm hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={resetIdentity}
                className="rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Delete key & start over
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="vouch-pop fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-signal/30 bg-panel px-5 py-2.5 text-sm text-ink shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
