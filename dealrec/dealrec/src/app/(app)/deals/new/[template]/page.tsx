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
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">
        New {template.name}
      </h1>
      <p className="mb-5 text-[13px] text-ink-500">
        {user.fullName} will be recorded as the {template.creatorRole.toLowerCase()}.
      </p>
      <TemplateDealForm template={template} />
    </div>
  );
}
