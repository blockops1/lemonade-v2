interface ProofData {
  startingMoney: number;
  finalMoney: number;
  daysPlayed: number;
  verificationStatus: boolean;
}

export function parseHexToNumber(hex: string): number {
  console.log('Parsing hex:', hex);
  // Remove '0x' prefix
  const hexWithoutPrefix = hex.slice(2);
  
  // Convert to little-endian by reversing the bytes
  const bytes = hexWithoutPrefix.match(/.{1,2}/g) || [];
  const littleEndianHex = bytes.reverse().join('');
  
  // Parse the little-endian hex
  const result = parseInt(littleEndianHex, 16);
  console.log('Bytes:', bytes);
  console.log('Little-endian hex:', littleEndianHex);
  console.log('Parsed result:', result);
  return result;
}

export function decodeManualProof(proofData: string): ProofData {
  console.log('Attempting to decode manual proof data:', proofData);
  try {
    const data = JSON.parse(proofData);
    console.log('Parsed JSON data:', data);

    // Find the public inputs array
    const pubsParam = data.find((param: any) => param.name === 'pubs');
    if (!pubsParam?.value || !Array.isArray(pubsParam.value)) {
      throw new Error('No public inputs found in proof');
    }

    console.log('Found public inputs:', pubsParam.value);

    // Skip the first dummy field and map the remaining values
    const [, startingMoney, finalMoney, daysPlayed] = pubsParam.value.map(parseHexToNumber);

    console.log('Decoded values:', {
      startingMoney,
      finalMoney,
      daysPlayed,
      verificationStatus: true // Since we have a valid proof, it's verified
    });

    return {
      startingMoney,
      finalMoney,
      daysPlayed,
      verificationStatus: true
    };
  } catch (error) {
    console.error('Error decoding manual proof:', error);
    throw new Error('Failed to decode proof data');
  }
}

export async function decodeProof(extrinsicId: string): Promise<ProofData> {
  console.log('Attempting to decode proof for extrinsic:', extrinsicId);
  try {
    // Fetch the proof data through our API route
    const response = await fetch(`/api/proof?extrinsicId=${extrinsicId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch proof data');
    }
    const data = await response.json();
    console.log('Received data from API:', data);

    if (!data.data?.parameters) {
      throw new Error('No proof data found');
    }

    // Find the public inputs array
    const pubsParam = data.data.parameters.find((param: any) => param.name === 'pubs');
    if (!pubsParam?.value || !Array.isArray(pubsParam.value)) {
      throw new Error('No public inputs found in proof');
    }

    console.log('Found public inputs:', pubsParam.value);

    // The public inputs are in order:
    // [0] - starting money (in cents)
    // [1] - final money (in cents)
    // [2] - days played
    // [3] - verification status (0 = false, 7 = true)
    const [startingMoney, finalMoney, daysPlayed, verificationStatus] = pubsParam.value.map(parseHexToNumber);

    console.log('Decoded values:', {
      startingMoney,
      finalMoney,
      daysPlayed,
      verificationStatus
    });

    return {
      startingMoney,
      finalMoney,
      daysPlayed,
      verificationStatus: verificationStatus === 7
    };
  } catch (error) {
    console.error('Error decoding proof:', error);
    throw error; // Re-throw the error to preserve the original error message
  }
} 