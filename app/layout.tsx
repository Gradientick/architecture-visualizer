import type { Metadata } from 'next';
import './globals.css';
import 'reactflow/dist/style.css';

export const metadata: Metadata = {
  title: 'Architecture Visualizer',
  description: 'Generate interactive architecture diagrams from local projects or websites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
