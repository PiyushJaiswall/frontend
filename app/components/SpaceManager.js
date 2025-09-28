'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function SpaceManager() {
    const [stats, setStats] = useState({ meetings: 0, transcripts: 0, validTranscripts: 0, unsummarized: 0 });
    const [meetings, setMeetings] = useState([]);
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(false); // CHANGED: Default to false
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [lastFailedAttempt, setLastFailedAttempt] = useState(null);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const lastAutoSummarizeAttempt = useRef(0);
    const consecutiveFailures = useRef(0);
    
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
            
            console.log('📊 Stats Update:', {
                total: transcriptsCount,
                valid: validTranscripts.length,
                unsummarized: unsummarizedValidTranscripts.length,
                consecutiveFailures: consecutiveFailures.current
            });
            
            setStats({ 
                meetings: meetingsCount || 0, 
                transcripts: transcriptsCount || 0,
                validTranscripts: validTranscripts.length,
                unsummarized: unsummarizedValidTranscripts.length
            });

            // STRICT Auto-summarize logic with failure tracking
            const now = Date.now();
            const timeSinceLastAttempt = now - lastAutoSummarizeAttempt.current;
            
            // Don't auto-summarize if:
            // 1. Auto-summarize is disabled
            // 2. Currently summarizing
            // 3. No unsummarized transcripts
            // 4. Too soon since last attempt (less than 2 minutes)
            // 5. Too many consecutive failures (more than 2)
            const shouldAutoSummarize = autoSummarizeEnabled && 
                                      !isSummarizing &&
                                      unsummarizedValidTranscripts.length > 0 && 
                                      timeSinceLastAttempt > 120000 && // 2 minutes instead of 30 seconds
                                      consecutiveFailures.current < 3; // Stop after 3 failures

            console.log('🤖 Auto-summarize check:', {
                enabled: autoSummarizeEnabled,
                summarizing: isSummarizing,
                unsummarized: unsummarizedValidTranscripts.length,
                timeSince: Math.round(timeSinceLastAttempt / 1000),
                failures: consecutiveFailures.current,
                shouldTrigger: shouldAutoSummarize
            });

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
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transcripts' }, (payload) => {
                console.log('New transcript inserted:', payload);
                toast.success('New transcript detected!', { icon: '📝' });
                // Reset failure counter on new transcript
                consecutiveFailures.current = 0;
                lastAutoSummarizeAttempt.current = 0;
                setTimeout(fetchStats, 2000);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
                console.log('Meeting change detected:', payload.eventType);
                if (payload.eventType === 'INSERT') {
                    toast.success('New meeting summarized!', { icon: '✅' });
                    // Reset failure counter on successful meeting creation
                    consecutiveFailures.current = 0;
                }
                fetchStats();
                fetchAllMeetings();
            })
            .subscribe();

        // Check less frequently - every 5 minutes instead of 1 minute
        const interval = setInterval(() => {
            if (!isSummarizing) {
                fetchStats();
            }
        }, 300000); // 5 minutes

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
                    // SUCCESS - reset failure counter
                    consecutiveFailures.current = 0;
                    setFailedAttempts(0);
                    setLastFailedAttempt(null);
                    
                    toast.success(
                        `Successfully summarized ${result.processedCount} transcript(s) using ${result.method || 'free'} method.`, 
                        { id: toastId }
                    );
                } else {
                    // NO TRANSCRIPTS PROCESSED - increment failure counter
                    consecutiveFailures.current += 1;
                    setFailedAttempts(prev => prev + 1);
                    setLastFailedAttempt(new Date().toLocaleTimeString());
                    
                    toast.warning(
                        result.message || 'No valid transcripts found to summarize.',
                        { id: toastId }
                    );
                    
                    // Auto-disable after 3 failures
                    if (consecutiveFailures.current >= 3) {
                        setAutoSummarizeEnabled(false);
                        toast.error('Auto-summarization disabled due to repeated failures. Check your transcripts.');
                    }
                }
                fetchStats();
                fetchAllMeetings();
            } else {
                // API ERROR - increment failure counter
                consecutiveFailures.current += 1;
                setFailedAttempts(prev => prev + 1);
                setLastFailedAttempt(new Date().toLocaleTimeString());
                
                toast.error(result.error || 'Summarization failed.', { id: toastId });
                
                // Auto-disable after 3 failures
                if (consecutiveFailures.current >= 3) {
                    setAutoSummarizeEnabled(false);
                    toast.error('Auto-summarization disabled due to repeated failures.');
                }
            }
        } catch (error) {
            // NETWORK ERROR - increment failure counter
            consecutiveFailures.current += 1;
            setFailedAttempts(prev => prev + 1);
            setLastFailedAttempt(new Date().toLocaleTimeString());
            
            console.error('Summarization error:', error);
            toast.error('Failed to connect to summarization service.', { id: toastId });
            
            // Auto-disable after 3 failures
            if (consecutiveFailures.current >= 3) {
                setAutoSummarizeEnabled(false);
                toast.error('Auto-summarization disabled due to connection issues.');
            }
        } finally {
            setIsSummarizing(false);
        }
    };

    const resetFailures = () => {
        consecutiveFailures.current = 0;
        setFailedAttempts(0);
        setLastFailedAttempt(null);
        lastAutoSummarizeAttempt.current = 0;
        toast.success('Failure counter reset!');
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
                            {failedAttempts > 0 && (
                                <p className="text-xs text-red-400">Fails: {failedAttempts}</p>
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
                            {autoSummarizeEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>

                    {failedAttempts > 0 && (
                        <div className="bg-red-900/20 border border-red-500 rounded p-3">
                            <p className="text-red-400 text-sm font-semibold">⚠️ Auto-Summarization Issues Detected</p>
                            <p className="text-red-300 text-sm">Failed attempts: {failedAttempts}</p>
                            <p className="text-red-300 text-sm">Last attempt: {lastFailedAttempt}</p>
                            <button 
                                onClick={resetFailures}
                                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                            >
                                Reset & Retry
                            </button>
                        </div>
                    )}

                    <div className="text-sm text-medium-gray bg-primary p-4 rounded">
                        <p><strong>Note:</strong> Empty transcripts and test recordings are automatically ignored.</p>
                        <p>Only transcripts with meaningful content (20+ characters) are summarized.</p>
                        <p className="mt-2">
                            <strong>Stats:</strong> {stats.transcripts - stats.validTranscripts} transcript(s) skipped (empty/too short)
                        </p>
                        <p className="mt-1">
                            <strong>Auto-check interval:</strong> Every 5 minutes (minimum 2 minutes between attempts)
                        </p>
                    </div>
                </div>
             </div>

            {/* Real-time Data Table */}
            <div className="p-6 bg-secondary rounded-lg">
                 <h2 className="text-xl font-bold mb-4">Live Database View (Meetings)</h2>
                 <div className="overflow-x-auto">
                     <table className="min-w-full text-sm text-left text-light-gray">
                        <thead className="text-xs text-medium-gray uppercase bg-primary">
                            <tr>
                                <th scope="col" className="px-6 py-3">Title</th>
                                <th scope="col" className="px-6 py-3">Transcript ID</th>
                                <th scope="col" className="px-6 py-3">Created At</th>
                                <th scope="col" className="px-6 py-3">Summary Method</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(meeting => (
                                <tr key={meeting.id} className="bg-secondary border-b border-dark-gray">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{meeting.title}</td>
                                    <td className="px-6 py-4 text-xs text-medium-gray">
                                        {meeting.transcript_id ? meeting.transcript_id.substring(0, 8) + '...' : 'Manual'}
                                    </td>
                                    <td className="px-6 py-4">{new Date(meeting.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            meeting.transcript_id 
                                                ? 'bg-green-800 text-green-200' 
                                                : 'bg-blue-800 text-blue-200'
                                        }`}>
                                            {meeting.transcript_id ? 'Auto Generated' : 'Manual Entry'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => handleDelete(meeting.id)} 
                                            className="font-medium text-red-500 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
}
