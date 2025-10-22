'use client'
import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Calendar } from 'lucide-react'
import ScheduleFollowup from './ScheduleFollowup'

export default function MeetingDetails({ meeting, onClose, onUpdate, darkMode }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: meeting.title || '',
    summary: meeting.summary || '',
    key_points: meeting.key_points || [],
    followup_points: meeting.followup_points || [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const { meeting: updatedMeeting } = await response.json()
        onUpdate({ ...meeting, ...updatedMeeting })
        setIsEditing(false)
        alert('Meeting updated successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save changes')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes: ' + error.message)
    }
    setIsSaving(false)
  }

  const addKeyPoint = () => {
    setEditForm(prev => ({
      ...prev,
      key_points: [...prev.key_points, '']
    }))
  }

  const removeKeyPoint = (index) => {
    setEditForm(prev => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index)
    }))
  }

  const updateKeyPoint = (index, value) => {
    setEditForm(prev => ({
      ...prev,
      key_points: prev.key_points.map((point, i) => i === index ? value : point)
    }))
  }

  const addFollowupPoint = () => {
    setEditForm(prev => ({
      ...prev,
      followup_points: [...prev.followup_points, '']
    }))
  }

  const removeFollowupPoint = (index) => {
    setEditForm(prev => ({
      ...prev,
      followup_points: prev.followup_points.filter((_, i) => i !== index)
    }))
  }

  const updateFollowupPoint = (index, value) => {
    setEditForm(prev => ({
      ...prev,
      followup_points: prev.followup_points.map((point, i) => i === index ? value : point)
    }))
  }

  const downloadMeeting = () => {
    const meetingData = {
      title: meeting.title,
      summary: meeting.summary,
      key_points: meeting.key_points,
      followup_points: meeting.followup_points,
      transcript: meeting.transcript_text,
      created_at: meeting.created_at,
      client_id: meeting.client_id
    }
    
    const blob = new Blob([JSON.stringify(meetingData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-${meeting.title || meeting.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-semibold border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white w-full"
                placeholder="Meeting Title"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {meeting.title || 'Untitled Meeting'}
              </h2>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Created {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
              {meeting.transcript_created_at && (
                <span> • Recorded {format(new Date(meeting.transcript_created_at), 'PPp')}</span>
              )}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSchedule(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>

            <button
              onClick={downloadMeeting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download
            </button>
            
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Summary Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Summary</h3>
              {isEditing ? (
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded p-3 h-32 dark:bg-gray-700 dark:text-white"
                  placeholder="Meeting summary..."
                />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {meeting.summary || 'No summary available'}
                  </p>
                </div>
              )}
            </div>

            {/* Key Points Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Key Points</h3>
                {isEditing && (
                  <button
                    onClick={addKeyPoint}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    + Add Point
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  {editForm.key_points.map((point, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateKeyPoint(index, e.target.value)}
                        className="flex-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Key point..."
                      />
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-2 bg-gray-50 dark:bg-gray-700 rounded p-4">
                  {meeting.key_points && meeting.key_points.length > 0 ? (
                    meeting.key_points.map((point, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300">
                        {point}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 dark:text-gray-400 italic">No key points available</li>
                  )}
                </ul>
              )}
            </div>

            {/* Follow-up Points Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Follow-up Points</h3>
                {isEditing && (
                  <button
                    onClick={addFollowupPoint}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    + Add Follow-up
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  {editForm.followup_points.map((point, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => updateFollowupPoint(index, e.target.value)}
                        className="flex-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                        placeholder="Follow-up point..."
                      />
                      <button
                        onClick={() => removeFollowupPoint(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-2 bg-orange-50 dark:bg-orange-900/20 rounded p-4">
                  {meeting.followup_points && meeting.followup_points.length > 0 ? (
                    meeting.followup_points.map((point, index) => (
                      <li key={index} className="text-orange-700 dark:text-orange-400">
                        {point}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 dark:text-gray-400 italic">No follow-up points available</li>
                  )}
                </ul>
              )}
            </div>

            {/* Full Transcript Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">Full Transcript</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {meeting.transcript_text || 'No transcript available'}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Client ID</h4>
                <p className="text-gray-600 dark:text-gray-400">{meeting.client_id}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Transcript ID</h4>
                <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">{meeting.transcript_id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      {showSchedule && (
        <ScheduleFollowup
          meetingId={meeting.id}
          meetingTitle={meeting.title}
          onClose={() => setShowSchedule(false)}
          onScheduled={() => setShowSchedule(false)}
        />
      )}
    </div>
  )
}
