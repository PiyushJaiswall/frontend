// This file should proxy requests to the backend instead of directly accessing Supabase
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://piyushjaiswall-backend.hf.space';

// Helper function to get auth headers from cookies
function getAuthHeaders(request) {
    const authCookie = request.cookies.get('auth_session');
    
    if (!authCookie) {
        throw new Error('Not authenticated');
    }
    
    return {
        'Cookie': `auth_session=${authCookie.value}`,
        'Content-Type': 'application/json'
    };
}

export async function GET(request) {
    try {
        const headers = getAuthHeaders(request);
        
        const response = await fetch(`${BACKEND_URL}/meetings`, {
            headers,
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json(
                { error: `Backend error: ${error}` },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        
        return NextResponse.json({
            meetings: data.meetings || []
        });
        
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const headers = getAuthHeaders(request);
        const body = await request.json();
        
        // For manual entry, we'll still use direct Supabase
        // since the backend doesn't have this endpoint yet
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { title, summary, key_points, followup_points, transcript_text } = body;
        
        // Validation
        if (!title) {
            return NextResponse.json(
                { error: 'Title is required.' },
                { status: 400 }
            );
        }
        
        // Step 1: Create transcript record
        const { data: transcriptData, error: transcriptError } = await supabase
            .from('transcripts')
            .insert({
                client_id: 'manual_entry',
                meeting_title: title,
                audio_url: null,
                transcript_text: transcript_text || '',
                transcript_created_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (transcriptError) {
            console.error('Transcript creation error:', transcriptError);
            return NextResponse.json(
                { error: transcriptError.message || 'Failed to create transcript' },
                { status: 500 }
            );
        }
        
        // Step 2: Create meeting record
        const { data: meetingData, error: meetingError } = await supabase
            .from('meetings')
            .insert({
                transcript_id: transcriptData.id,
                title,
                summary,
                key_points,
                followup_points
            })
            .select()
            .single();
            
        if (meetingError) {
            console.error('Meeting creation error:', meetingError);
            // Clean up transcript if meeting creation fails
            await supabase
                .from('transcripts')
                .delete()
                .eq('id', transcriptData.id);
                
            return NextResponse.json(
                { error: meetingError.message || 'Failed to create meeting' },
                { status: 500 }
            );
        }
        
        // Return complete meeting data
        const completeData = {
            ...meetingData,
            client_id: transcriptData.client_id,
            transcript_text: transcriptData.transcript_text,
            transcript_created_at: transcriptData.transcript_created_at
        };
        
        return NextResponse.json({ meeting: completeData }, { status: 201 });
        
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
