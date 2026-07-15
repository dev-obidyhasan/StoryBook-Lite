import type { Metadata } from "next";
import { TemplateDetailPage } from "@/components/module/Templates/TemplateDetailPage";

export const metadata: Metadata = { title: "Create Template" };

export default function NewTemplatePage() {
  return <TemplateDetailPage templateId="new" />;
}
