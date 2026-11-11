import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CircleCheck,
  FileSignature,
  HandCoins,
  Handshake,
  Home,
  PackageCheck,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { PublicHeader } from "@/components/public-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TEMPLATES } from "@/lib/templates";

const useCases = [
  {
    icon: HandCoins,
    title: "Lending money",
    body: "Record the amount, repayment date and what happens if the loan is not repaid.",
    prompt: "Put the repayment terms on record before you transfer.",
  },
  {
    icon: PackageCheck,
    title: "Selling an item",
    body: "Agree the price, condition, deposit and delivery before handover.",
    prompt: "Put the item, condition and delivery terms in writing.",
  },
  {
    icon: Wrench,
    title: "Freelance work",
    body: "Set the scope, deliverables, milestones and payment dates clearly.",
    prompt: "Put the scope and milestones in writing.",
  },
  {
    icon: Home,
    title: "Rent and deposits",
    body: "Record premises, rent, deposit, payment dates and what a deposit covers.",
    prompt: "Record what the deposit covers and when the balance is due.",
  },
];

const steps = [
  { icon: FileSignature, title: "Create", body: "Pick a template, answer plain questions and preview the agreement." },
  { icon: Smartphone, title: "Share", body: "Send a secure link through WhatsApp, SMS or email. No app download." },
  { icon: CircleCheck, title: "Sign", body: "The other party verifies their contact, reviews and signs the exact version." },
  { icon: Banknote, title: "Track", body: "Record payments, receipts and obligations after signing." },
  { icon: QrCode, title: "Verify", body: "Keep a sealed record, QR check and downloadable evidence pack." },
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader user={user} />

      <main className="flex-1">
        <section className="relative overflow-hidden deal-watermark">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div>
              <Badge tone="success" className="mb-5">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                For everyday agreements and transactions
              </Badge>
              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl">
                Put the deal on record.
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-7 text-ink-600 sm:text-lg">
                Whether you are lending money, collecting a deposit, selling something or providing a
                service, create a clear agreement, get everyone to confirm it, and keep the payments and
                proof in one place.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={user ? "/deals/new" : "/sign-up"} size="lg">
                  Create a Deal
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/verify" size="lg" variant="outline">
                  Verify a document
                </ButtonLink>
              </div>
              <p className="mt-4 text-[12px] leading-5 text-ink-500">
                Mobile-first. No app download for the other party. Free to start.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-100/60 blur-2xl" />
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-500">deal record</span>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Personal loan</p>
                      <p className="text-lg font-bold text-ink-900">₦300,000 for stock purchase</p>
                    </div>
                    <Badge tone="success">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      Executed
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-ink-50 p-3">
                      <p className="text-[11px] text-ink-500">Amount</p>
                      <p className="text-sm font-bold text-ink-900">₦300,000</p>
                    </div>
                    <div className="rounded-xl bg-ink-50 p-3">
                      <p className="text-[11px] text-ink-500">Outstanding</p>
                      <p className="text-sm font-bold text-ink-900">₦120,000</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      ["Agreement version 1", "Signed by both parties"],
                      ["Payment recorded", "₦180,000 bank transfer"],
                      ["Verification seal", "DRS-2026-7K4M2Q"],
                    ].map(([title, body], index) => (
                      <div key={title} className="flex items-center gap-3 rounded-xl border border-ink-100 px-3 py-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-semibold text-ink-800">{title}</p>
                          <p className="truncate text-[11px] text-ink-500">{body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-brand-600 px-3 py-2.5 text-white">
                    <span className="text-[11px] font-semibold">DEAL RECORD VERIFIED</span>
                    <span className="font-mono text-[10px] opacity-80">SHA-256 · 9f2a…c41</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-y border-ink-200 bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              [BadgeCheck, "Exact version signed", "Every signature is tied to one document version and hash."],
              [ReceiptText, "Payments attached", "Record payments, receipts and outstanding balances."],
              [QrCode, "QR verification", "Check a document reference and compare a file hash."],
              [ShieldCheck, "Evidence pack", "Download the agreement, certificate, events and manifest."],
            ].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof BadgeCheck;
              return (
                <div key={String(title)} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <ItemIcon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-ink-900">{String(title)}</p>
                    <p className="mt-0.5 text-[12px] leading-5 text-ink-500">{String(body)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <Badge tone="neutral">Built for real life</Badge>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              Not just a signature. The whole deal lifecycle.
            </h2>
            <p className="mt-2 text-[15px] leading-7 text-ink-600">
              Create the agreement, invite the other party, keep versions, record payments and preserve a
              clear record if a disagreement happens later.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {useCases.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-bold text-ink-900">{item.title}</h3>
                      <p className="mt-1 text-[13px] leading-6 text-ink-600">{item.body}</p>
                      <p className="mt-2 text-[12px] font-semibold text-brand-700">“{item.prompt}”</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-ink-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Badge tone="neutral">Templates</Badge>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                  Start with a guided template.
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-600">
                  Plain-language forms generate a clear agreement. You can also upload your own PDF.
                </p>
              </div>
              <ButtonLink href="/deals/new" variant="outline" size="sm">
                Browse templates
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.slice(0, 6).map((template) => (
                <Link
                  key={template.slug}
                  href={user ? `/deals/new/${template.slug}` : "/sign-up"}
                  className="group rounded-2xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14px] font-bold text-ink-900">{template.name}</h3>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-ink-500">{template.shortDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <Badge tone="neutral">How it works</Badge>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                Five steps from handshake to record.
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-ink-600">
                Designed for ordinary Android phones, small screens and weak connections. The invited
                party never needs to install an app.
              </p>
              <ButtonLink href={user ? "/deals/new" : "/sign-up"} className="mt-5">
                Create a Deal
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
            <ol className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li key={step.title} className="flex gap-4 rounded-2xl border border-ink-200 bg-white p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-ink-900">
                        {index + 1}. {step.title}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-6 text-ink-600">{step.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="border-t border-ink-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <div className="rounded-2xl border border-sand-200 bg-sand-100 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sand-700" aria-hidden />
                <div>
                  <h2 className="text-[15px] font-bold text-sand-700">Honest about what this is</h2>
                  <p className="mt-1 text-[13px] leading-6 text-sand-700/90">
                    dealrec records the agreement, the versions reviewed, the signing events and the
                    transaction updates. It does not make an agreement impossible to dispute, guarantee
                    recovery of money, or automatically make every document admissible in court. A
                    one-time code proves control of a contact channel, not civil identity. Manually
                    recorded payments are not bank-verified. The platform seal is not an NBA stamp or
                    seal, notarial seal or government certification.
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-sand-700/80">
                    Some transactions need witnesses, stamping, registration, consent or professional
                    advice. Speak to a qualified Nigerian legal practitioner where appropriate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-ink-900">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 px-4 py-12 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">
                Agree clearly. Sign securely. Keep the record.
              </h2>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-ink-300">
                Every deal exposes another person to a better way to document a transaction. Start with
                one deal today.
              </p>
            </div>
            <ButtonLink href={user ? "/deals/new" : "/sign-up"} size="lg" variant="sand">
              Create a Deal
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-[12px] text-ink-500">
            <Handshake className="h-4 w-4 text-brand-600" aria-hidden />
            dealrec helps people put everyday agreements on record.
          </div>
          <div className="flex flex-wrap gap-4 text-[12px] font-medium text-ink-500">
            <Link href="/verify" className="hover:text-ink-800">Verify a document</Link>
            <Link href="/sign-in" className="hover:text-ink-800">Sign in</Link>
            <Link href="/sign-up" className="hover:text-ink-800">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
