'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation' 
import { supabase } from '../lib/supabaseClient' // Keep for password auth if needed
import toast from 'react-hot-toast'; // Make sure you have this installed

// All your existing components are preserved
import MeetingCard from './components/MeetingCard'
import MeetingDetails from './components/MeetingDetails'
import SpaceManager from './components/SpaceManager'
import MeetingPopup from './components/MeetingPopup'
import Login from './components/Login'

export default function Home() {
  // All your state is preserved
  const router = useRouter();  // ✅ ADD THIS
  const [isLoading, setIsLoading] = useState(true);  // ✅ ADD THIS
  const [user, setUser] = useState(null);  // ✅ ADD THIS
  const [meetings, setMeetings] = useState([])
  const [filteredMeetings, setFilteredMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMeetings, setSelectedMeetings] = useState(new Set())
  const [showSpaceManager, setShowSpaceManager] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [darkMode, setDarkMode] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const searchParams = useSearchParams()
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [customDateEnabled, setCustomDateEnabled] = useState(false);

  // --- START: MODIFIED AUTHENTICATION LOGIC ---

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://piyushjaiswall-backend.hf.space';

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('meetingRecorderToken');
      const userInfo = localStorage.getItem('userInfo');
  
      if (!token || !userInfo) {
        // Not logged in - redirect to login
        router.push('/login');
        return;
      }
  
      // Logged in - set user data
      setUser(JSON.parse(userInfo));
      setIsLoading(false);
    };
  
    checkAuth();
  }, []);
  // This single useEffect now handles all session checking
  useEffect(() => {
    const authStatus = searchParams.get('auth');
    if (authStatus === 'error') {
        toast.error('Google login failed. Please try again.');
    }
    // Clean the URL and check for a valid backend session
    window.history.replaceState({}, '', '/');
    checkBackendSession();
  }, [searchParams]);

  const checkBackendSession = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/auth/user`, {
        credentials: 'include', // This is crucial for sending the session cookie
      });
      if (res.ok) {
        const usr = await res.json();
        setUser(usr);
        // We no longer need to sync with Supabase here, the backend is the source of truth
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Backend session check failed:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // This is the new sign-out function that talks to your backend
  const handleSignOut = async () => {
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      setMeetings([]); // Keep your existing state resets
      setSelectedMeetings(new Set());
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // --- END: MODIFIED AUTHENTICATION LOGIC ---

  // All your existing functionality is preserved below this line.

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode))
    }
  }, [])

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Fetch meetings when the user is logged in
  useEffect(() => {
    if (user) {
      fetchMeetings()
    }
  }, [user])

  // Filter meetings based on search and date
  useEffect(() => {
    filterMeetings()
  }, [meetings, searchTerm, dateFilter, customDateRange]) // Added customDateRange dependency

  const fetchMeetings = async () => {
    try {
      // NOTE: This Next.js API route should be protected to only allow logged-in users.
      const response = await fetch('/api/meetings'); 
      const data = await response.json();
      
      if (response.ok) {
        setMeetings(data.meetings || []);
      } else {
        console.error('Failed to fetch meetings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };
  
  const filterMeetings = () => {
    let filtered = meetings;
  
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting =>
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meeting.client_id && meeting.client_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  
    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
    if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const startDate = new Date(customDateRange.start);
      const endDate = new Date(customDateRange.end);
      endDate.setHours(23, 59, 59, 999);
  
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.created_at);
        return meetingDate >= startDate && meetingDate <= endDate;
      });
    } else if (dateFilter !== 'all') {
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.created_at);
        switch (dateFilter) {
          case 'today':
            return meetingDate >= today;
          case 'week':
            return meetingDate >= weekAgo;
          case 'month':
            return meetingDate >= monthAgo;
          default:
            return true;
        }
      });
    }
  
    setFilteredMeetings(filtered);
  };
  
  const handleDeleteMeeting = (deletedId) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== deletedId));
    setSelectedMeetings(prev => {
      const newSet = new Set(prev);
      newSet.delete(deletedId);
      return newSet;
    });
  };

  const handleUpdateMeeting = (updatedMeeting) => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === updatedMeeting.id 
        ? { ...meeting, ...updatedMeeting }
        : meeting
    ));
    if (selectedMeeting && selectedMeeting.id === updatedMeeting.id) {
      setSelectedMeeting({ ...selectedMeeting, ...updatedMeeting });
    }
  };

  const handleSelectMeeting = (meetingId, selected) => {
    setSelectedMeetings(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(meetingId);
      } else {
        newSet.delete(meetingId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedMeetings(new Set(filteredMeetings.map(m => m.id)));
    } else {
      setSelectedMeetings(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMeetings.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedMeetings.size} meeting(s)?`)) {
      return;
    }

    setBulkLoading(true);
    try {
      const deletePromises = Array.from(selectedMeetings).map(id =>
        fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      
      setMeetings(prev => prev.filter(meeting => !selectedMeetings.has(meeting.id)));
      setSelectedMeetings(new Set());
      alert(`Successfully deleted ${selectedMeetings.size} meeting(s)`);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete some meetings');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleManualEntry = (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    setShowManualEntry(false);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  // Your rendering logic is preserved
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Your login check is preserved
  if (!user) {
      return <Login />
  }

  // Your entire dashboard UI is preserved
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Meeting Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {/* Changed to use user.name from backend session */}
                Welcome back, {user.name || user.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCustomDateEnabled(e.target.value === 'custom');
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              
              {dateFilter === 'custom' && (
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              <button
                onClick={() => setShowSpaceManager(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Storage
              </button>

              <button
                onClick={() => setShowManualEntry(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + Add Meeting
              </button>

              <button
                onClick={handleSignOut}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meetings</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{meetings.length}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {meetings.filter(m => {
                const meetingDate = new Date(m.created_at)
                const now = new Date()
                return meetingDate.getMonth() === now.getMonth() && 
                       meetingDate.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Follow-ups</p>
            <p className="text-2xl font-semibold text-orange-600">
              {meetings.filter(m => m.followup_points && m.followup_points.length > 0).length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMeetings.size === filteredMeetings.length && filteredMeetings.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Select All ({selectedMeetings.size})
                </span>
              </div>
              
              {selectedMeetings.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                  className="w-full bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkLoading ? 'Deleting...' : `Delete ${selectedMeetings.size}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onDelete={handleDeleteMeeting}
                onView={setSelectedMeeting}
                isSelected={selectedMeetings.has(meeting.id)}
                onSelect={handleSelectMeeting}
                darkMode={darkMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              {searchTerm || dateFilter !== 'all' ? 'No meetings match your filters' : 'No meetings recorded yet'}
            </div>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm || dateFilter !== 'all'
                ? 'Try adjusting your search or date filter' 
                : 'Start recording meetings with the Chrome extension or add one manually'
              }
            </p>
          </div>
        )}
      </main>

      {/* Your modals are all preserved */}
      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={handleUpdateMeeting}
          darkMode={darkMode}
        />
      )}

      {showSpaceManager && (
        <SpaceManager
          meetings={meetings}
          onClose={() => setShowSpaceManager(false)}
          darkMode={darkMode}
          dateFilter={dateFilter}
          customDateRange={customDateRange}
        />
      )}

      {showManualEntry && (
        <MeetingPopup
          onClose={() => setShowManualEntry(false)}
          onSave={handleManualEntry}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}
