import { requireUser } from "@/lib/auth";
import { UploadDealForm } from "@/components/deals/upload-deal-form";

export const metadata = { title: "Upload an agreement" };

export default async function UploadDealPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-violet-700">
          Upload PDF · Step 2 of 3
        </p>
        <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink sm:text-[30px]">
          Upload a PDF agreement
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-ink-muted">
          Use an agreement you already prepared. We will collect signatures on that exact file and
          generate executed and certificate copies.
        </p>
      </div>
      <UploadDealForm />
    </div>
  );
}
