const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function generateProof(input) {
    const wasmPath = path.join(__dirname, "lemonade_new_js/lemonade_new.wasm");
    const zkeyPath = path.join(__dirname, "lemonade_new_final.zkey");
    
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
