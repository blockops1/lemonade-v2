const snarkjs = require("snarkjs");

async function generateProof(input) {
    // In browser environment, we'll fetch these files directly from the public directory
    const wasmPath = "/circuits/lemonade_new_js/lemonade_new.wasm";
    const zkeyPath = "/circuits/lemonade_new_final.zkey";
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
    );
    return { proof, publicSignals };
}

async function verifyProof(proof, publicSignals) {
    const vKey = await import("./lemonade_new_verification_key.json");
    return await snarkjs.groth16.verify(vKey.default, publicSignals, proof);
}

module.exports = {
    generateProof,
    verifyProof
};
