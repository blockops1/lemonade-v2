import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Lemonade Stand Game Preview';
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
          background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: 120, marginRight: '20px' }}>🍋</span>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <h1
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                margin: 0,
                color: '#0f172a',
              }}
            >
              Lemonade Stand
            </h1>
            <p
              style={{
                fontSize: 30,
                margin: 0,
                color: '#334155',
              }}
            >
              A Web3 Business Management Game
            </p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#334155',
              fontSize: 24,
            }}
          >
            🎮 7-Day Challenge
          </div>
          <div
            style={{
              background: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#334155',
              fontSize: 24,
            }}
          >
            💰 Make Profit
          </div>
          <div
            style={{
              background: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              color: '#334155',
              fontSize: 24,
            }}
          >
            🌞 Weather System
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
} 