"use client";

import { useEffect, useState } from "react";
import { anchorHash, generateKeypair, shortKey } from "@/lib/keys";
import { initials } from "@/lib/ui";
import type { Identity } from "@/lib/types";

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

export default function IdentitySetup({
  onCreate,
}: {
  onCreate: (identity: Identity) => void;
}) {
  const [keys, setKeys] = useState<{ priv: string; pub: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gradient, setGradient] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setKeys(generateKeypair()), 900);
    const t2 = setTimeout(() => setRevealed(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 7;
  const anchor = phoneValid ? anchorHash(phone) : null;
  const canEnter = Boolean(name.trim() && phoneValid && keys);

  const create = () => {
    if (!canEnter || !keys || !anchor) return;
    onCreate({
      name: name.trim(),
      gradient: GRADIENTS[gradient],
      ...keys,
      anchor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display text-4xl font-semibold italic tracking-tight">
          Vouch<span className="text-signal">.</span>
        </h1>
        <p className="mt-1.5 text-sm text-mute">
          Dating reputation you can&apos;t reset.
        </p>

        <div className="vouch-pop mt-8 rounded-2xl border border-edge bg-panel p-6 shadow-sm">
          {!revealed ? (
            <div className="py-8">
              <p className="vouch-pulse font-mono text-sm text-signal">
                Generating your keypair{"\u2026"}
              </p>
              <p className="mt-2 text-xs text-mute">
                No email. No password. This key is your account.
              </p>
            </div>
          ) : (
            <div className="vouch-pop text-left">
              <p className="text-[10px] uppercase tracking-widest text-mute">
                Your key
              </p>
              <p className="mt-1 break-all rounded-lg border border-edge bg-panel2/60 p-2 font-mono text-[11px] text-signal">
                {keys ? shortKey(keys.pub, 24) : ""}
              </p>

              <label className="mt-4 block text-[10px] uppercase tracking-widest text-mute">
                Phone number
              </label>
              <input
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Keys are issued one per phone"
                inputMode="tel"
                className="mt-1 w-full rounded-lg border border-edge bg-panel2/60 px-3 py-2 text-sm outline-none placeholder:text-mute/60 focus:border-signal/50"
              />
              <div className="mt-1.5 rounded-lg border border-edge bg-panel2/40 px-2.5 py-2">
                {anchor ? (
                  <p className="font-mono text-[10px] text-mute">
                    anchor{" "}
                    <span className="text-signal">{shortKey(anchor, 16)}</span>
                  </p>
                ) : (
                  <p className="font-mono text-[10px] text-mute/60">
                    anchor {"\u2014"} enter a number to derive
                  </p>
                )}
                <p className="mt-1 text-[10px] leading-relaxed text-mute">
                  One key per person. Only this salted hash is kept {"\u2014"}{" "}
                  your number never leaves the device. Reset your key and this
                  anchor blocks a free fresh start.{" "}
                  <span className="text-mute/70">
                    Verification is stubbed in this demo.
                  </span>
                </p>
              </div>

              <label className="mt-4 block text-[10px] uppercase tracking-widest text-mute">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should matches call you?"
                className="mt-1 w-full rounded-lg border border-edge bg-panel2/60 px-3 py-2 text-sm outline-none placeholder:text-mute/60 focus:border-signal/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") create();
                }}
              />

              <p className="mt-4 text-[10px] uppercase tracking-widest text-mute">
                Profile color
              </p>
              <div className="mt-1.5 grid grid-cols-8 gap-1.5">
                {GRADIENTS.map((g, i) => (
                  <button
                    key={i}
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
                disabled={!canEnter}
                onClick={create}
                className="blue-gradient mt-5 w-full rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Enter Vouch
              </button>
              <p className="mt-3 text-center text-[11px] text-mute">
                Fresh key, zero vouches. Your history starts now.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
