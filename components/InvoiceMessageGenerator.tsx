"use client";

import Link from "next/link";
import { useState } from "react";

type InvoiceMessageOption = {
  key: string;
  label: string;
  description: string;
  text: string;
  suggestedChannel: "EMAIL" | "WHATSAPP" | "PHONE";
  invoiceId: string;
  toneClasses: string;
  buttonClasses: string;
};

type InvoiceMessageGeneratorProps = {
  options: InvoiceMessageOption[];
};

function buildReminderHref(option: InvoiceMessageOption) {
  const params = new URLSearchParams({
    invoiceId: option.invoiceId,
    channel: option.suggestedChannel,
    message: option.text,
  });

  return `/recordatorios?${params.toString()}`;
}

function getChannelLabel(channel: string) {
  switch (channel) {
    case "EMAIL":
      return "Email";
    case "WHATSAPP":
      return "WhatsApp";
    case "PHONE":
      return "Teléfono";
    default:
      return channel;
  }
}

export default function InvoiceMessageGenerator({
  options,
}: InvoiceMessageGeneratorProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  async function handleCopy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1800);
    } catch {
      setCopiedKey(null);
    }
  }

  return (
    <div className="mt-4 grid gap-4 xl:grid-cols-3">
      {options.map((option) => (
        <article
          key={option.key}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${option.toneClasses}`}
              >
                {option.label}
              </span>
              <p className="mt-3 text-sm text-slate-600">{option.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                Canal sugerido: {getChannelLabel(option.suggestedChannel)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">
              {option.text}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCopy(option.key, option.text)}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${option.buttonClasses}`}
            >
              {copiedKey === option.key ? "Copiado" : "Copiar mensaje"}
            </button>

            <Link
              href={buildReminderHref(option)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
            >
              Crear recordatorio
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
