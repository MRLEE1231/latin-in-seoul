import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminLoginForm from './AdminLoginForm';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return <AdminLoginForm />;
  }

  if (session.role !== 'ADMIN') {
    redirect('/');
  }

  return <>{children}</>;
}
