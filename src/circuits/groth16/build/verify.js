const snarkjs = require('snarkjs');

async function generateProof(input) {
    try {
        // Load the zkey file
        const zkeyResponse = await fetch('/circuits/groth16/build/lemonade_new_final.zkey');
        const zkeyBuffer = await zkeyResponse.arrayBuffer();

        // Load the WASM file
        const wasmResponse = await fetch('/circuits/groth16/build/lemonade_new_js/lemonade_new.wasm');
        const wasmBuffer = await wasmResponse.arrayBuffer();

        // Generate the proof using the buffers directly
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            new Uint8Array(wasmBuffer),
            new Uint8Array(zkeyBuffer)
        );

        return { proof, publicSignals };
    } catch (error) {
        console.error('Error generating proof:', error);
        throw error;
    }
}

async function verifyProof(proof, publicSignals) {
    try {
        // Load the verification key
        const vkeyResponse = await fetch('/circuits/groth16/build/lemonade_new_verification_key.json');
        const vkey = await vkeyResponse.json();

        // Verify the proof
        const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
        return isValid;
    } catch (error) {
        console.error('Error verifying proof:', error);
        throw error;
    }
}

module.exports = {
    generateProof,
    verifyProof
}; 