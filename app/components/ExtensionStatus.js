'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ExtensionStatus() {
    const [extensionConnected, setExtensionConnected] = useState(false);
    const [recentRecordings, setRecentRecordings] = useState([]);

    useEffect(() => {
        checkExtensionConnection();
        
        // Check every 30 seconds
        const interval = setInterval(checkExtensionConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkExtensionConnection = () => {
        // Check if Chrome extension is available
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            try {
                chrome.runtime.sendMessage('your-extension-id', 
                    { type: 'HEALTH_CHECK' }, 
                    (response) => {
                        setExtensionConnected(!!response);
                    }
                );
            } catch (error) {
                setExtensionConnected(false);
            }
        } else {
            setExtensionConnected(false);
        }
    };

    const openExtension = () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage('your-extension-id', {
                type: 'OPEN_POPUP'
            });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Chrome Extension
                </h3>
                <div className={`w-3 h-3 rounded-full ${
                    extensionConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
            </div>
            
            <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {extensionConnected ? 'Connected' : 'Not Connected'}
                </p>
                
                {extensionConnected ? (
                    <>
                        <button
                            onClick={openExtension}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Open Recorder
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Record meetings directly from your browser
                        </p>
                    </>
                ) : (
                    <>
                        <a
                            href="https://chrome.google.com/webstore/detail/your-extension-id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-center"
                        >
                            Install Extension
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Install the Chrome extension to record meetings
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
