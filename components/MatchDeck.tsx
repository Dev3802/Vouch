"use client";

import { deriveScore, scoreTone, vouchesFor } from "@/lib/score";
import { initials, PERSONA_PHOTOS, PERSONA_VERIFIED } from "@/lib/ui";
import VerifiedBadge from "./VerifiedBadge";
import type { Block, DateObj, DateState, Persona } from "@/lib/types";

const TONE_TEXT: Record<string, string> = {
  good: "text-signal",
  neutral: "text-warn",
  bad: "text-danger",
  unknown: "text-mute",
};

const TONE_PILL: Record<string, string> = {
  good: "border-signal/25 bg-signal/10 text-signal",
  neutral: "border-warn/25 bg-warn/10 text-warn",
  bad: "border-danger/25 bg-danger/10 text-danger",
  unknown: "border-edge bg-panel2 text-mute",
};

const STATES: DateState[] = ["proposed", "confirmed", "completed"];

export default function MatchDeck({
  deck,
  dates,
  personasById,
  chain,
  onLike,
  onPass,
  onSelect,
  onAdvance,
  onAttest,
}: {
  deck: Persona[];
  dates: DateObj[];
  personasById: Record<string, Persona>;
  chain: Block[];
  onLike: (p: Persona) => void;
  onPass: (p: Persona) => void;
  onSelect: (p: Persona) => void;
  onAdvance: (d: DateObj) => void;
  onAttest: (d: DateObj) => void;
}) {
  const top = deck[0];

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-sm">
      <header className="border-b border-edge px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-mute">
          Match
        </h2>
      </header>

      <div className="p-4">
        {top ? (
          <div>
            <div className="relative">
              {deck[1] && (
                <div className="pointer-events-none absolute inset-x-2 -bottom-1.5 top-2 rounded-2xl border border-edge bg-panel2" />
              )}
              <TopCard persona={top} chain={chain} onSelect={onSelect} />
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={() => onPass(top)}
                className="rounded-full border border-edge bg-panel px-5 py-2 text-sm text-mute shadow-sm transition-colors hover:border-danger/40 hover:text-danger"
              >
                Pass
              </button>
              <button
                onClick={() => onLike(top)}
                className="blue-gradient rounded-full px-6 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Like
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-edge bg-panel2/60 px-4 py-12 text-center text-sm text-mute">
            No more profiles nearby.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto border-t border-edge px-4 py-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mute">
          Your dates
        </p>
        {dates.length === 0 ? (
          <p className="text-sm text-mute">
            No dates yet. Like someone to match.
          </p>
        ) : (
          <>
          <p className="mb-2 text-[10px] leading-relaxed text-mute/80">
            Unsigned completed dates read as gaps, never as neutral.
          </p>
          <div className="space-y-2">
            {dates.map((d) => {
              const p = personasById[d.personaId];
              return (
                <div
                  key={d.id}
                  className="vouch-pop rounded-xl border border-edge bg-panel2/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelect(p)}
                      className="truncate text-sm font-medium text-ink hover:text-signal"
                    >
                      {p.name}
                    </button>
                    {d.state === "attested" ? (
                      <span className="text-xs font-medium text-signal">
                        Vouched
                      </span>
                    ) : d.state === "completed" ? (
                      <button
                        onClick={() => onAttest(d)}
                        className="blue-gradient rounded-full px-3 py-1 text-xs font-medium text-white hover:opacity-90"
                      >
                        Sign attestation
                      </button>
                    ) : (
                      <button
                        onClick={() => onAdvance(d)}
                        className="rounded-full border border-edge bg-panel px-3 py-1 text-xs text-mute shadow-sm hover:text-ink"
                      >
                        {d.state === "proposed" ? "Confirm date" : "Mark completed"}
                      </button>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {STATES.map((s, i) => {
                      const stateIdx =
                        d.state === "attested" ? 3 : STATES.indexOf(d.state);
                      const active = i <= stateIdx;
                      return (
                        <span
                          key={s}
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            active
                              ? "bg-signal/10 text-signal"
                              : "bg-panel text-mute"
                          }`}
                        >
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </section>
  );
}

function TopCard({
  persona,
  chain,
  onSelect,
}: {
  persona: Persona;
  chain: Block[];
  onSelect: (p: Persona) => void;
}) {
  const vouchCount = vouchesFor(chain, persona.pub).length;
  const score = deriveScore(chain, persona.pub);
  const tone = scoreTone(score, vouchCount);
  const ageBlocks = Math.max(0, chain.length - persona.joinedBlock);

  return (
    <button
      onClick={() => onSelect(persona)}
      className="vouch-pop relative block w-full overflow-hidden rounded-2xl border border-edge bg-panel text-left shadow-sm transition-transform hover:scale-[1.01]"
    >
      <div
        className={`relative flex h-52 items-end overflow-hidden bg-gradient-to-br ${persona.gradient}`}
      >
        {PERSONA_PHOTOS[persona.id] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={PERSONA_PHOTOS[persona.id]}
            alt={persona.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-6xl font-semibold italic text-white/85">
            {initials(persona.name)}
          </span>
        )}
        <div className="relative w-full bg-gradient-to-t from-black/45 to-transparent px-3 pb-2.5 pt-8">
          <span className="font-display text-lg font-medium italic text-white">
            {persona.name}
            {PERSONA_VERIFIED[persona.id] && (
              <VerifiedBadge size={17} className="ml-1.5" />
            )}
            <span className="ml-1.5 font-sans text-sm not-italic text-white/75">
              {persona.age}
            </span>
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between">
          <p className="truncate text-xs text-mute">{persona.bio}</p>
          <span className={`ml-2 font-mono text-sm font-bold ${TONE_TEXT[tone]}`}>
            {tone === "unknown" ? "\u2014" : score}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mute">
          <span
            className={`rounded-full border px-2.5 py-0.5 font-medium ${TONE_PILL[tone]}`}
          >
            {vouchCount} vouches
          </span>
          <span>{ageBlocks} blocks old</span>
          {vouchCount === 0 && (
            <span className="rounded-full border border-warn/25 bg-warn/10 px-2.5 py-0.5 font-medium text-warn">
              unproven
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
