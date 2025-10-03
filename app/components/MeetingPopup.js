'use client'
import { useState } from 'react'

export default function MeetingForm({ onSave, onClose, darkMode }) {
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    transcript_text: '',
    summary: '',
    key_points: [''],
    followup_points: [''],
  })

  const [isSaving, setIsSaving] = useState(false)

  const saveMeeting = async () => {
    const { client_id, title, transcript_text, summary, key_points, followup_points } = formData

    if (!client_id.trim() || !title.trim()) {
      alert('Client ID and Title are required')
      return
    }

    setIsSaving(true)
    try {
      // 1. Create transcript
      const transcriptRes = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id,
          meeting_title: title,
          audio_url: '',
          transcript_text
        }),
      })
      const transcriptData = await transcriptRes.json()
      const transcriptId = transcriptData.transcript?.id
      if (!transcriptId) {
        alert('Failed to create transcript: ' + (transcriptData.error || 'Unknown error'))
        setIsSaving(false)
        return
      }

      // 2. Create meeting with new transcript_id
      const meetingData = {
        title,
        summary,
        key_points: key_points.filter(point => point.trim()),
        followup_points: followup_points.filter(point => point.trim()),
        transcript_id: transcriptId,
      }
      const meetingRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      })
      const meetingResp = await meetingRes.json()
      if (!meetingRes.ok) {
        alert('Failed to save meeting: ' + (meetingResp.error || 'Unknown error'))
        setIsSaving(false)
        return
      }

      alert('Meeting saved successfully!')
      onSave()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save meeting: ' + error.message)
    }
    setIsSaving(false)
  }

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addKeyPoint = () => {
    setFormData(prev => ({ ...prev, key_points: [...prev.key_points, ''] }))
  }

  const removeKeyPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index),
    }))
  }

  const updateKeyPoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.map((p, i) => (i === index ? value : p)),
    }))
  }

  const addFollowupPoint = () => {
    setFormData(prev => ({ ...prev, followup_points: [...prev.followup_points, ''] }))
  }

  const removeFollowupPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      followup_points: prev.followup_points.filter((_, i) => i !== index),
    }))
  }

  const updateFollowupPoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      followup_points: prev.followup_points.map((p, i) => (i === index ? value : p)),
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Add Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={formData.client_id}
                onChange={(e) => updateFormField('client_id', e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                placeholder="Enter client ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormField('title', e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                placeholder="Enter meeting title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => updateFormField('summary', e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-32 dark:bg-gray-700 dark:text-white"
                placeholder="Enter meeting summary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Key Points
                </label>
                <button
                  type="button"
                  onClick={addKeyPoint}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  + Add Point
                </button>
              </div>
              <div className="space-y-2">
                {formData.key_points.map((point, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateKeyPoint(index, e.target.value)}
                      className="flex-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                      placeholder="Key point..."
                    />
                    <button
                      type="button"
                      onClick={() => removeKeyPoint(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Follow-up Points
                </label>
                <button
                  type="button"
                  onClick={addFollowupPoint}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  + Add Follow-up
                </button>
              </div>
              <div className="space-y-2">
                {formData.followup_points.map((point, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updateFollowupPoint(index, e.target.value)}
                      className="flex-1 border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-white"
                      placeholder="Follow-up point..."
                    />
                    <button
                      type="button"
                      onClick={() => removeFollowupPoint(index)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Transcript (Optional)
              </label>
              <textarea
                value={formData.transcript_text}
                onChange={(e) => updateFormField('transcript_text', e.target.value)}
                className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 h-40 dark:bg-gray-700 dark:text-white"
                placeholder="Paste or type the full meeting transcript here..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={saveMeeting}
            disabled={isSaving || !formData.title.trim() || !formData.client_id.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Meeting'}
          </button>
        </div>
      </div>
    </div>
  )
}
