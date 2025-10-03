import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { client_id, meeting_title, audio_url, transcript_text } = body;
    if (!client_id) {
      return new Response(JSON.stringify({ error: 'client_id is required.' }), { status: 400 });
    }
    const { data, error } = await supabase
      .from('transcripts')
      .insert([{ client_id, meeting_title, audio_url, transcript_text }])
      .select();
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ transcript: data[0] }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
