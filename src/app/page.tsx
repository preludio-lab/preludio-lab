import { redirect } from 'next/navigation';
import { AppLocale } from '@/domain/i18n/Locale';

export default function RootPage() {
  redirect(`/${AppLocale.JA}`);
}
