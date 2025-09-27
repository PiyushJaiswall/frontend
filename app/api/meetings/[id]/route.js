import { supabase } from '../../../../lib/supabaseClient';
import { NextResponse } from 'next/server';

// GET a single meeting by ID
export async function GET(request, { params }) {
    const { id } = params;
    const { data, error } = await supabase.from('meetings').select('*').eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

// UPDATE a meeting
export async function PUT(request, { params }) {
    const { id } = params;
    const body = await request.json();
    const { data, error } = await supabase.from('meetings').update(body).eq('id', id).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data[0]);
}

// DELETE a meeting
export async function DELETE(request, { params }) {
    const { id } = params;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Meeting deleted successfully' });
}
