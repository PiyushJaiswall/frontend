import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request) {
  try {
    // Updated query to join both tables and get complete data
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
      return Response.json({ error: 'Failed to fetch meetings' }, { status: 500 })
    }

    // Transform data to match frontend expectations
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
      // Include transcript data
      client_id: meeting.transcripts.client_id,
      transcript_text: meeting.transcripts.transcript_text,
      transcript_created_at: meeting.transcripts.transcript_created_at
    }))

    return Response.json({ meetings: transformedData })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { title, summary, key_points, followup_points, transcript_id } = body

    // Insert into meetings table (transcript should already exist from backend)
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        transcript_id,
        title,
        summary,
        key_points,
        followup_points
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: 'Failed to create meeting' }, { status: 500 })
    }

    return Response.json({ meeting: data[0] })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
