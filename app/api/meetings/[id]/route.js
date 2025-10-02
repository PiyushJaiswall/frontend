import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = params

    // Get meeting with transcript data
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        transcripts!inner(
          client_id,
          meeting_title,
          audio_url,
          transcript_text,
          transcript_created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: 'Meeting not found' }, { status: 404 })
    }

    // Transform data
    const transformedData = {
      id: data.id,
      transcript_id: data.transcript_id,
      title: data.title,
      summary: data.summary,
      key_points: data.key_points || [],
      followup_points: data.followup_points || [],
      next_meet_schedule: data.next_meet_schedule,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Include transcript data
      client_id: data.transcripts.client_id,
      meeting_title: data.transcripts.meeting_title,
      audio_url: data.transcripts.audio_url,
      transcript_text: data.transcripts.transcript_text,
      transcript_created_at: data.transcripts.transcript_created_at
    }

    return Response.json({ meeting: transformedData })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, summary, key_points, followup_points, next_meet_schedule } = body

    const { data, error } = await supabase
      .from('meetings')
      .update({
        title,
        summary,
        key_points,
        followup_points,
        next_meet_schedule
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: 'Failed to update meeting' }, { status: 500 })
    }

    return Response.json({ meeting: data[0] })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Delete meeting (transcript will remain for audit purposes)
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: 'Failed to delete meeting' }, { status: 500 })
    }

    return Response.json({ message: 'Meeting deleted successfully' })

  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
