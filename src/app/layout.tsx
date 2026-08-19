import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/providers/AppProvider';

export const metadata: Metadata = {
  title: 'NexTalk',
  description: 'Real-time chat, audio & video calls',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
