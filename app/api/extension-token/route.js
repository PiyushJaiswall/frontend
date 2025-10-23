import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get token from cookie (set during login)
    const cookies = request.cookies;
    const token = cookies.get('meetingRecorderToken')?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: true, 
      token: token 
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
