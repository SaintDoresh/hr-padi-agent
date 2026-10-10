import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'HR Padi — Resume Parser',
  description: 'Upload an applicant resume PDF and get a structured candidate profile with a fit score in seconds. Built for the Prolanz BOS platform.',
};

export const viewport: Viewport = { themeColor: '#f8f6f6' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
