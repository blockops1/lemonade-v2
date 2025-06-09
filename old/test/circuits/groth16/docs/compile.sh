#!/bin/bash

echo "[INFO] Starting circuit compilation process..."

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "[ERROR] circom is not installed. Please install it first."
    exit 1
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "[ERROR] snarkjs is not installed. Please install it first."
    exit 1
fi

echo "[INFO] Checking dependencies..."

# Create build directory if it doesn't exist
mkdir -p build

echo "[INFO] Setting up directories..."

# Compile the circuit
echo "[INFO] Compiling circuit..."
circom lemonade_basic.circom --r1cs --wasm --sym --c -o build

# Check if compilation was successful
if [ $? -ne 0 ]; then
    echo "[ERROR] Circuit compilation failed"
    exit 1
fi

# Create ptau directory if it doesn't exist
mkdir -p ptau

# Copy the existing powers of tau file and proving key
echo "[INFO] Copying existing files..."
cp ../../../src/circuits/groth16/ptau/powersOfTau28_hez_final_15.ptau ptau/
cp ../../../src/circuits/groth16/build/lemonade_basic_final.zkey build/

# Export the verification key
echo "[INFO] Exporting verification key..."
snarkjs zkey export verificationkey build/lemonade_basic_final.zkey build/lemonade_basic_verification_key.json

# Generate Solidity verifier
echo "[INFO] Generating Solidity verifier..."
snarkjs zkey export solidityverifier build/lemonade_basic_final.zkey build/lemonade_basic_verifier.sol

# Generate witness if input.json exists
if [ -f "input.json" ]; then
    echo "[INFO] Generating witness..."
    node build/lemonade_basic_js/generate_witness.js build/lemonade_basic_js/lemonade_basic.wasm input.json build/witness.wtns
else
    echo "[ERROR] input.json not found. Skipping witness generation."
fi

echo "[INFO] Creating verification helpers..."
# Create a simple verification helper
cat > build/verify.sh << 'EOF'
#!/bin/bash
snarkjs groth16 verify build/lemonade_basic_verification_key.json build/public.json build/proof.json
EOF

chmod +x build/verify.sh

echo "[INFO] Circuit compilation completed successfully!"
echo "[INFO] Build artifacts are in the build directory" 