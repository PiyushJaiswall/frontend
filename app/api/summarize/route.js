import { supabase } from '../../../lib/supabaseClient';
import { NextResponse } from 'next/server';

// Free text summarization function using frequency analysis
function simpleFrequencySummarization(text, maxSentences = 3) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= maxSentences) {
        return sentences.join('. ').trim();
    }
    
    // Calculate word frequency
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !isStopWord(word));
    
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Score sentences based on word frequency
    const sentenceScores = sentences.map(sentence => {
        const sentWords = sentence.toLowerCase().split(/\s+/);
        const score = sentWords.reduce((sum, word) => {
            const cleanWord = word.replace(/[^\w]/g, '');
            return sum + (wordFreq[cleanWord] || 0);
        }, 0);
        return { sentence: sentence.trim(), score };
    });
    
    // Get top sentences
    const topSentences = sentenceScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSentences)
        .map(item => item.sentence)
        .join('. ');
    
    return topSentences;
}

function isStopWord(word) {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'as', 'are', 'was', 'will', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'our', 'their', 'mine', 'yours', 'ours', 'theirs', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves', 'what', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'don', 'should', 'now'];
    return stopWords.includes(word.toLowerCase());
}

function extractKeyPoints(text, maxPoints = 3) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Look for sentences with keywords that indicate importance
    const importantKeywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant', 'major', 'conclude', 'summary', 'result', 'outcome', 'decision', 'action', 'next', 'follow'];
    
    const keyPointSentences = sentences.map(sentence => {
        const lowerSentence = sentence.toLowerCase();
        const keywordScore = importantKeywords.reduce((score, keyword) => {
            return score + (lowerSentence.includes(keyword) ? 2 : 0);
        }, 0);
        
        // Prefer shorter, more concise sentences for key points
        const lengthScore = Math.max(0, 100 - sentence.length);
        const totalScore = keywordScore + (lengthScore * 0.1);
        
        return { sentence: sentence.trim(), score: totalScore };
    });
    
    return keyPointSentences
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPoints)
        .map(item => item.sentence.replace(/^[^a-zA-Z]*/, '')); // Clean up leading punctuation
}

export async function POST() {
    try {
        // 1. Fetch transcripts that haven't been summarized yet
        const { data: transcripts, error: tError } = await supabase
            .from('transcripts')
            .select('id, transcript_text, meeting_title, created_at')
            .not('id', 'in', `(select transcript_id from meetings where transcript_id is not null)`);

        if (tError) throw new Error(`Supabase transcript fetch error: ${tError.message}`);
        if (!transcripts || transcripts.length === 0) {
            return NextResponse.json({ message: "No new transcripts to summarize.", processedCount: 0 });
        }

        let processedCount = 0;
        for (const transcript of transcripts) {
            if (!transcript.transcript_text || transcript.transcript_text.trim().length < 50) continue;

            try {
                // Use free frequency-based summarization
                const summary = simpleFrequencySummarization(transcript.transcript_text, 2);
                const key_points = extractKeyPoints(transcript.transcript_text, 4);
                const followup_points = ["Follow up on discussed action items", "Schedule next meeting", "Review progress on key decisions"];

                // 3. Insert into meetings table
                const { error: mError } = await supabase.from('meetings').insert({
                    transcript_id: transcript.id,
                    title: transcript.meeting_title || 'Meeting Summary',
                    summary: summary || 'Summary could not be generated',
                    key_points: key_points.length > 0 ? key_points : ['Key points could not be extracted'],
                    followup_points: followup_points,
                });

                if (mError) {
                    console.error(`Failed to insert summary for transcript ${transcript.id}:`, mError.message);
                } else {
                    processedCount++;
                }

            } catch (summaryError) {
                console.error(`Summarization failed for transcript ${transcript.id}:`, summaryError);
                // Continue with next transcript
                continue;
            }
        }
        
        return NextResponse.json({ 
            message: "Summarization complete using free algorithm.", 
            processedCount,
            method: "frequency-based"
        });

    } catch (error) {
        console.error('Summarization API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
