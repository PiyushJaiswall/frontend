import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get token from cookie
    const cookies = request.cookies;
    const token = cookies.get('meetingRecorderToken')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': 'chrome-extension://*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      token: token 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',  // ✅ Allow Chrome extensions
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

// ✅ Handle OPTIONS preflight request
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
