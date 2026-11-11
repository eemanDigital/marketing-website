import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, QrCode, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const points = [
  { icon: BadgeCheck, title: "Version-locked signatures", body: "Every signature is tied to the exact version that was reviewed." },
  { icon: ShieldCheck, title: "Hash-chained events", body: "Key actions are recorded in a tamper-evident sequence." },
  { icon: QrCode, title: "Public verification", body: "Anyone with the reference can check the record and compare a file." },
];

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-[13px] font-semibold text-ink-500 hover:text-ink-800">
            Back home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-[14px] leading-6 text-ink-600">{subtitle}</p> : null}
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-5 text-[13px] text-ink-500">{footer}</div> : null}
          </div>
        </div>
        <p className="text-center text-[11px] text-ink-400">
          dealrec records agreements and transaction updates. It is not a law firm or a government service.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-900 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sand-500/15 blur-3xl" />
        <p className="relative max-w-sm text-2xl font-extrabold leading-snug text-white">
          A handshake is a good start. A clear record is better.
        </p>
        <ul className="relative space-y-4">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <li key={point.title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-white">{point.title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-ink-300">{point.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="relative text-[11px] leading-5 text-ink-400">
          One-time codes prove control of a contact channel, not civil identity. The platform seal is not
          an NBA, notarial or government seal.
        </p>
      </aside>
    </div>
  );
}
