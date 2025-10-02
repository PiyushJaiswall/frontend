'use client'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import MeetingCard from './components/MeetingCard'
import MeetingDetails from './components/MeetingDetails'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkUser()
    if (user) {
      fetchMeetings()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
    setLoading(false)
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

  const handleDeleteMeeting = (deletedId) => {
    setMeetings(prev => prev.filter(meeting => meeting.id !== deletedId))
  }

  const handleUpdateMeeting = (updatedMeeting) => {
    setMeetings(prev => prev.map(meeting => 
      meeting.id === updatedMeeting.id 
        ? { ...meeting, ...updatedMeeting }
        : meeting
    ))
    setSelectedMeeting({ ...selectedMeeting, ...updatedMeeting })
  }

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.client_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meeting Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-semibold text-gray-900">{meetings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {meetings.filter(m => {
                    const meetingDate = new Date(m.created_at)
                    const now = new Date()
                    return meetingDate.getMonth() === now.getMonth() && 
                           meetingDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Follow-ups Pending</p>
                <p className="text-2xl font-semibold text-orange-600">
                  {meetings.filter(m => m.followup_points && m.followup_points.length > 0).length}
                </p>
              </div>
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchTerm ? 'No meetings match your search' : 'No meetings recorded yet'}
            </div>
            <p className="text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Start recording meetings with the Chrome extension to see them here'
              }
            </p>
          </div>
        )}
      </main>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <MeetingDetails
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
          onUpdate={handleUpdateMeeting}
        />
      )}
    </div>
  )
}
