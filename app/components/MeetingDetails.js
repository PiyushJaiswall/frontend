import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'

export default function MeetingDetails({ meeting, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: meeting.title || '',
    summary: meeting.summary || '',
    key_points: meeting.key_points || [],
    followup_points: meeting.followup_points || [],
  })
  const [isSaving, setIsSaving] = useState(false)

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
        onUpdate(updatedMeeting)
        setIsEditing(false)
      } else {
        alert('Failed to save changes')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save changes')
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-semibold border rounded px-2 py-1"
                placeholder="Meeting Title"
              />
            ) : (
              <h2 className="text-xl font-semibold text-gray-800">
                {meeting.title || 'Untitled Meeting'}
              </h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })}
              {meeting.transcript_created_at && (
                <span> • Recorded {format(new Date(meeting.transcript_created_at), 'PPp')}</span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
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
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
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
              className="text-gray-500 hover:text-gray-700"
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
              <h3 className="text-lg font-medium text-gray-800 mb-3">Summary</h3>
              {isEditing ? (
                <textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full border rounded p-3 h-32"
                  placeholder="Meeting summary..."
                />
              ) : (
                <div className="bg-gray-50 rounded p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {meeting.summary || 'No summary available'}
                  </p>
                </div>
              )}
            </div>

            {/* Key Points Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Key Points</h3>
                {isEditing && (
                  <button
                    onClick={addKeyPoint}
                    className="text-blue-600 hover:text-blue-800 text-sm"
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
                        className="flex-1 border rounded px-3 py-2"
                        placeholder="Key point..."
                      />
                      <button
                        onClick={() => removeKeyPoint(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-2 bg-gray-50 rounded p-4">
                  {meeting.key_points && meeting.key_points.length > 0 ? (
                    meeting.key_points.map((point, index) => (
                      <li key={index} className="text-gray-700">
                        {point}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">No key points available</li>
                  )}
                </ul>
              )}
            </div>

            {/* Follow-up Points Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-800">Follow-up Points</h3>
                {isEditing && (
                  <button
                    onClick={addFollowupPoint}
                    className="text-blue-600 hover:text-blue-800 text-sm"
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
                        className="flex-1 border rounded px-3 py-2"
                        placeholder="Follow-up point..."
                      />
                      <button
                        onClick={() => removeFollowupPoint(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="list-disc list-inside space-y-2 bg-orange-50 rounded p-4">
                  {meeting.followup_points && meeting.followup_points.length > 0 ? (
                    meeting.followup_points.map((point, index) => (
                      <li key={index} className="text-orange-700">
                        {point}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 italic">No follow-up points available</li>
                  )}
                </ul>
              )}
            </div>

            {/* Full Transcript Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Full Transcript</h3>
              <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {meeting.transcript_text || 'No transcript available'}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="font-medium text-gray-800">Client ID</h4>
                <p className="text-gray-600">{meeting.client_id}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Transcript ID</h4>
                <p className="text-gray-600 font-mono text-sm">{meeting.transcript_id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
