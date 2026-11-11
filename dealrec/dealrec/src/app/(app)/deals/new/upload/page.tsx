import { requireUser } from "@/lib/auth";
import { UploadDealForm } from "@/components/deals/upload-deal-form";

export const metadata = { title: "Upload an agreement" };

export default async function UploadDealPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink-900">Upload a PDF agreement</h1>
      <p className="mb-5 text-[13px] text-ink-500">
        Use an agreement you already prepared. We will collect signatures on that exact file and
        generate executed and certificate copies.
      </p>
      <UploadDealForm />
    </div>
  );
}
