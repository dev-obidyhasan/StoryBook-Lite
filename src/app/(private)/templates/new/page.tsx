import type { Metadata } from "next";
import { NewTemplatePage } from "@/components/module/Templates/NewTemplatePage";

export const metadata: Metadata = { title: "Create Template" };

export default function NewTemplateRoute() {
  return <NewTemplatePage />;
}
