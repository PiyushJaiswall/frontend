'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function SpaceManager() {
    const [stats, setStats] = useState({ meetings: 0, transcripts: 0 });
    const [meetings, setMeetings] = useState([]);
    
    async function fetchStats() {
        const { count: meetingsCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true });
        const { count: transcriptsCount } = await supabase.from('transcripts').select('*', { count: 'exact', head: true });
        setStats({ meetings: meetingsCount, transcripts: transcriptsCount });
    }

    async function fetchAllMeetings() {
        const { data, error } = await supabase.from('meetings').select('*').order('created_at', { ascending: false });
        if (data) setMeetings(data);
    }
    
    useEffect(() => {
        fetchStats();
        fetchAllMeetings();

        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                toast.success('Database updated in real-time!');
                fetchStats();
                fetchAllMeetings();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            const { error } = await supabase.from('meetings').delete().eq('id', id);
            if (error) toast.error(error.message);
            else toast.success('Meeting deleted.');
        }
    };
    
    const triggerSummarize = async () => {
        const toastId = toast.loading('Summarizing new transcripts...');
        const response = await fetch('/api/summarize', { method: 'POST' });
        const result = await response.json();
        
        if (response.ok) {
            toast.success(`Successfully summarized ${result.processedCount} transcript(s).`, { id: toastId });
        } else {
            toast.error(result.error || 'Summarization failed.', { id: toastId });
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
                </div>
            </div>

            {/* Actions */}
             <div className="p-6 bg-secondary rounded-lg">
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                 <button 
                    onClick={triggerSummarize}
                    className="w-full px-4 py-2 font-bold text-white bg-accent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accent"
                 >
                    Summarize New Transcripts
                 </button>
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
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(meeting => (
                                <tr key={meeting.id} className="bg-secondary border-b border-dark-gray">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{meeting.title}</td>
                                    <td className="px-6 py-4">{new Date(meeting.created_at).toLocaleString()}</td>
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
