'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RealtimeStatus({ user }) {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [processingJobs, setProcessingJobs] = useState([]);

    useEffect(() => {
        if (!user) return;

        // Monitor connection status
        const channel = supabase.channel('status');
        
        channel.on('system', {}, (payload) => {
            if (payload.event === 'connected') {
                setConnectionStatus('connected');
            } else if (payload.event === 'disconnected') {
                setConnectionStatus('disconnected');
            }
        });

        channel.subscribe((status) => {
            console.log('Realtime status:', status);
            setConnectionStatus(status);
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'disconnected': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Live';
            case 'connecting': return 'Connecting...';
            case 'disconnected': return 'Offline';
            default: return 'Unknown';
        }
    };

    if (!user) return null;

    return (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            <span>{getStatusText()}</span>
            {processingJobs.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                    ({processingJobs.length} processing)
                </span>
            )}
        </div>
    );
}
