import type { Metadata } from "next";
import { TemplateDetailPage } from "@/components/module/Templates/TemplateDetailPage";

export const metadata: Metadata = { title: "Edit Template" };

export default async function TemplateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateDetailPage templateId={id} />;
}
