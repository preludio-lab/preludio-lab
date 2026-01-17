import { redirect } from 'next/navigation';
import { AppLocale } from '@/domain/i18n/locale';

export default function RootPage() {
  redirect(`/${AppLocale.JA}`);
}
