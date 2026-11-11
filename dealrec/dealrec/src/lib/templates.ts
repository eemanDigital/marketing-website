import rawDefinitions from "./template-definitions.json";
import { formatDate, formatNaira } from "./utils";

export type FieldType = "text" | "textarea" | "number" | "currency" | "date" | "select";

export type TemplateField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
};

export type TemplateDefinition = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  version: string;
  reviewedAt: string;
  creatorRole: string;
  counterpartyRole: string;
  amountField?: string;
  fields: TemplateField[];
  formalitiesNote?: string;
};

export type Clause = { heading: string; body: string[] };

const raw = rawDefinitions as TemplateDefinition[];

const FORMALITY_NOTES: Record<string, string> = {
  "rent-tenancy":
    "This is a tenancy record, not a statutory tenancy agreement. Stamping, registration, notices and other formalities may be required. Speak to a qualified Nigerian legal practitioner.",
  "vehicle-sale":
    "This records the sale terms only. Vehicle registration and title transfer formalities are separate and must be completed with the relevant authorities.",
  "deposit-balance":
    "If the deposit relates to land, a vehicle or another asset with formal transfer requirements, separate legal steps may be required.",
  "general-agreement":
    "Custom or high-value terms may need review by a qualified Nigerian legal practitioner.",
};

export const TEMPLATES: TemplateDefinition[] = raw.map((template) => ({
  ...template,
  formalitiesNote: FORMALITY_NOTES[template.slug],
}));

export function getTemplate(slug: string | null | undefined) {
  if (!slug) return null;
  return TEMPLATES.find((template) => template.slug === slug) ?? null;
}

export function getFieldLabel(slug: string | null | undefined, key: string) {
  const field = getTemplate(slug)?.fields.find((item) => item.key === key);
  return field?.label ?? key;
}

export function templateAmount(slug: string | null | undefined, values: Record<string, string>) {
  const template = getTemplate(slug);
  if (!template?.amountField) return null;
  const parsed = Number(values[template.amountField]?.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function money(value: string | undefined) {
  if (!value) return "Not specified";
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? formatNaira(parsed) : value;
}

function date(value: string | undefined) {
  if (!value) return "Not specified";
  const parsed = new Date(`${value}T00:00:00+01:00`);
  return Number.isNaN(parsed.getTime()) ? value : formatDate(parsed);
}

function text(value: string | undefined, fallback = "Not specified") {
  return value?.trim() || fallback;
}

function scheduleLines(value: string | undefined) {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type Builder = (values: Record<string, string>) => Clause[];

const BUILDERS: Record<string, Builder> = {
  "personal-loan": (v) => [
    {
      heading: "Loan terms",
      body: [
        `The lender agrees to lend the borrower the principal sum of ${money(v.principal)}.`,
        `The loan is repayable in full on or before ${date(v.repaymentDate)}.`,
        `Interest: ${text(v.interest, "Interest-free")}.`,
        `Payment method: ${text(v.paymentMethod)}.`,
      ],
    },
    {
      heading: "Repayment schedule",
      body:
        scheduleLines(v.repaymentSchedule).length > 0
          ? scheduleLines(v.repaymentSchedule)
          : [`The full principal is due on ${date(v.repaymentDate)}.`],
    },
    {
      heading: "If repayment is missed",
      body: [
        text(
          v.defaultSteps,
          "The parties will discuss a practical repayment arrangement. Either party may seek independent legal advice.",
        ),
      ],
    },
  ],
  "sale-of-goods": (v) => [
    {
      heading: "Item and condition",
      body: [
        `Item: ${text(v.itemDescription)}.`,
        `Condition: ${text(v.condition)}.`,
      ],
    },
    {
      heading: "Price and payment",
      body: [
        `Total price: ${money(v.price)}.`,
        `Deposit paid: ${money(v.deposit)}.`,
        `Balance due: ${v.balance ? money(v.balance) : "As agreed between the parties"}.`,
      ],
    },
    {
      heading: "Delivery and inspection",
      body: [
        `Delivery or handover date: ${date(v.deliveryDate)}.`,
        `Delivery details: ${text(v.deliveryDetails)}.`,
        text(v.inspection, "The buyer may inspect the item before accepting delivery."),
      ],
    },
  ],
  "service-agreement": (v) => [
    {
      heading: "Scope of work",
      body: [text(v.scope)],
    },
    {
      heading: "Deliverables",
      body: [text(v.deliverables)],
    },
    {
      heading: "Milestones and deadline",
      body: [
        ...(scheduleLines(v.milestones).length
          ? scheduleLines(v.milestones)
          : ["Milestones to be agreed between the parties."]),
        `Final deadline: ${date(v.deadline)}.`,
      ],
    },
    {
      heading: "Fee and revisions",
      body: [
        `Total fee: ${money(v.fee)}.`,
        `Revisions: ${text(v.revisions, "As agreed between the parties")}.`,
      ],
    },
    {
      heading: "Acceptance",
      body: [
        text(
          v.acceptance,
          "The client will confirm acceptance within a reasonable time after delivery.",
        ),
      ],
    },
  ],
  "deposit-balance": (v) => [
    {
      heading: "Deposit",
      body: [
        `Purpose: ${text(v.purpose)}.`,
        `Deposit received: ${money(v.amountReceived)}.`,
        `Balance due: ${money(v.balanceAmount)} on or before ${date(v.balanceDeadline)}.`,
      ],
    },
    {
      heading: "Cancellation and refund",
      body: [
        `Cancellation: ${text(v.cancellationTerms, "As agreed between the parties")}.`,
        `Refund: ${text(v.refundTerms, "As agreed between the parties")}.`,
      ],
    },
  ],
  "instalment-payment": (v) => [
    {
      heading: "Price and instalments",
      body: [
        `Total price: ${money(v.totalPrice)}.`,
        `Instalment amount: ${money(v.instalmentAmount)}.`,
        `Number of instalments: ${text(v.numberOfInstalments)}.`,
        `Frequency: ${text(v.frequency)}.`,
        `First instalment due: ${date(v.firstDueDate)}.`,
      ],
    },
    {
      heading: "Late or missed instalments",
      body: [
        text(
          v.lateConsequences,
          "The parties will discuss a reasonable arrangement. Any late fee must be lawful and agreed.",
        ),
      ],
    },
  ],
  "supply-order": (v) => [
    {
      heading: "Order details",
      body: [
        `Goods or services: ${text(v.goodsServices)}.`,
        `Quantity: ${text(v.quantity)}.`,
        `Unit price: ${v.unitPrice ? money(v.unitPrice) : "Not specified"}.`,
        `Total price: ${money(v.totalPrice)}.`,
      ],
    },
    {
      heading: "Delivery and inspection",
      body: [
        `Delivery date: ${date(v.deliveryDate)}.`,
        text(v.inspection, "The buyer may inspect the goods on delivery."),
      ],
    },
    {
      heading: "Payment terms",
      body: [text(v.paymentTerms)],
    },
  ],
  "rent-tenancy": (v) => [
    {
      heading: "Premises and term",
      body: [`Premises: ${text(v.premises)}.`, `Term: ${text(v.term)}.`],
    },
    {
      heading: "Rent and deposit",
      body: [
        `Rent: ${money(v.rentAmount)}.`,
        `Deposit or caution fee: ${v.depositAmount ? money(v.depositAmount) : "Not specified"}.`,
        `Payment dates: ${text(v.paymentDates)}.`,
      ],
    },
    {
      heading: "Obligations",
      body: [
        text(
          v.obligations,
          "Each party will keep the premises in a reasonable condition and comply with applicable law.",
        ),
      ],
    },
  ],
  "vehicle-sale": (v) => [
    {
      heading: "Vehicle",
      body: [text(v.vehicleDetails)],
    },
    {
      heading: "Price and payment",
      body: [`Sale price: ${money(v.price)}.`, `Payment terms: ${text(v.paymentTerms)}.`],
    },
    {
      heading: "Handover and disclosed defects",
      body: [
        `Handover date: ${date(v.handoverDate)}.`,
        `Disclosed defects: ${text(v.disclosedDefects)}.`,
        `Documents handed over: ${text(v.documents, "As agreed between the parties")}.`,
      ],
    },
  ],
  "acknowledgement-of-debt": (v) => [
    {
      heading: "Debt acknowledged",
      body: [
        `Amount owed: ${money(v.amountOwed)}.`,
        `Reason: ${text(v.reason)}.`,
      ],
    },
    {
      heading: "Repayment",
      body: [
        text(v.repaymentTerms),
        ...(v.firstRepaymentDate ? [`First repayment date: ${date(v.firstRepaymentDate)}.`] : []),
      ],
    },
  ],
  "general-agreement": (v) => [
    {
      heading: "Subject and consideration",
      body: [
        `Subject: ${text(v.subject)}.`,
        `Payment amount: ${v.paymentAmount ? money(v.paymentAmount) : "Not specified"}.`,
      ],
    },
    {
      heading: "Obligations",
      body: [text(v.obligations)],
    },
    {
      heading: "Dates and additional terms",
      body: [
        `Start date: ${date(v.startDate)}.`,
        `End or completion date: ${date(v.endDate)}.`,
        `Additional terms: ${text(v.additionalTerms, "None")}.`,
      ],
    },
  ],
};

export function buildTemplateClauses(slug: string, values: Record<string, string>) {
  const builder = BUILDERS[slug];
  if (!builder) return [];
  return builder(values);
}

export function validateTemplateValues(
  slug: string,
  input: Record<string, FormDataEntryValue | null>,
) {
  const template = getTemplate(slug);
  if (!template) throw new Error("Unknown deal template.");

  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const field of template.fields) {
    const rawValue = input[field.key];
    let value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!value && field.required) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }

    if (value && field.type === "currency") {
      const parsed = Number(value.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 0) {
        errors[field.key] = `${field.label} must be a valid amount.`;
        continue;
      }
      value = String(Math.round(parsed));
    }

    if (value && field.type === "number") {
      const parsed = Number(value.replace(/[^0-9]/g, ""));
      if (!Number.isFinite(parsed) || parsed < 1) {
        errors[field.key] = `${field.label} must be a valid number.`;
        continue;
      }
      value = String(Math.round(parsed));
    }

    if (value && field.type === "date") {
      const parsed = new Date(`${value}T00:00:00+01:00`);
      if (Number.isNaN(parsed.getTime())) {
        errors[field.key] = `${field.label} must be a valid date.`;
        continue;
      }
      value = value.slice(0, 10);
    }

    if (value && field.type === "select" && field.options && !field.options.includes(value)) {
      errors[field.key] = `Choose a valid option for ${field.label}.`;
      continue;
    }

    values[field.key] = value.slice(0, 5000);
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error("Please check the highlighted fields.") as Error & {
      fieldErrors: Record<string, string>;
    };
    error.fieldErrors = errors;
    throw error;
  }

  return values;
}

export function changedFields(
  slug: string | null | undefined,
  previous: Record<string, string>,
  next: Record<string, string>,
) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  const changes: string[] = [];
  for (const key of keys) {
    if ((previous[key] ?? "") !== (next[key] ?? "")) {
      const label = getFieldLabel(slug, key);
      changes.push(`${label}: ${previous[key] || "empty"} -> ${next[key] || "empty"}`);
    }
  }
  return changes;
}
