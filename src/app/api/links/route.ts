import { NextRequest, NextResponse } from 'next/server';
import { saveLink, getAllLinks, getLink } from '@/lib/kv';
import { generateId, sanitizeInput, cleanAccountNumber, isValidKakaoPayUrl } from '@/lib/utils';

export const runtime = 'edge';

// Input length limits
const MAX_BANK_NAME = 20;
const MAX_ACCOUNT_NUMBER = 30;
const MAX_ACCOUNT_HOLDER = 20;
const MAX_KAKAOPAY_URL = 300;

export async function POST(request: NextRequest) {
  try {
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

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Sanitize and limit input lengths
    const safeBankName = sanitizeInput(String(bankName), MAX_BANK_NAME);
    const safeAccountNumber = cleanAccountNumber(sanitizeInput(String(accountNumber), MAX_ACCOUNT_NUMBER));
    const safeAccountHolder = sanitizeInput(String(accountHolder), MAX_ACCOUNT_HOLDER);

    let safeKakaoPayUrl: string | undefined = undefined;
    if (kakaoPayUrl) {
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
        safeKakaoPayUrl = tempUrl;
      }
    }

    if (!safeBankName || !safeAccountNumber || !safeAccountHolder) {
      return NextResponse.json(
        { error: '유효한 값을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Generate unique ID with collision retry
    let id = '';
    let idIsUnique = false;
    for (let i = 0; i < 3; i++) {
      id = generateId(8);
      const existing = await getLink(id);
      if (!existing) { idIsUnique = true; break; }
    }
    if (!idIsUnique) {
      return NextResponse.json(
        { error: 'ID 생성에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }
    const linkData = {
      id,
      bankName: safeBankName,
      accountNumber: safeAccountNumber,
      accountHolder: safeAccountHolder,
      kakaoPayUrl: safeKakaoPayUrl,
      createdAt: new Date().toISOString(),
      visitorCount: 0,
    };

    await saveLink(linkData);

    const origin = request.nextUrl.origin;
    const url = `${origin}/${id}`;

    return NextResponse.json({
      url,
      ...linkData,
    });
  } catch (error) {
    console.error('Failed to create link:', error);
    return NextResponse.json(
      { error: '링크 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const links = await getAllLinks();
    return NextResponse.json(links);
  } catch (error) {
    console.error('Failed to fetch links:', error);
    return NextResponse.json(
      { error: '목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}
