# Lemonade Stand Game with Zero-Knowledge Proofs

A Next.js application that implements a lemonade stand game with zero-knowledge proof verification on the zkVerify testnet.

## 🎮 Play Now

Visit [https://lemonade-v2.vercel.app](https://lemonade-v2.vercel.app) to play!

## 🎯 Game Overview

Run your virtual lemonade stand and try to make the most profit in 7 days! You'll need to:
- Manage your inventory (lemons, sugar, ice)
- Set your price per cup
- Choose advertising strategies
- Watch the weather and adapt your strategy
- Make smart business decisions to maximize profit
- Submit your game results as a zero-knowledge proof
- Compete on the global leaderboard

## 🎲 Game Rules

1. Start with $120.00 initial capital
2. Buy ingredients at market prices:
   - Lemons: $0.50 each
   - Sugar: $0.30 each
   - Ice: $0.20 each
3. Each cup of lemonade requires:
   - 2 lemons
   - 1 sugar
   - 3 ice cubes (all ice melts at end of day)
4. Set your price per cup (between $0.50 and $6.00)
5. Choose advertising options to attract more customers:
   - None: No additional cost
   - Flyers: $10/day, 1.2x customer multiplier
   - Social Media: $25/day, 1.5x customer multiplier
   - Radio: $50/day, 2x customer multiplier
6. Weather affects your sales:
   - Sunny: Best for sales
   - Cloudy: Moderate sales
   - Rainy: Lower sales
7. Game ends after 7 days
8. Your final score is your total profit
9. Submit your game results as a zero-knowledge proof to verify your score on-chain
10. Your verified score will be added to the global leaderboard

## 🛠 Tech Stack

- **Frontend Framework**: Next.js 14
- **Language**: TypeScript
- **UI**: React 18, CSS Modules
- **Wallet Integration**: Talisman Wallet
- **Zero-Knowledge Proofs**: 
  - Groth16 Protocol
  - Circom for circuit development
  - snarkjs for proof generation
- **On-Chain Verification**: zkVerify.js
- **Database**: Neon Postgres (Serverless)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel

## 📦 Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
│   ├── ConnectWalletButton/  # Wallet connection UI
│   ├── GameControls/    # Game input controls
│   ├── GameStatus/      # Game state display
│   └── WalletInstructions/   # Wallet setup guide
├── circuits/           # Zero-knowledge circuits
│   └── groth16/       # Groth16 implementation
├── context/           # React context providers
├── game/             # Game logic and state management
├── hooks/            # Custom React hooks
├── proofs/           # Zero-knowledge proofs
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/blockops1/lemonade-v2.git

# Install dependencies
cd lemonade-v2
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Neon Postgres DATABASE_URL to .env.local

# Run development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:
```
DATABASE_URL=your_neon_postgres_connection_string
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test:proof` - Test proof generation

## 🔐 Zero-Knowledge Integration

The game uses zero-knowledge proofs to verify game state transitions on the zkVerify testnet. This ensures:
- Transparent and verifiable game progression
- Fair play without revealing private game state
- Secure and efficient on-chain verification

### Circuit Details

The game uses a Groth16 circuit that verifies:
- Starting money (public input)
- Final money (public input)
- Days played (public input)
- Daily money calculations (private inputs)
- Daily revenue (private inputs)
- Daily advertising costs (private inputs)

### Verification Process

1. Game state is captured in a witness
2. Proof is generated using snarkjs
3. Verification key is registered on-chain
4. Proof is verified using zkVerify.js
5. Game state is updated based on verification
6. Proof URL is generated for verification on the block explorer
7. Verified score is added to the global leaderboard

## 📊 Leaderboard System

The game features a global leaderboard powered by Neon Postgres:
- Real-time score updates
- Verified proof integration
- Player rankings
- Historical performance tracking
- Serverless architecture for optimal performance

## 📱 Features

- Real-time weather system
- Dynamic pricing ($0.50 to $6.00 per cup)
- Inventory management
- Advertising system with customer multipliers
- Daily sales reports
- Talisman wallet integration
- Mobile responsive design
- Zero-Knowledge Proof Verification
- On-Chain Game State Verification
- Block explorer integration for proof verification
- Proof decoder for detailed verification
- Global leaderboard with verified scores

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this code for your own projects!

## 🙏 Credits

- Original Lemonade Stand game concept
- zkVerify team for wallet integration
- Next.js team for the amazing framework
- Neon team for the serverless Postgres database
- All contributors and players!
