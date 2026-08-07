"use client";

import { useState } from "react";
import ScoreRing from "./ScoreRing";
import VerifiedBadge from "./VerifiedBadge";
import VouchRow from "./VouchRow";
import { shortKey } from "@/lib/keys";
import { accountAgeBlocks, deriveScore, scoreTone, vouchesFor } from "@/lib/score";
import { initials } from "@/lib/ui";
import type { Block, VouchPayload } from "@/lib/types";

export interface ProfileSubject {
  name: string;
  gradient: string;
  pub: string;
  bio?: string;
  age?: number;
  joinedBlock: number;
  isMe: boolean;
  /** Salted hash of the sybil anchor. One key per anchor. */
  anchor?: string;
  photo?: string;
  verified?: boolean;
}

export default function ProfilePanel({
  subject,
  chain,
  nameForKey,
}: {
  subject: ProfileSubject;
  chain: Block[];
  nameForKey: (pub: string) => string | null;
}) {
  const [copied, setCopied] = useState(false);
  const vouches = vouchesFor(chain, subject.pub);
  const score = deriveScore(chain, subject.pub);
  const tone = scoreTone(score, vouches.length);
  const ageBlocks = accountAgeBlocks(chain, subject.joinedBlock);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(subject.pub);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable; ignore
    }
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-sm">
      <header className="border-b border-edge px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-mute">
          Profile
        </h2>
      </header>

      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br font-display text-2xl font-semibold italic text-white ${subject.gradient}`}
        >
          {subject.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={subject.photo}
              alt={subject.name}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            initials(subject.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-display text-xl font-semibold italic">
            <span className="truncate">{subject.name}</span>
            {subject.verified && <VerifiedBadge size={18} className="shrink-0" />}
            {subject.age ? (
              <span className="shrink-0 font-sans text-base font-normal not-italic text-mute">
                {subject.age}
              </span>
            ) : null}
            {subject.isMe && (
              <span className="shrink-0 rounded-full border border-edge bg-panel2 px-2 py-0.5 font-sans text-[10px] font-medium uppercase not-italic tracking-wider text-mute">
                you
              </span>
            )}
          </h3>
          {subject.bio && (
            <p className="mt-0.5 truncate text-sm text-mute">{subject.bio}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <button
              onClick={copyKey}
              title="Copy public key"
              className="rounded-full border border-edge bg-panel2 px-2.5 py-0.5 font-mono text-[11px] text-mute transition-colors hover:text-ink"
            >
              {copied ? "copied" : shortKey(subject.pub, 10)}
            </button>
            {subject.anchor ? (
              <span
                title="Key anchored to a salted phone hash. One key per person; a reset costs the anchor."
                className="rounded-full border border-signal/25 bg-signal/10 px-2.5 py-0.5 font-mono text-[10px] text-signal"
              >
                anchored {shortKey(subject.anchor, 6)}
              </span>
            ) : (
              <span
                title="No sybil anchor bound to this key."
                className="rounded-full border border-warn/25 bg-warn/10 px-2.5 py-0.5 font-mono text-[10px] text-warn"
              >
                unanchored
              </span>
            )}
          </div>
        </div>
        <ScoreRing score={score} tone={tone} size={80} stroke={6} />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <div className="rounded-xl border border-edge bg-panel2/70 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-mute">Vouches</p>
          <p className="text-lg font-semibold">{vouches.length}</p>
        </div>
        <div className="rounded-xl border border-edge bg-panel2/70 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-mute">
            Account age
          </p>
          <p className="text-lg font-semibold">
            {ageBlocks}
            <span className="ml-1 text-xs font-normal text-mute">blocks</span>
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mute">
          Signed history
        </p>
        {vouches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-edge bg-panel2/50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink">No vouches.</p>
            <p className="mt-1 text-sm text-mute">
              This account is new or was recently reset.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...vouches].reverse().map((b) => (
              <VouchRow
                key={b.index}
                block={b}
                counterpartyName={nameForKey((b.payload as VouchPayload).from)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
