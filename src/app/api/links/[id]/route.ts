import { NextRequest, NextResponse } from 'next/server';
import { getLink, deleteLink, updateLink } from '@/lib/kv';
import { sanitizeInput, cleanAccountNumber, isValidKakaoPayUrl } from '@/lib/utils';

export const runtime = 'edge';

// Input length limits (keep in sync with links/route.ts)
const MAX_BANK_NAME = 20;
const MAX_ACCOUNT_NUMBER = 30;
const MAX_ACCOUNT_HOLDER = 20;
const MAX_KAKAOPAY_URL = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = await getLink(id);

    if (!link) {
      return NextResponse.json(
        { error: '존재하지 않는 링크입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(link);
  } catch (error) {
    console.error('Failed to fetch link:', error);
    return NextResponse.json(
      { error: '링크 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '유효한 JSON 요청 본문이 필요합니다.' },
        { status: 400 }
      );
    }
    const { bankName, accountNumber, accountHolder, kakaoPayUrl } = body;

    // Sanitize inputs
    const updates: Record<string, string | undefined> = {};
    if (bankName) updates.bankName = sanitizeInput(String(bankName), MAX_BANK_NAME);
    if (accountNumber) updates.accountNumber = cleanAccountNumber(sanitizeInput(String(accountNumber), MAX_ACCOUNT_NUMBER));
    if (accountHolder) updates.accountHolder = sanitizeInput(String(accountHolder), MAX_ACCOUNT_HOLDER);

    if (kakaoPayUrl !== undefined) {
      let tempUrl = String(kakaoPayUrl).trim();
      if (tempUrl) {
        tempUrl = sanitizeInput(tempUrl, MAX_KAKAOPAY_URL);
        if (!/^https?:\/\//i.test(tempUrl)) {
          tempUrl = `https://${tempUrl}`;
        }
        if (!isValidKakaoPayUrl(tempUrl)) {
          return NextResponse.json(
            { error: '허용되지 않는 카카오페이 URL입니다. qr.kakaopay.com 도메인만 사용 가능합니다.' },
            { status: 400 }
          );
        }
        updates.kakaoPayUrl = tempUrl;
      } else {
        updates.kakaoPayUrl = undefined;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '수정할 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    const updated = await updateLink(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: '존재하지 않는 링크입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update link:', error);
    return NextResponse.json(
      { error: '링크 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteLink(id);

    if (!deleted) {
      return NextResponse.json(
        { error: '존재하지 않는 링크입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete link:', error);
    return NextResponse.json(
      { error: '링크 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
