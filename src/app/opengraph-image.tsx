import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Lemonade Stand Game';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 64, color: '#2563eb' }}>🍋 Lemonade Stand</div>
        <div style={{ fontSize: 32, color: '#4b5563' }}>ZK-Powered Game</div>
      </div>
    ),
    {
      ...size,
    }
  );
} 