import { Metadata } from "next";
import { OrderImagesPage } from "@/components/module/Orders/OrderImagesPage";

export const metadata: Metadata = {
  title: "Order Images | Storybook Lite",
  description: "Upload images for the order and generate PDF.",
};

export default async function OrderImagesRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderImagesPage orderId={id} />;
}
