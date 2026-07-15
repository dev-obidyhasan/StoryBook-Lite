import type { Metadata } from 'next';
import { TemplateListPage } from '@/components/module/Templates/TemplateListPage';

export const metadata: Metadata = { title: 'Templates' };

export default function TemplatesPage() {
  return <TemplateListPage />;
}
