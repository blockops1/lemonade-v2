#!/bin/bash

# Exit on any error
set -e

# Configuration
CIRCUIT_NAME="lemonade_new"
BUILD_DIR="build"
PHASE1_PATH="$BUILD_DIR/pot12_final.ptau"
NODE_MODULES_PATH=$(cd ../../../node_modules && pwd)
POWERS_OF_TAU_URL="https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check circom
    if ! command -v circom &> /dev/null; then
        log_error "circom is not installed. Please install it first."
        exit 1
    fi
    
    # Check snarkjs
    if ! command -v snarkjs &> /dev/null; then
        log_error "snarkjs is not installed. Please install it first."
        exit 1
    fi
    
    # Check node
    if ! command -v node &> /dev/null; then
        log_error "node is not installed. Please install it first."
        exit 1
    fi
}

setup_directories() {
    log_info "Setting up directories..."
    mkdir -p "$BUILD_DIR"
    mkdir -p "$BUILD_DIR/${CIRCUIT_NAME}_js"
}

compile_circuit() {
    log_info "Compiling circuit..."
    circom "$CIRCUIT_NAME.circom" \
        --r1cs --wasm --sym --c \
        -l "$NODE_MODULES_PATH/circomlib/circuits" \
        --output "$BUILD_DIR"
}

download_powers_of_tau() {
    if [ ! -f "$PHASE1_PATH" ]; then
        log_info "Downloading Powers of Tau file..."
        curl -L "$POWERS_OF_TAU_URL" -o "$PHASE1_PATH"
    else
        log_info "Powers of Tau file already exists"
    fi
}

setup_proving_system() {
    log_info "Setting up proving system..."
    
    # Generate the proving key
    log_info "Generating initial proving key..."
    snarkjs groth16 setup \
        "$BUILD_DIR/$CIRCUIT_NAME.r1cs" \
        "$PHASE1_PATH" \
        "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey"
    
    # Contribute to the phase 2 ceremony
    log_info "Contributing to phase 2 ceremony..."
    snarkjs zkey contribute \
        "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey" \
        "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" \
        --name="1st Contributor" -v -e="random"
    
    # Export verification key
    log_info "Exporting verification key..."
    snarkjs zkey export verificationkey \
        "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" \
        "$BUILD_DIR/verification_key.json"
    
    # Generate Solidity verifier
    log_info "Generating Solidity verifier..."
    snarkjs zkey export solidityverifier \
        "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" \
        "$BUILD_DIR/verifier.sol"
}

generate_witness() {
    log_info "Generating witness..."
    cd "$BUILD_DIR/${CIRCUIT_NAME}_js" || exit
    
    if [ -f "../input.json" ]; then
        node generate_witness.js "${CIRCUIT_NAME}.wasm" "../input.json" witness.wtns
    else
        log_error "input.json not found. Skipping witness generation."
    fi
    
    cd ../..
}

create_verification_helpers() {
    log_info "Creating verification helpers..."
    cat > "$BUILD_DIR/verify.js" << EOL
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function generateProof(input) {
    const wasmPath = path.join(__dirname, "${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm");
    const zkeyPath = path.join(__dirname, "${CIRCUIT_NAME}_final.zkey");
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
    );
    return { proof, publicSignals };
}

async function verifyProof(proof, publicSignals) {
    const vKeyPath = path.join(__dirname, "verification_key.json");
    const vKey = JSON.parse(fs.readFileSync(vKeyPath));
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
}

module.exports = {
    generateProof,
    verifyProof
};
EOL
}

# Main execution
main() {
    log_info "Starting circuit compilation process..."
    
    check_dependencies
    setup_directories
    compile_circuit
    download_powers_of_tau
    setup_proving_system
    generate_witness
    create_verification_helpers
    
    log_info "Circuit compilation completed successfully!"
    log_info "Build artifacts are in the ${BUILD_DIR} directory"
}

# Run main function
main 