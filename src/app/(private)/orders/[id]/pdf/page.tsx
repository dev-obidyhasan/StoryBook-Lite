import type { Metadata } from 'next';
import { PDFReadyPage } from '@/components/module/PDF/PDFReadyPage';

export const metadata: Metadata = { title: 'Download PDF' };

export default async function PDFPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PDFReadyPage orderId={id} />;
}
