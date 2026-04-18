type ReminderLite = {
  id: string;
  channel: string;
  status: string;
  createdAt: Date;
  sentAt: Date | null;
  message: string | null;
};

export type CopilotInvoiceInput = {
  id: string;
  concept: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "OVERDUE";
  customer: {
    name: string;
  };
  reminders: ReminderLite[];
};

export type CopilotRecommendation = {
  invoiceId: string;
  customerName: string;
  invoiceNumber: string | null;
  amount: number;
  daysLate: number;
  score: number;
  priorityLabel: "Muy alta" | "Alta" | "Media";
  riskLabel: "Alto" | "Medio" | "Bajo";
  suggestedChannel: "EMAIL" | "WHATSAPP" | "PHONE";
  nextAction: string;
  why: string[];
  suggestedMessage: string;
};

export type CopilotSummary = {
  openAmount: number;
  urgentAmount: number;
  urgentCount: number;
  headline: string;
  secondary: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function getSentReminderCount(reminders: ReminderLite[]) {
  return reminders.filter((item) => item.status === "SENT" || item.sentAt).length;
}

function getLastChannel(reminders: ReminderLite[]) {
  const sorted = [...reminders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return sorted[0]?.channel ?? null;
}

function getSuggestedChannel(
  daysLate: number,
  sentCount: number,
  amount: number,
  lastChannel: string | null
): "EMAIL" | "WHATSAPP" | "PHONE" {
  if (daysLate >= 21 || (amount >= 1000 && sentCount >= 2)) {
    return "PHONE";
  }

  if (daysLate >= 7) {
    if (lastChannel === "WHATSAPP") return "PHONE";
    if (lastChannel === "EMAIL") return "WHATSAPP";
    return "EMAIL";
  }

  if (daysLate >= 1) {
    if (sentCount === 0) return "EMAIL";
    if (lastChannel === "EMAIL") return "WHATSAPP";
    return "EMAIL";
  }

  if (amount >= 800) return "EMAIL";
  return "WHATSAPP";
}

function buildSuggestedMessage(params: {
  customerName: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: Date;
  daysLate: number;
  sentCount: number;
}) {
  const dueDateText = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(params.dueDate);

  const amountText = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(params.amount);

  const reference = params.invoiceNumber
    ? `la factura ${params.invoiceNumber}`
    : "la factura pendiente";

  if (params.daysLate <= 0) {
    return `Hola ${params.customerName}, te dejo localizada ${reference} por ${amountText}, con vencimiento ${dueDateText}. Quedo pendiente. Gracias.`;
  }

  if (params.daysLate <= 7 && params.sentCount === 0) {
    return `Hola ${params.customerName}, te escribo para recordarte que ${reference} por ${amountText} venció el ${dueDateText} y sigue pendiente. ¿Me puedes confirmar por favor la previsión de pago? Gracias.`;
  }

  if (params.daysLate <= 21) {
    return `Hola ${params.customerName}, sigo pendiente de ${reference} por ${amountText}, vencida el ${dueDateText}. Necesito por favor fecha concreta de pago para dejarlo actualizado hoy.`;
  }

  return `Hola ${params.customerName}, necesitamos cerrar ${reference} por ${amountText}, vencida el ${dueDateText} hace ${params.daysLate} días. Necesito confirmación y fecha de pago hoy, por favor.`;
}

function getNextAction(params: {
  daysLate: number;
  sentCount: number;
  channel: "EMAIL" | "WHATSAPP" | "PHONE";
}) {
  if (params.daysLate >= 21 || (params.sentCount >= 2 && params.daysLate >= 10)) {
    return "Haz seguimiento hoy y escala a llamada.";
  }

  if (params.daysLate >= 7) {
    return `Manda ${
      params.channel === "PHONE"
        ? "llamada"
        : params.channel === "WHATSAPP"
          ? "WhatsApp"
          : "email"
    } hoy y pide fecha concreta de pago.`;
  }

  if (params.daysLate >= 1) {
    return "Haz un primer recordatorio y pide confirmación de pago.";
  }

  return "Deja un recordatorio preventivo antes del vencimiento.";
}

function getWhy(params: {
  daysLate: number;
  amount: number;
  sentCount: number;
  status: "PENDING" | "OVERDUE";
}) {
  const reasons: string[] = [];

  if (params.status === "OVERDUE") {
    reasons.push("ya está vencida");
  }

  if (params.daysLate >= 21) {
    reasons.push(`lleva ${params.daysLate} días de retraso`);
  } else if (params.daysLate >= 7) {
    reasons.push(`acumula ${params.daysLate} días de retraso`);
  } else if (params.daysLate >= 1) {
    reasons.push(`acaba de entrar en retraso (${params.daysLate} días)`);
  } else {
    reasons.push("vence pronto o sigue todavía en plazo");
  }

  if (params.amount >= 1000) {
    reasons.push("importe alto");
  } else if (params.amount >= 400) {
    reasons.push("importe relevante");
  }

  if (params.sentCount === 0) {
    reasons.push("sin recordatorios enviados todavía");
  } else if (params.sentCount >= 2) {
    reasons.push(`${params.sentCount} avisos previos`);
  } else {
    reasons.push("ya tuvo un aviso previo");
  }

  return reasons;
}

function scoreInvoice(invoice: CopilotInvoiceInput) {
  const today = new Date();
  const daysLate = diffInDays(today, invoice.dueDate);
  const sentCount = getSentReminderCount(invoice.reminders);

  let score = 0;

  if (invoice.status === "OVERDUE") score += 35;
  if (daysLate >= 1) score += Math.min(daysLate, 30) * 2;
  if (invoice.amount >= 1000) score += 25;
  else if (invoice.amount >= 500) score += 16;
  else if (invoice.amount >= 250) score += 10;
  else score += 4;

  if (sentCount === 0) score += 10;
  if (sentCount >= 1) score += 6;
  if (sentCount >= 2) score += 8;

  if (daysLate <= 0 && invoice.amount >= 500) score += 8;

  return {
    score,
    daysLate,
    sentCount,
  };
}

function getPriorityLabel(score: number): "Muy alta" | "Alta" | "Media" {
  if (score >= 80) return "Muy alta";
  if (score >= 55) return "Alta";
  return "Media";
}

function getRiskLabel(
  daysLate: number,
  sentCount: number,
  amount: number
): "Alto" | "Medio" | "Bajo" {
  if (daysLate >= 21 || (daysLate >= 10 && amount >= 500) || sentCount >= 2) {
    return "Alto";
  }

  if (daysLate >= 5 || amount >= 400) {
    return "Medio";
  }

  return "Bajo";
}

export function buildCobroCopilot(invoices: CopilotInvoiceInput[]) {
  const openAmount = invoices.reduce((acc, invoice) => acc + invoice.amount, 0);

  const recommendations: CopilotRecommendation[] = invoices
    .map((invoice) => {
      const { score, daysLate, sentCount } = scoreInvoice(invoice);
      const lastChannel = getLastChannel(invoice.reminders);
      const suggestedChannel = getSuggestedChannel(
        daysLate,
        sentCount,
        invoice.amount,
        lastChannel
      );

      return {
        invoiceId: invoice.id,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        daysLate,
        score,
        priorityLabel: getPriorityLabel(score),
        riskLabel: getRiskLabel(daysLate, sentCount, invoice.amount),
        suggestedChannel,
        nextAction: getNextAction({
          daysLate,
          sentCount,
          channel: suggestedChannel,
        }),
        why: getWhy({
          daysLate,
          amount: invoice.amount,
          sentCount,
          status: invoice.status,
        }),
        suggestedMessage: buildSuggestedMessage({
          customerName: invoice.customer.name,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          daysLate,
          sentCount,
        }),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const urgent = recommendations.filter((item) => item.priorityLabel !== "Media");
  const urgentAmount = urgent.reduce((acc, item) => acc + item.amount, 0);

  const summary: CopilotSummary = {
    openAmount,
    urgentAmount,
    urgentCount: urgent.length,
    headline:
      recommendations.length === 0
        ? "No hay cobros abiertos que priorizar ahora."
        : `Hoy conviene atacar primero ${recommendations[0].customerName}.`,
    secondary:
      recommendations.length === 0
        ? "Cuando existan facturas pendientes o vencidas, el Copilot propondrá prioridad, canal y mensaje."
        : urgent.length > 0
          ? `${urgent.length} cobros merecen atención alta o muy alta.`
          : "De momento no hay alertas críticas, pero sí acciones preventivas.",
  };

  return {
    summary,
    recommendations,
  };
}
