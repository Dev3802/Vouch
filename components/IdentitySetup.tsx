"use client";

import { useState } from "react";
import { appendBlock, payloadMessage } from "@/lib/chain";
import { anchorHash, generateKeypair, shortKey, signMessage } from "@/lib/keys";
import { initials } from "@/lib/ui";
import type { Block, Identity, IdentityPayload } from "@/lib/types";

const GRADIENTS: string[] = [
  "from-blue-400 to-indigo-600",
  "from-sky-300 to-blue-600",
  "from-violet-300 to-indigo-500",
  "from-stone-300 to-stone-500",
  "from-rose-300 to-red-500",
  "from-amber-200 to-orange-400",
  "from-teal-300 to-cyan-600",
  "from-indigo-300 to-blue-500",
];

/** Short onboarding questions — each has its own Continue. */
const QUESTIONS = [
  {
    id: "intent",
    prompt: "What brings you to Vouch?",
    options: [
      "I want dates with people who show up",
      "I want a reputation I can take with me",
      "I\u2019m here to see how the chain works",
    ],
  },
  {
    id: "reset",
    prompt: "If someone ghosts you, then deletes their account\u2026",
    options: [
      "Their history should still count against a new key",
      "They should get a blank slate",
      "I\u2019m not sure yet",
    ],
  },
] as const;

type Step = "phone" | "minting" | "id" | "questions" | "profile";

export default function IdentitySetup({
  chain,
  onComplete,
}: {
  chain: Block[];
  onComplete: (identity: Identity, nextChain: Block[]) => void;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [keys, setKeys] = useState<{ priv: string; pub: string } | null>(null);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [nextChain, setNextChain] = useState<Block[] | null>(null);
  const [blockIndex, setBlockIndex] = useState<number | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [gradient, setGradient] = useState(0);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 7;

  const mintIdentity = () => {
    if (!phoneValid) return;
    setStep("minting");
    // Brief beat so the chain write is visible as a moment
    window.setTimeout(() => {
      const kp = generateKeypair();
      const hashed = anchorHash(phone);
      const payload: IdentityPayload = {
        kind: "identity",
        pub: kp.pub,
        anchor: hashed,
      };
      const signature = signMessage(payloadMessage(payload), kp.priv);
      const updated = appendBlock(chain, payload, signature);
      setKeys(kp);
      setAnchor(hashed);
      setNextChain(updated);
      setBlockIndex(updated.length - 1);
      setStep("id");
    }, 900);
  };

  const finish = () => {
    if (!keys || !anchor || !nextChain || !name.trim()) return;
    onComplete(
      {
        name: name.trim(),
        gradient: GRADIENTS[gradient],
        pub: keys.pub,
        priv: keys.priv,
        anchor,
      },
      nextChain
    );
  };

  const question = QUESTIONS[qIndex];
  const stepLabel =
    step === "phone" || step === "minting"
      ? "1 of 4"
      : step === "id"
        ? "2 of 4"
        : step === "questions"
          ? "3 of 4"
          : "4 of 4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-4xl font-semibold italic tracking-tight">
          Vouch<span className="text-signal">.</span>
        </h1>
        <p className="mt-1.5 text-sm text-mute">
          Dating reputation you can&apos;t reset.
        </p>

        <div className="vouch-pop mt-8 rounded-2xl border border-edge bg-panel p-6 text-left shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-mute">
            Step {stepLabel}
          </p>

          {step === "phone" && (
            <>
              <h2 className="mt-1 font-display text-xl font-semibold italic">
                Enter your phone number
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">
                We derive a salted hash and write a unique identity block to the
                chain. Your number never leaves this device {"\u2014"} only the
                hash does.
              </p>
              <label className="mt-4 block text-[10px] uppercase tracking-widest text-mute">
                Phone number
              </label>
              <input
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                inputMode="tel"
                className="mt-1 w-full rounded-lg border border-edge bg-panel2/60 px-3 py-2 text-sm outline-none placeholder:text-mute/60 focus:border-signal/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phoneValid) mintIdentity();
                }}
              />
              {phoneValid && (
                <p className="mt-1.5 font-mono text-[10px] text-mute">
                  preview anchor{" "}
                  <span className="text-signal">
                    {shortKey(anchorHash(phone), 16)}
                  </span>
                </p>
              )}
              <button
                disabled={!phoneValid}
                onClick={mintIdentity}
                className="blue-gradient mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Continue
              </button>
            </>
          )}

          {step === "minting" && (
            <div className="py-10 text-center">
              <p className="vouch-pulse font-mono text-sm text-signal">
                Writing your identity to the chain{"\u2026"}
              </p>
              <p className="mt-2 text-xs text-mute">
                Keypair + phone anchor {"\u2192"} unique block
              </p>
            </div>
          )}

          {step === "id" && keys && anchor && (
            <>
              <h2 className="mt-1 font-display text-xl font-semibold italic">
                Your identity is on the chain
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-mute">
                This ID is yours. A new phone cannot claim a free blank slate
                while this anchor exists.
              </p>
              <div className="mt-4 space-y-2 rounded-xl border border-edge bg-panel2/50 p-3">
                <Row label="Block" value={`#${blockIndex}`} />
                <Row label="Public key" value={shortKey(keys.pub, 20)} mono />
                <Row label="Anchor" value={shortKey(anchor, 20)} mono />
              </div>
              <button
                onClick={() => setStep("questions")}
                className="blue-gradient mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Continue
              </button>
            </>
          )}

          {step === "questions" && question && (
            <>
              <h2 className="mt-1 font-display text-xl font-semibold italic">
                {question.prompt}
              </h2>
              <p className="mt-1 text-xs text-mute">
                Question {qIndex + 1} of {QUESTIONS.length}
              </p>
              <div className="mt-4 space-y-2">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [question.id]: opt }))
                      }
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-signal bg-signal/10 text-ink"
                          : "border-edge bg-panel2/40 text-mute hover:border-mute hover:text-ink"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={!answers[question.id]}
                onClick={() => {
                  if (qIndex < QUESTIONS.length - 1) {
                    setQIndex((i) => i + 1);
                  } else {
                    setStep("profile");
                  }
                }}
                className="blue-gradient mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Continue
              </button>
            </>
          )}

          {step === "profile" && (
            <>
              <h2 className="mt-1 font-display text-xl font-semibold italic">
                How should matches see you?
              </h2>
              <p className="mt-1.5 text-sm text-mute">
                Then you land on Match, Profile, and Chain {"\u2014"} with your
                new identity block already in the ledger.
              </p>
              <label className="mt-4 block text-[10px] uppercase tracking-widest text-mute">
                Display name
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should matches call you?"
                className="mt-1 w-full rounded-lg border border-edge bg-panel2/60 px-3 py-2 text-sm outline-none placeholder:text-mute/60 focus:border-signal/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) finish();
                }}
              />
              <p className="mt-4 text-[10px] uppercase tracking-widest text-mute">
                Profile color
              </p>
              <div className="mt-1.5 grid grid-cols-8 gap-1.5">
                {GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setGradient(i)}
                    className={`flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br text-xs font-semibold text-white transition-transform ${g} ${
                      gradient === i
                        ? "scale-110 ring-2 ring-signal ring-offset-1 ring-offset-panel"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {name.trim() ? initials(name) : ""}
                  </button>
                ))}
              </div>
              <button
                disabled={!name.trim()}
                onClick={finish}
                className="blue-gradient mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Continue to Match
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-mute">{label}</span>
      <span className={`truncate text-ink ${mono ? "font-mono text-signal" : ""}`}>
        {value}
      </span>
    </div>
  );
}
