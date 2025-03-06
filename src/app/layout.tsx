import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'R1 卜卦 - 探索命运的奥秘',
  description: '基于 DeepSeek AI 的专业卜卦服务，为您揭示命运的奥秘',
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
