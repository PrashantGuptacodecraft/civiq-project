import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CivIQ',
  description: 'Civic intelligence and issue reporting platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
