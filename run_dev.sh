#!/bin/bash

# Install dependencies and build Next.js project
echo "Installing dependencies and building Next.js project..."
npm install
NODE_ENV=production npm run build

# Start the Rust backend server
echo "Starting Rust backend server..."
cd server
cargo run &
cd ..

# Start the Next.js development server
echo "Starting Next.js development server..."
npm run dev 