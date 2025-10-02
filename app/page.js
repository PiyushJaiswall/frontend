'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import MeetingCard from './components/MeetingCard'
import MeetingDetails from './components/MeetingDetails'
import SpaceManager from './components/SpaceManager'
import MeetingPopup from './components/MeetingPopup'

export default function Home() {
  const [user, setUser] = useState(null)
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

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchMeetings()
    }
  }, [user])

  useEffect(() => {
    filterMeetings()
  }, [meetings, searchTerm, dateFilter])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null)
      })
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeetings = async () => {
    try {
      const response = await fetch('/api/meetings')
      const data = await response.json()
      
      if (response.ok) {
        setMeetings(data.meetings || [])
      } else {
        console.error('Failed to fetch meetings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    }
  }

  const filterMeetings = () => {
    let filtered = meetings

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(meeting =>
        meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    if (dateFilter !== 'all') {
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.created_at)
        switch (dateFilter) {
          case 'today':
            return meetingDate >= today
          case 'week':
            return meetingDate >= weekAgo
          case 'month':
            return meetingDate >= monthAgo
          default:
            return true
        }
      })
    }

    setFilteredMeetings(filtered)
  }

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      setUser(data.user)
    } catch (error) {
      alert('Login failed: ' + error.message)
    }
  }

  const handleSignUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      
      if (error) throw error
      alert('Check your email for verification link!')
    } catch (error) {
      alert('Sign up failed: ' + error.message)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setMeetings([])
      setSelectedMeetings(new Set())
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleDeleteMeeting = (deletedId) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== deletedId))
    setSelectedMeetings(prev => {
      const newSet = new Set(prev)
      newSet.delete(deletedId)
      return newSet
    })
  }

  const handleUpdateMeeting = (updatedMeeting) => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === updatedMeeting.id 
        ? { ...meeting, ...updatedMeeting }
        : meeting
    ))
    if (selectedMeeting && selectedMeeting.id === updatedMeeting.id) {
      setSelectedMeeting({ ...selectedMeeting, ...updatedMeeting })
    }
  }

  const handleSelectMeeting = (meetingId, selected) => {
    setSelectedMeetings(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(meetingId)
      } else {
        newSet.delete(meetingId)
      }
      return newSet
    })
  }

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedMeetings(new Set(filteredMeetings.map(m => m.id)))
    } else {
      setSelectedMeetings(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (selectedMeetings.size === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedMeetings.size} meeting(s)?`)) {
      return
    }

    setBulkLoading(true)
    try {
      const deletePromises = Array.from(selectedMeetings).map(id =>
        fetch(`/api/meetings/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      
      setMeetings(prev => prev.filter(meeting => !selectedMeetings.has(meeting.id)))
      setSelectedMeetings(new Set())
      alert(`Successfully deleted ${selectedMeetings.size} meeting(s)`)
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('Failed to delete some meetings')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleManualEntry = (newMeeting) => {
    setMeetings(prev => [newMeeting, ...prev])
    setShowManualEntry(false)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Meeting Dashboard
            </h2>
          </div>
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target)
            const email = formData.get('email')
            const password = formData.get('password')
            handleLogin(email, password)
          }}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Email address"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Password"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  const email = document.getElementById('email').value
                  const password = document.getElementById('password').value
                  if (email && password) handleSignUp(email, password)
                }}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Up
              </button>
            </div>
          </form>
          
          <div className="flex justify-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              {darkMode ? '☀️' : '🌙'} {darkMode ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>
      </div>
    )
  }

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
                Welcome back, {user.email}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Space Manager */}
              <button
                onClick={() => setShowSpaceManager(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Storage
              </button>

              {/* Manual Entry */}
              <button
                onClick={() => setShowManualEntry(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                + Add Meeting
              </button>

              {/* Sign Out */}
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
        {/* Stats and Bulk Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Stats */}
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

          {/* Bulk Actions */}
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

        {/* Meetings Grid */}
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

      {/* Modals */}
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
