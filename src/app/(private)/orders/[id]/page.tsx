import type { Metadata } from "next";
import { OrderDetailPage } from "@/components/module/Orders/OrderDetailPage";

export const metadata: Metadata = { title: "Order Detail" };

export default async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
