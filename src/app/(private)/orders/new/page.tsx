import type { Metadata } from 'next';
import { NewOrderPage } from '@/components/module/Orders/NewOrderPage';

export const metadata: Metadata = { title: 'New Order' };

export default function NewOrder() {
  return <NewOrderPage />;
}
