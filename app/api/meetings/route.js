import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET: fetch meetings
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        transcripts!inner(
          client_id,
          transcript_text,
          transcript_created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message || 'Failed to fetch meetings' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const transformedData = data.map(meeting => ({
      id: meeting.id,
      transcript_id: meeting.transcript_id,
      title: meeting.title,
      summary: meeting.summary,
      key_points: meeting.key_points || [],
      followup_points: meeting.followup_points || [],
      next_meet_schedule: meeting.next_meet_schedule,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at,
      client_id: (meeting.transcripts && meeting.transcripts.client_id) || meeting.client_id || '',
      transcript_text: meeting.transcripts ? meeting.transcripts.transcript_text : '',
      transcript_created_at: meeting.transcripts ? meeting.transcripts.transcript_created_at : ''
    }))

    return new Response(JSON.stringify({ meetings: transformedData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST: manual entry of meeting
export async function POST(request) {
  try {
    const body = await request.json()
    const { title, summary, key_points, followup_points, transcript_id, client_id } = body

    // Validation: require title and client_id
    if (!title || !client_id) {
      return new Response(JSON.stringify({ error: 'Title and Client ID are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validation: key_points and followup_points should be arrays
    let kp = Array.isArray(key_points) ? key_points : (key_points ? [key_points] : []);
    let fp = Array.isArray(followup_points) ? followup_points : (followup_points ? [followup_points] : []);

    const { data, error } = await supabase
      .from('meetings')
      .insert([{
        transcript_id,
        title,
        summary,
        key_points: kp,
        followup_points: fp,
        client_id
      }])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message || 'Failed to create meeting' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!data || !data[0]) {
      // Defensive: insert succeeded but no data returned
      return new Response(JSON.stringify({ error: 'Meeting was not saved. Please check your data.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ meeting: data[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
