import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// GET: fetch meetings (unchanged)
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
    const { title, summary, key_points, followup_points, transcript_text = '' } = body

    // Validation
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Step 1: Create transcript record first
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        client_id: 'manual_entry', // Static identifier for manual entries
        meeting_title: title,
        audio_url: null, // No audio for manual entries
        transcript_text: transcript_text || '', // Use provided transcript or empty string
        transcript_created_at: new Date().toISOString()
      })
      .select()

    if (transcriptError) {
      console.error('Transcript creation error:', transcriptError)
      return new Response(JSON.stringify({ error: transcriptError.message || 'Failed to create transcript' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const transcript = transcriptData[0]

    // Step 2: Create meeting record with the transcript_id
    const { data: meetingData, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        transcript_id: transcript.id,
        title,
        summary,
        key_points,
        followup_points
      })
      .select()

    if (meetingError) {
      console.error('Meeting creation error:', meetingError)
      // Clean up: delete the transcript record if meeting creation fails
      await supabase
        .from('transcripts')
        .delete()
        .eq('id', transcript.id)
      
      return new Response(JSON.stringify({ error: meetingError.message || 'Failed to create meeting' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const meeting = meetingData[0]

    // Return the complete meeting object with transcript data
    const completeData = {
      ...meeting,
      client_id: transcript.client_id,
      transcript_text: transcript.transcript_text,
      transcript_created_at: transcript.transcript_created_at
    }

    return new Response(JSON.stringify({ meeting: completeData }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
