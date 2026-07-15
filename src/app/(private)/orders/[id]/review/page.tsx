import type { Metadata } from 'next';
import { IllustrationReviewPage } from '@/components/module/Illustrations/IllustrationReviewPage';

export const metadata: Metadata = { title: 'Review Illustrations' };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IllustrationReviewPage orderId={id} />;
}
