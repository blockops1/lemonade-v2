import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const extrinsicId = searchParams.get('extrinsicId');

    if (!extrinsicId) {
      console.error('No extrinsic ID provided');
      return NextResponse.json(
        { error: 'Extrinsic ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching proof data for extrinsic:', extrinsicId);
    console.log('Using API key:', process.env.SUBSCAN_API_KEY ? 'Present' : 'Missing');

    // First, try to get the block number for this extrinsic
    const blockResponse = await fetch(
      'https://zkverify-testnet.api.subscan.io/api/scan/extrinsic',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SUBSCAN_API_KEY || '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          hash: extrinsicId
        })
      }
    );

    if (!blockResponse.ok) {
      const errorText = await blockResponse.text();
      console.error('Block API error:', errorText);
      throw new Error(`Block API responded with status: ${blockResponse.status}`);
    }

    const blockData = await blockResponse.json();
    console.log('Block data:', JSON.stringify(blockData, null, 2));

    if (!blockData.data) {
      throw new Error('No block data found');
    }

    // Now get the extrinsic details
    const response = await fetch(
      'https://zkverify-testnet.api.subscan.io/api/scan/extrinsic',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SUBSCAN_API_KEY || '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          block_num: blockData.data.block_num,
          extrinsic_index: blockData.data.extrinsic_index
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Extrinsic API error:', errorText);
      throw new Error(`Extrinsic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Extrinsic data:', JSON.stringify(data, null, 2));

    if (!data.data) {
      throw new Error('No extrinsic data found');
    }

    // Extract the parameters from the response
    const parameters = data.data.params || [];
    const formattedData = {
      data: {
        parameters: parameters.map((param: any) => ({
          name: param.name,
          value: param.value
        }))
      }
    };

    console.log('Formatted response:', JSON.stringify(formattedData, null, 2));
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error in proof API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch proof data' },
      { status: 500 }
    );
  }
} 