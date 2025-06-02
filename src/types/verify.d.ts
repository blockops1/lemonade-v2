declare module '../circuits/groth16/build/verify.js' {
    interface Proof {
        pi_a: string[];
        pi_b: string[][];
        pi_c: string[];
        protocol: string;
        curve: string;
    }

    interface ProofResult {
        proof: Proof;
        publicSignals: string[];
    }

    export function generateProof(input: any): Promise<ProofResult>;
    export function verifyProof(proof: Proof, publicSignals: string[]): Promise<boolean>;
} 