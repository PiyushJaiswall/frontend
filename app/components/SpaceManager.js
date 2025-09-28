'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function SpaceManager() {
    const [stats, setStats] = useState({ meetings: 0, transcripts: 0, validTranscripts: 0, unsummarized: 0 });
    const [meetings, setMeetings] = useState([]);
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(true);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const lastAutoSummarizeAttempt = useRef(0);
    
    // Function to check if transcript is valid (same logic as API)
    const isValidTranscript = (transcript) => {
        if (!transcript || !transcript.transcript_text) return false;
        
        const text = transcript.transcript_text.trim();
        if (text.length === 0) return false;
        if (text.length < 20) return false;
        
        const meaningfulContent = text.replace(/[\s\.,!?;:-]+/g, '');
        if (meaningfulContent.length < 10) return false;
        
        const testPhrases = ['test', 'testing', 'hello test', 'mic test', 'one two three'];
        const lowerText = text.toLowerCase();
        const isJustTestPhrase = testPhrases.some(phrase => {
            return lowerText === phrase || lowerText.replace(/[^a-z\s]/g, '').trim() === phrase;
        });
        
        if (isJustTestPhrase && text.length < 50) return false;
        
        return true;
    };
    
    async function fetchStats() {
        try {
            const { count: meetingsCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true });
            const { count: transcriptsCount } = await supabase.from('transcripts').select('*', { count: 'exact', head: true });
            
            // Get all transcripts and filter for valid ones
            const { data: allTranscripts } = await supabase
                .from('transcripts')
                .select('id, transcript_text')
                .not('transcript_text', 'is', null);
            
            const { data: summarizedTranscripts } = await supabase
                .from('meetings')
                .select('transcript_id')
                .not('transcript_id', 'is', null);
            
            // Filter for valid transcripts only
            const validTranscripts = allTranscripts?.filter(isValidTranscript) || [];
            const summarizedIds = new Set(summarizedTranscripts?.map(m => m.transcript_id) || []);
            const unsummarizedValidTranscripts = validTranscripts.filter(t => !summarizedIds.has(t.id));
            
            setStats({ 
                meetings: meetingsCount || 0, 
                transcripts: transcriptsCount || 0,
                validTranscripts: validTranscripts.length,
                unsummarized: unsummarizedValidTranscripts.length
            });

            // Auto-summarize logic with proper safeguards
            const now = Date.now();
            const timeSinceLastAttempt = now - lastAutoSummarizeAttempt.current;
            const shouldAutoSummarize = autoSummarizeEnabled && 
                                      unsummarizedValidTranscripts.length > 0 && 
                                      !isSummarizing &&
                                      timeSinceLastAttempt > 30000;

            if (shouldAutoSummarize) {
                console.log(`🤖 Auto-summarizing ${unsummarizedValidTranscripts.length} valid transcripts...`);
                lastAutoSummarizeAttempt.current = now;
                await triggerSummarize();
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to fetch statistics');
        }
    }

    async function fetchAllMeetings() {
        try {
            const { data, error } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setMeetings(data);
        } catch (error) {
            console.error('Error fetching meetings:', error);
        }
    }
    
    useEffect(() => {
        fetchStats();
        fetchAllMeetings();

        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transcripts' }, (payload) => {
                console.log('Transcript change detected:', payload.eventType);
                toast.success('New transcript detected!', { icon: '📝' });
                lastAutoSummarizeAttempt.current = 0;
                setTimeout(fetchStats, 1000);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
                console.log('Meeting change detected:', payload.eventType);
                toast.success('Database updated!', { icon: '💾' });
                fetchStats();
                fetchAllMeetings();
            })
            .subscribe();

        const interval = setInterval(() => {
            if (!isSummarizing) {
                fetchStats();
            }
        }, 60000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [autoSummarizeEnabled, isSummarizing]);

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            try {
                const { error } = await supabase.from('meetings').delete().eq('id', id);
                if (error) throw error;
                toast.success('Meeting deleted.');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };
    
    const triggerSummarize = async () => {
        if (isSummarizing) {
            toast.error('Summarization already in progress...');
            return;
        }

        setIsSummarizing(true);
        const toastId = toast.loading('Summarizing valid transcripts...');
        
        try {
            const response = await fetch('/api/summarize', { method: 'POST' });
            const result = await response.json();
            
            console.log('Summarization result:', result);
            
            if (response.ok) {
                if (result.processedCount > 0) {
                    toast.success(
                        `Successfully summarized ${result.processedCount} transcript(s) using ${result.method || 'free'} method.`, 
                        { id: toastId }
                    );
                } else {
                    toast.info(
                        result.message || 'No valid transcripts found to summarize.',
                        { id: toastId }
                    );
                }
                fetchStats();
                fetchAllMeetings();
            } else {
                toast.error(result.error || 'Summarization failed.', { id: toastId });
            }
        } catch (error) {
            console.error('Summarization error:', error);
            toast.error('Failed to connect to summarization service.', { id: toastId });
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Storage Overview */}
            <div className="p-6 bg-secondary rounded-lg">
                <h2 className="text-xl font-bold mb-4">Storage Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Total Meetings</p>
                        <p className="text-2xl font-bold">{stats.meetings}</p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Total Transcripts</p>
                        <p className="text-2xl font-bold">{stats.transcripts}</p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Valid Transcripts</p>
                        <p className="text-2xl font-bold text-blue-400">{stats.validTranscripts}</p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Unsummarized</p>
                        <p className={`text-2xl font-bold ${stats.unsummarized > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.unsummarized}
                        </p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Auto Summary</p>
                        <div className="flex flex-col items-center">
                            <p className={`text-sm font-bold ${autoSummarizeEnabled ? 'text-green-400' : 'text-red-400'}`}>
                                {autoSummarizeEnabled ? 'ON' : 'OFF'}
                            </p>
                            {isSummarizing && (
                                <p className="text-xs text-yellow-400">Processing...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
             <div className="p-6 bg-secondary rounded-lg">
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                <div className="space-y-4">
                    <button 
                        onClick={triggerSummarize}
                        disabled={isSummarizing}
                        className={`w-full px-4 py-2 font-bold text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${
                            isSummarizing 
                                ? 'bg-gray-600 cursor-not-allowed' 
                                : 'bg-accent hover:bg-blue-700'
                        }`}
                    >
                        {isSummarizing 
                            ? 'Summarizing...' 
                            : `Summarize Valid Transcripts (${stats.unsummarized} pending)`
                        }
                    </button>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-light-gray">Auto-Summarization:</span>
                        <button 
                            onClick={() => setAutoSummarizeEnabled(!autoSummarizeEnabled)}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                                autoSummarizeEnabled 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                        >
                            {autoSummarizeEnabled ? '
