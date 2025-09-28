'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function SpaceManager() {
    const [stats, setStats] = useState({ meetings: 0, transcripts: 0, unsummarized: 0 });
    const [meetings, setMeetings] = useState([]);
    const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState(true);
    
    async function fetchStats() {
        const { count: meetingsCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true });
        const { count: transcriptsCount } = await supabase.from('transcripts').select('*', { count: 'exact', head: true });
        
        // Better query for unsummarized transcripts
        const { data: allTranscripts } = await supabase.from('transcripts').select('id');
        const { data: summarizedTranscripts } = await supabase
            .from('meetings')
            .select('transcript_id')
            .not('transcript_id', 'is', null);
        
        const summarizedIds = new Set(summarizedTranscripts?.map(m => m.transcript_id) || []);
        const unsummarizedCount = allTranscripts?.filter(t => !summarizedIds.has(t.id)).length || 0;
        
        setStats({ 
            meetings: meetingsCount || 0, 
            transcripts: transcriptsCount || 0,
            unsummarized: unsummarizedCount
        });
    
        // Auto-summarize if there are unsummarized transcripts and auto mode is enabled
        if (autoSummarizeEnabled && unsummarizedCount > 0) {
            console.log(`🤖 Auto-summarizing ${unsummarizedCount} transcripts...`);
            toast(`Found ${unsummarizedCount} unsummarized transcript(s). Auto-summarizing...`, {
                icon: '🤖',
                duration: 3000,
            });
            await triggerSummarize();
        }
    }

    async function fetchAllMeetings() {
        const { data, error } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
        if (data) setMeetings(data);
    }
    
    useEffect(() => {
        fetchStats();
        fetchAllMeetings();

        // Set up real-time listener for transcript changes
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transcripts' }, (payload) => {
                toast.success('New transcript detected! Processing...', { icon: '📝' });
                fetchStats();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
                toast.success('Database updated!', { icon: '💾' });
                fetchStats();
                fetchAllMeetings();
            })
            .subscribe();

        // Check for new transcripts every 30 seconds
        const interval = setInterval(() => {
            fetchStats();
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [autoSummarizeEnabled]);

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            const { error } = await supabase.from('meetings').delete().eq('id', id);
            if (error) toast.error(error.message);
            else toast.success('Meeting deleted.');
        }
    };
    
    const triggerSummarize = async () => {
        const toastId = toast.loading('Summarizing transcripts using free algorithm...');
        try {
            const response = await fetch('/api/summarize', { method: 'POST' });
            const result = await response.json();
            
            if (response.ok) {
                toast.success(`Successfully summarized ${result.processedCount} transcript(s) using ${result.method} method.`, { id: toastId });
                fetchStats();
                fetchAllMeetings();
            } else {
                toast.error(result.error || 'Summarization failed.', { id: toastId });
            }
        } catch (error) {
            toast.error('Failed to connect to summarization service.', { id: toastId });
        }
    };

    return (
        <div className="space-y-8">
            {/* Storage Overview */}
            <div className="p-6 bg-secondary rounded-lg">
                <h2 className="text-xl font-bold mb-4">Storage Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Total Meetings</p>
                        <p className="text-2xl font-bold">{stats.meetings}</p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Total Transcripts</p>
                        <p className="text-2xl font-bold">{stats.transcripts}</p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Unsummarized</p>
                        <p className={`text-2xl font-bold ${stats.unsummarized > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {stats.unsummarized}
                        </p>
                    </div>
                    <div className="p-4 bg-primary rounded-lg text-center">
                        <p className="text-medium-gray text-sm">Auto Summary</p>
                        <p className={`text-sm font-bold ${autoSummarizeEnabled ? 'text-green-400' : 'text-red-400'}`}>
                            {autoSummarizeEnabled ? 'ON' : 'OFF'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
             <div className="p-6 bg-secondary rounded-lg">
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                <div className="space-y-4">
                    <button 
                        onClick={triggerSummarize}
                        className="w-full px-4 py-2 font-bold text-white bg-accent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        Summarize New Transcripts ({stats.unsummarized} pending)
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
                                <th scope="col" className="px-6 py-3">Created At</th>
                                <th scope="col" className="px-6 py-3">Summary Method</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(meeting => (
                                <tr key={meeting.id} className="bg-secondary border-b border-dark-gray">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{meeting.title}</td>
                                    <td className="px-6 py-4">{new Date(meeting.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-green-800 text-green-200 rounded-full text-xs">
                                            Free Algorithm
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleDelete(meeting.id)} className="font-medium text-red-500 hover:underline">Delete</button>
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
