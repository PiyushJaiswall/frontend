import { supabase } from '../../../lib/supabaseClient';
import { HfInference } from '@huggingface/inference';
import { NextResponse } from 'next/server';

const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

export async function POST() {
    try {
        // 1. Fetch transcripts that haven't been summarized
        const { data: transcripts, error: tError } = await supabase
            .from('transcripts')
            .select('id, transcript_text, meeting_title, created_at')
            .is('id', `(select transcript_id from meetings) IS NULL`); // A way to check non-existence

        if (tError) throw new Error(`Supabase transcript fetch error: ${tError.message}`);
        if (!transcripts || transcripts.length === 0) {
            return NextResponse.json({ message: "No new transcripts to summarize.", processedCount: 0 });
        }

        let processedCount = 0;
        for (const transcript of transcripts) {
            if (!transcript.transcript_text) continue;

            // 2. Summarize using t5-small model
            const summaryResult = await hf.summarization({
                model: 't5-small',
                inputs: transcript.transcript_text,
                parameters: {
                    max_length: 150,
                    min_length: 30,
                }
            });

            const summary = summaryResult.summary_text;
            
            // A simple (dummy) way to extract key points and follow-ups
            const key_points = summary.split('. ').slice(0, 3).map(s => s.trim());
            const followup_points = ["Follow up on action items."]; // Placeholder

            // 3. Insert into meetings table
            const { error: mError } = await supabase.from('meetings').insert({
                transcript_id: transcript.id,
                title: transcript.meeting_title || 'Untitled Meeting',
                summary: summary,
                key_points: key_points,
                followup_points: followup_points,
            });

            if (mError) {
                console.error(`Failed to insert summary for transcript ${transcript.id}:`, mError.message);
            } else {
                processedCount++;
            }
        }
        
        return NextResponse.json({ message: "Summarization complete.", processedCount });

    } catch (error) {
        console.error('Summarization API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
