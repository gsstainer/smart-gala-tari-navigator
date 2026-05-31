import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart GALA-TARI Navigator | 대국민 상급지 갈아타기 플랫폼',
  description: '영유아 육아 보육 인프라와 재건축 정비사업 가치 분석을 결합하여 가구 맞춤형 최적 상급지 이동 징검다리 경로를 제시하는 혁신 프롭테크 플랫폼',
  keywords: ['부동산 갈아타기', '대지지분 계산기', '소아과 야간진료', '동북선 경전철', '중계 동진신안', '상계보람 2단지', 'Supabase pgvector RAG'],
  authors: [{ name: 'Antigravity DeepMind Advanced coding agent' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        
        <!-- Leaflet GIS Real Map Style CDN -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
