import { notFound } from 'next/navigation';
import { getLink } from '@/lib/kv';
import TransferPageClient from './TransferPageClient';

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const link = await getLink(id);

  if (!link) {
    return { title: '페이지를 찾을 수 없습니다' };
  }

  return {
    title: `${link.accountHolder}님에게 송금`,
    description: `${link.bankName} ${link.accountNumber} - 계좌번호 복사 및 은행 앱 바로가기`,
  };
}

export const viewport = {
  themeColor: '#f8f9fc',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function TransferPage({ params }: PageProps) {
  const { id } = await params;

  const link = await getLink(id);

  if (!link) {
    notFound();
  }

  return <TransferPageClient link={link} />;
}
