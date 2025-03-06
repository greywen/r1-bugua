import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'R1卜卦 - 探索命运的奥秘',
  description: '基于 DeepSeek AI 的专业算命服务，为您揭示命运的奥秘',
  keywords: '算命,运势,命理,AI算命,在线算命',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh'>
      <body className='antialiased'>{children}</body>
    </html>
  );
}
