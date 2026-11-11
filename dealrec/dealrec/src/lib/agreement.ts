import type { Deal, DealParty } from "@prisma/client";
import { buildTemplateClauses, getTemplate } from "./templates";
import { safeJsonParse } from "./utils";

export type AgreementSection = { heading: string; body: string[] };

export type AgreementContent = {
  title: string;
  subtitle: string;
  parties: { role: string; name: string }[];
  sections: AgreementSection[];
  notice?: string;
};

const LIMITATION =
  "This is a platform record of what the parties entered and signed. It is not legal advice and does not guarantee payment, performance, enforceability or admissibility in any court. Some transactions require witnesses, stamping, registration, consent or other formalities. Seek advice from a qualified Nigerian legal practitioner where needed.";

export function buildAgreementContent(
  deal: Pick<Deal, "title" | "templateSlug" | "termsJson" | "dealType">,
  parties: Pick<DealParty, "role" | "fullName" | "isCreator">[],
): AgreementContent {
  const template = getTemplate(deal.templateSlug);
  const values = safeJsonParse<Record<string, string>>(deal.termsJson, {});

  if (!template) {
    return {
      title: deal.title,
      subtitle: "Uploaded agreement record",
      parties: parties.map((party) => ({ role: party.role, name: party.fullName })),
      sections: [
        {
          heading: "Uploaded document",
          body: [
            "The agreement for this deal was uploaded by the party who created the deal. The original uploaded file is preserved separately from the executed copy.",
            "The parties have reviewed the uploaded document through the platform and have signed on the execution page attached to the executed copy.",
          ],
        },
        {
          heading: "Platform record",
          body: [
            "The platform records the document hash, review and signing events, and any payments, comments or evidence supplied by the parties.",
          ],
        },
      ],
      notice: LIMITATION,
    };
  }

  const sections = buildTemplateClauses(template.slug, values);
  sections.push({
    heading: "Acknowledgement",
    body: [
      "Each party confirms that they have read and understood this agreement, that the details are accurate, and that they intend to be bound by it.",
      "Each party confirms that they had the opportunity to ask questions or seek independent advice before signing.",
    ],
  });

  if (template.formalitiesNote) {
    sections.push({
      heading: "Formalities to consider",
      body: [template.formalitiesNote],
    });
  }

  return {
    title: deal.title,
    subtitle: `${template.name} - template v${template.version} (reviewed ${template.reviewedAt})`,
    parties: parties.map((party) => ({ role: party.role, name: party.fullName })),
    sections,
    notice: LIMITATION,
  };
}
