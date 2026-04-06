import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '@/components/Nav';
import { ToastContainer } from '@/components/ui';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'StarkBrew — Buy Me a Coffee on Starknet',
  description: 'Support your favourite creators with USDC on Starknet. Gasless. Instant. No wallet setup.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Warm paper texture overlay */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(212,168,83,0.08) 0%, transparent 65%)' }} />
            <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,94,60,0.06) 0%, transparent 65%)' }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Nav />
            <main>{children}</main>
          </div>
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
