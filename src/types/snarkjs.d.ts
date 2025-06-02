declare module 'snarkjs' {
  export interface Proof {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  }

  export interface FullProveResult {
    proof: Proof;
    publicSignals: string[];
  }

  export const groth16: {
    fullProve: (
      input: any,
      wasmFile: string,
      zkeyFile: string
    ) => Promise<FullProveResult>;
    verify: (
      verificationKey: any,
      publicSignals: string[],
      proof: Proof
    ) => Promise<boolean>;
  };

  export const plonk: {
    fullProve: (
      input: any,
      wasmFile: string,
      zkeyFile: string
    ) => Promise<FullProveResult>;
    verify: (
      verificationKey: any,
      publicSignals: string[],
      proof: Proof
    ) => Promise<boolean>;
  };
} 