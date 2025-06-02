#!/bin/bash

# Create build directory
mkdir -p build

# Compile the circuit
circom lemonade.circom --r1cs --wasm --sym --c --output build

# Generate the witness
cd build/lemonade_js
node generate_witness.js lemonade.wasm ../input.json witness.wtns

# Generate the proving key
snarkjs groth16 setup ../lemonade.r1cs ../pot12_final.ptau lemonade_0000.zkey

# Contribute to the phase 2 ceremony
snarkjs zkey contribute lemonade_0000.zkey lemonade_final.zkey --name="1st Contributor" -v

# Export the verification key
snarkjs zkey export verificationkey lemonade_final.zkey verification_key.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier lemonade_final.zkey ../verifier.sol

echo "Circuit compilation complete!" 