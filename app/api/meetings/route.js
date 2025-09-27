import { supabase } from '../../../lib/supabaseClient';
import { NextResponse } from 'next/server';

// GET all meetings
export async function GET() {
    const { data, error } = await supabase.from('meetings').select('*');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// POST a new meeting (for manual entry)
export async function POST(request) {
    const body = await request.json();
    const { data, error } = await supabase.from('meetings').insert(body).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data[0]);
}
