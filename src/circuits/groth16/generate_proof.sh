#!/bin/bash

# Exit on error
set -e

# Configuration
CIRCUIT_NAME="lemonade_new"
BUILD_DIR="build"
PHASE1_PATH="$BUILD_DIR/pot12_final.ptau"
POWERS_OF_TAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}1. Downloading Powers of Tau file...${NC}"
if [ ! -f "$PHASE1_PATH" ]; then
    mkdir -p "$BUILD_DIR"
    if ! command -v wget &> /dev/null; then
        echo -e "${RED}wget is not installed. Using curl instead...${NC}"
        curl -L "$POWERS_OF_TAU_URL" -o "$PHASE1_PATH"
    else
        wget -O "$PHASE1_PATH" "$POWERS_OF_TAU_URL"
    fi
fi

# Verify the file was downloaded correctly
if [ ! -f "$PHASE1_PATH" ]; then
    echo -e "${RED}Failed to download Powers of Tau file${NC}"
    exit 1
fi

echo -e "${GREEN}2. Installing snarkjs...${NC}"
npm install -g snarkjs

echo -e "${GREEN}3. Generating zkey...${NC}"
npx snarkjs groth16 setup "$BUILD_DIR/${CIRCUIT_NAME}.r1cs" "$PHASE1_PATH" "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey"

echo -e "${GREEN}4. Contributing to phase 2 ceremony...${NC}"
echo "test" | npx snarkjs zkey contribute "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey" "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey"

echo -e "${GREEN}5. Exporting verification key...${NC}"
npx snarkjs zkey export verificationkey "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" "$BUILD_DIR/${CIRCUIT_NAME}_verification_key.json"

echo -e "${GREEN}6. Generating proof with test input...${NC}"
node "$BUILD_DIR/${CIRCUIT_NAME}_js/generate_witness.js" "$BUILD_DIR/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm" input.json "$BUILD_DIR/witness.wtns"

echo -e "${GREEN}7. Generating proof...${NC}"
npx snarkjs groth16 prove "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" "$BUILD_DIR/witness.wtns" "$BUILD_DIR/proof.json" "$BUILD_DIR/public.json"

echo -e "${GREEN}8. Verifying proof...${NC}"
npx snarkjs groth16 verify "$BUILD_DIR/${CIRCUIT_NAME}_verification_key.json" "$BUILD_DIR/public.json" "$BUILD_DIR/proof.json"

echo -e "${GREEN}Done! Check the build directory for all generated files.${NC}" 