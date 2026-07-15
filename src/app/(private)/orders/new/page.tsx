import { Metadata } from "next";
import { CreateOrderPage } from "@/components/module/Orders/CreateOrderPage";

export const metadata: Metadata = {
  title: "Create Order | Storybook Lite",
  description: "Create a new order for a book template.",
};

export default function NewOrderRoute() {
  return <CreateOrderPage />;
}
