# 🍋 Lemonade Stand Game

A modern web3 take on the classic Lemonade Stand game, built with Next.js and zkVerify wallet integration.

## 🎮 Play Now

Visit [https://lemonade-v2.vercel.app](https://lemonade-v2.vercel.app) to play!

## 🎯 Game Overview

Run your virtual lemonade stand and try to make the most profit in 7 days! You'll need to:
- Manage your inventory (lemons, sugar, ice)
- Set your recipe and prices
- Choose advertising strategies
- Watch the weather and adapt your strategy
- Make smart business decisions to maximize profit

## 🎲 Game Rules

1. Start with $20 initial capital
2. Buy ingredients at market prices:
   - Lemons: $0.50 each
   - Sugar: $0.25 per unit
   - Ice: $0.10 per cube
3. Set your recipe (lemons, sugar, ice per cup)
4. Choose your selling price
5. Select advertising options
6. Weather affects your sales:
   - Sunny: Best for sales
   - Cloudy: Moderate sales
   - Rainy: Lower sales
7. Ice melts at the end of each day
8. Game ends after 7 days
9. Your final score is your total money

## 🔧 Development Setup

```bash
# Clone the repository
git clone https://github.com/blockops1/lemonade-v2.git

# Install dependencies
cd lemonade-v2
npm install

# Set up environment variables
cp .env.example .env  # Create .env file from example
# Edit .env and add your wallet seed phrase

# Run development server
npm run dev
```

### Environment Variables

The following environment variables are required:

- `WALLET_SEED_PHRASE`: Your zkVerify wallet seed phrase for on-chain verification

Create a `.env` file in the root directory with these variables. Never commit your `.env` file to version control!

## 🛠 Tech Stack

- Next.js 14
- TypeScript
- zkVerify Wallet Integration
- Vercel Analytics
- CSS Modules
- Circom for Zero-Knowledge Proofs
- Groth16 Protocol
- zkVerify.js for On-Chain Verification

## 📈 Features

- Real-time weather system
- Dynamic pricing
- Inventory management
- Advertising system
- Daily sales reports
- Wallet integration
- Mobile responsive design
- Zero-Knowledge Proof Verification
- On-Chain Game State Verification

## 🔐 Zero-Knowledge Integration

The game uses zero-knowledge proofs to verify game state transitions on-chain. This ensures:
- Transparent and verifiable game progression
- Fair play without revealing private game state
- Secure and efficient on-chain verification

### Circuit Details

The game uses a Groth16 circuit (`lemonade_basic.circom`) that verifies:
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

### Setup and Verification

```bash
# Generate verification key
cd src/circuits/groth16
snarkjs groth16 setup lemonade_basic.r1cs pot12_final.ptau lemonade_basic_final.zkey

# Generate proof
snarkjs groth16 prove lemonade_basic_final.zkey witness.wtns proof.json public.json

# Verify proof
node src/scripts/test_verify.cjs
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this code for your own projects!

## 🙏 Credits

- Original Lemonade Stand game concept
- zkVerify team for wallet integration
- Next.js team for the amazing framework
- All contributors and players!
