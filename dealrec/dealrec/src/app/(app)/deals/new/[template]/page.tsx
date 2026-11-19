import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getTemplate } from "@/lib/templates";
import { TemplateDealForm } from "@/components/deals/template-deal-form";

export default async function NewTemplateDealPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const user = await requireUser();
  const { template: slug } = await params;
  if (slug === "upload") notFound();
  const template = getTemplate(slug);
  if (!template) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-violet-700">
          Guided template · Step 2 of 3
        </p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
          {template.name}
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-ink-muted">
          {user.fullName} will be recorded as the {template.creatorRole.toLowerCase()}. Fill in the
          details below — you can review and share after this step.
        </p>
      </div>
      <TemplateDealForm template={template} />
    </div>
  );
}
