import type { Metadata } from 'next';
import { OrdersPage } from '@/components/module/Orders/OrdersPage';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersDashboard() {
  return <OrdersPage />;
}
