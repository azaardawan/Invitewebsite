import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/guard';

/** Unknown admin URLs: sign-in first (don't reveal which admin routes exist), then 404. */
export default async function AdminCatchAll() {
  await requireAdmin();
  notFound();
}
