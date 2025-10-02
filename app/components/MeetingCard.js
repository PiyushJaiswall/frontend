'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

export default function MeetingCard({ 
  meeting, 
  onDelete, 
  onView, 
  isSelected, 
  onSelect, 
  darkMode 
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(meeting.id)
      } else {
        alert('Failed to delete meeting')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete meeting')
    }
    setIsDeleting(false)
  }

  const createdAt = new Date(meeting.created_at)
  const transcriptDate = meeting.transcript_created_at 
    ? new Date(meeting.transcript_created_at) 
    : createdAt

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : ''
    }`}>
      {/* Selection Checkbox */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(meeting.id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <h3 
            className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => onView(meeting)}
          >
            {meeting.title || 'Untitled Meeting'}
          </h3>
        </div>
        
        <div className="flex space-x-2 ml-2">
          <button
            onClick={() => onView(meeting)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            View
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
          {meeting.summary || 'No summary available'}
        </p>
      </div>

      {/* Key Points */}
      {meeting.key_points && meeting.key_points.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Points:</h4>
          <ul className="list-disc list-inside space-y-1">
            {meeting.key_points.slice(0, 3).map((point, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                {point}
              </li>
            ))}
            {meeting.key_points.length > 3 && (
              <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                +{meeting.key_points.length - 3} more points
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Follow-up Points */}
      {meeting.followup_points && meeting.followup_points.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Follow-ups:</h4>
          <ul className="list-disc list-inside space-y-1">
            {meeting.followup_points.slice(0, 2).map((point, index) => (
              <li key={index} className="text-sm text-orange-600 dark:text-orange-400 line-clamp-1">
                {point}
              </li>
            ))}
            {meeting.followup_points.length > 2 && (
              <li className="text-sm text-gray-500 dark:text-gray-500 italic">
                +{meeting.followup_points.length - 2} more follow-ups
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-3">
        <span>Client: {meeting.client_id}</span>
        <span>
          {formatDistanceToNow(transcriptDate, { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
