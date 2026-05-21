export interface BankInfo {
  code: string;
  name: string;
  displayName?: string;
  appScheme: string;
  androidPackage: string;
  iosAppId: string;
  color: string;
  logo?: string;
}

export const BANKS: BankInfo[] = [
  {
    code: 'toss',
    name: '토스',
    displayName: '토스',
    appScheme: 'supertoss://',
    androidPackage: 'viva.republica.toss',
    iosAppId: '839333328',
    color: '#0064FF',
    logo: '/tossbank.svg',
  },
  {
    code: 'kakaopay',
    name: '카카오페이',
    displayName: '카카오페이',
    appScheme: 'kakaopay://',
    androidPackage: 'com.kakaopay.app',
    iosAppId: '1464496236',
    color: '#FFCD00',
    logo: '/kakaopay.png',
  },
  {
    code: 'kakaobank',
    name: '카카오뱅크',
    displayName: '카카오뱅크',
    appScheme: 'kakaobank://',
    androidPackage: 'com.kakaobank.channel',
    iosAppId: '1258016944',
    color: '#FFCD00',
    logo: '/kakaobank.webp',
  },
  {
    code: 'kb',
    name: 'KB국민은행',
    displayName: 'KB스타뱅킹',
    appScheme: 'kbbank://',
    androidPackage: 'com.kbstar.kbbank',
    iosAppId: '373744424',
    color: '#FFB300',
    logo: '/kookminbank.webp',
  },
  {
    code: 'shinhan',
    name: '신한은행',
    displayName: '신한 SOL뱅크',
    appScheme: 'shinhansol://',
    androidPackage: 'com.shinhan.sbanking',
    iosAppId: '1056586036',
    color: '#0046FF',
    logo: '/shinhanbank.webp',
  },
  {
    code: 'nh',
    name: 'NH농협은행',
    displayName: 'NH스마트뱅킹',
    appScheme: 'newnhsmartbanking://',
    androidPackage: 'nh.smart.banking',
    iosAppId: '1469324650',
    color: '#005BAC',
    logo: '/nonghyupbank.webp',
  },
  {
    code: 'woori',
    name: '우리은행',
    displayName: '우리WON뱅킹',
    appScheme: 'wooribank://',
    androidPackage: 'com.wooribank.smart.npib',
    iosAppId: '1470181651',
    color: '#0066B3',
    logo: '/wooribank.png',
  },
  {
    code: 'hana',
    name: '하나은행',
    displayName: '하나원큐',
    appScheme: 'hanabank-oqf://',
    androidPackage: 'com.hanabank.oqf',
    iosAppId: '6743190232',
    color: '#009775',
    logo: '/hanabank.png',
  },
  {
    code: 'kbank',
    name: '케이뱅크',
    displayName: '케이뱅크',
    appScheme: 'ukbanksmartbank://',
    androidPackage: 'com.kbankwith.smartbank',
    iosAppId: '1183204944',
    color: '#000000',
    logo: '/kbank.webp',
  },
  {
    code: 'ibk',
    name: 'IBK기업은행',
    displayName: 'i-ONE Bank',
    appScheme: 'ionebank://',
    androidPackage: 'com.ibk.android.ionebank',
    iosAppId: '1460543865',
    color: '#0066B3',
    logo: '/ibkbank.webp',
  },
  {
    code: 'shinhyup',
    name: '신협',
    displayName: '신협 온뱅크',
    appScheme: 'cuonbank://',
    androidPackage: 'com.cu.onbank',
    iosAppId: '1484456647',
    color: '#0058A9',
    logo: '/shinhyupbank.webp',
  },
];

// Banks available for account selection (drop-down)
export const ACCOUNT_BANKS = [
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  'IBK기업은행',
  '카카오뱅크',
  '토스뱅크',
  'SC제일은행',
  '씨티은행',
  '대구은행',
  '부산은행',
  '광주은행',
  '전북은행',
  '경남은행',
  '제주은행',
  '수협은행',
  '새마을금고',
  '신협',
  '우체국',
  '산업은행',
  '케이뱅크',
];

export function getBankByCode(code: string): BankInfo | undefined {
  return BANKS.find((b) => b.code === code);
}

export function getAndroidStoreUrl(packageName: string): string {
  return `https://play.google.com/store/apps/details?id=${packageName}&hl=ko&gl=KR`;
}

export function getIosStoreUrl(appId: string): string {
  return `https://apps.apple.com/kr/app/id${appId}`;
}
