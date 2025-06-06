import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const extrinsicId = searchParams.get('extrinsicId');

  if (!extrinsicId) {
    return NextResponse.json({ error: 'Extrinsic ID is required' }, { status: 400 });
  }

  try {
    console.log('Fetching extrinsic data for:', extrinsicId);
    
    // Fetch the extrinsic page
    const response = await fetch(`https://zkverify-testnet.subscan.io/extrinsic/${extrinsicId}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0'
      }
    });

    console.log('Block explorer response status:', response.status);
    console.log('Block explorer response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`Failed to fetch extrinsic data: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML response length:', html.length);
    console.log('First 500 chars of HTML:', html.substring(0, 500));
    
    // Extract the JSON data from the __NEXT_DATA__ script tag
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!nextDataMatch) {
      console.error('Could not find __NEXT_DATA__ script tag');
      // Try to find any script tag with JSON data
      const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
      console.log('Found script tags:', scriptTags?.length);
      throw new Error('Could not find __NEXT_DATA__ in response');
    }

    const jsonData = JSON.parse(nextDataMatch[1]);
    console.log('Found JSON data structure:', {
      hasProps: !!jsonData.props,
      hasPageProps: !!jsonData.props?.pageProps,
      hasData: !!jsonData.props?.pageProps?.data,
      hasParams: !!jsonData.props?.pageProps?.data?.params
    });
    
    // Extract the proof data from the params array
    const params = jsonData.props.pageProps.data.params;
    if (!params || !Array.isArray(params)) {
      console.error('No params array found in JSON data:', jsonData);
      throw new Error('No parameters found in the response');
    }

    console.log('Found parameters:', params);
    console.log('Parameter details:', params.map(param => ({
      name: param.name,
      type: param.type,
      value: param.value
    })));

    // Return the data in the format expected by decodeProof
    const responseData = {
      data: {
        parameters: params
      }
    };
    console.log('Sending response:', responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch proof data' },
      { status: 500 }
    );
  }
} 