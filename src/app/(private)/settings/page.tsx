import type { Metadata } from 'next';
import { SettingsDashboard } from '@/components/module/Settings/SettingsDashboard';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return <SettingsDashboard />;
}
