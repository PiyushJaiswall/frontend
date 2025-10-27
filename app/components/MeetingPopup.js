'use client'
import { useState } from 'react'

export default function MeetingPopup({ onClose, onSave, darkMode }) {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    key_points: [''],
    followup_points: [''],
    transcript_text: ''
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Generate transcript ID each time for uniqueness
      const generatedTranscriptId = crypto.randomUUID()
      
      const transcriptResponse = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          summary: formData.summary,
          key_points: formData.key_points.filter(point => point.trim()),
          followup_points: formData.followup_points.filter(point => point.trim()),
          transcript_id: generatedTranscriptId
        }),
      })

      if (transcriptResponse.ok) {
        const { meeting } = await transcriptResponse.json()
        
        const completeData = {
          ...meeting,
          transcript_text: formData.transcript_text,
          client_id: 'manual_entry',
          transcript_created_at: new Date().toISOString()
        }
        
        onSave(completeData)
        alert('Meeting added successfully!')
      } else {
        throw new Error('Failed to save meeting')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save meeting: ' + error.message)
    }
    
    setIsSaving(false)
  }

  const addKeyPoint = () => {
    setFormData(prev => ({
      ...prev,
      key_points: [...prev.key_points, '']
    }))
  }

  const removeKeyPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.filter((_, i) => i !== index)
    }))
  }

  const updateKeyPoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      key_points: prev.key_points.map((point, i) => i === index ? value : point)
    }))
  }

  const addFollowupPoint = () => {
    setFormData(prev => ({
      ...prev,
      followup_points: [...prev.followup_points, '']
    }))
  }

  const removeFollowupPoint = (index) => {
    setFormData(prev => ({
      ...prev,
      followup_points: prev.followup_points.filter((_, i) => i !== index)
    }))
  }

  const updateFollowupPoint = (index, value) => {
    setFormData(prev => ({
      ...prev,
      followup_points: prev.followup_points.map((point, i) => i === index ? value : point)
    }))
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className={`rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 p-6 border-b flex justify-between items-center ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Add Meeting
          </h2>
          <button
            onClick={onClose}
            className={`text-2xl font-bold transition-colors ${
              darkMode 
                ? 'text-gray-400 hover:text-gray-200' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Meeting Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              className={`w-full px-4 py-3 rounded-lg border transition-all ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Enter meeting title"
            />
          </div>

          {/* Summary */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Summary
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border transition-all resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Brief summary of the meeting"
            />
          </div>

          {/* Key Points */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Key Points
              </label>
              <button
                type="button"
                onClick={addKeyPoint}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                + Add Point
              </button>
            </div>
            
            {formData.key_points.map((point, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateKeyPoint(index, e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={`Key point ${index + 1}`}
                />
                {formData.key_points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeKeyPoint(index)}
                    className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                      darkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Follow-up Points */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <label className={`text-sm font-medium ${
                darkMode ? 'text-gray-200' : 'text-gray-900'
              }`}>
                Follow-up Points
              </label>
              <button
                type="button"
                onClick={addFollowupPoint}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                + Add Point
              </button>
            </div>
            
            {formData.followup_points.map((point, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => updateFollowupPoint(index, e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={`Follow-up point ${index + 1}`}
                />
                {formData.followup_points.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFollowupPoint(index)}
                    className={`px-3 py-2 rounded-lg font-bold transition-colors ${
                      darkMode 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Transcript */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}>
              Full Transcript (Optional)
            </label>
            <textarea
              value={formData.transcript_text}
              onChange={(e) => setFormData({...formData, transcript_text: e.target.value})}
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border transition-all resize-vertical text-sm ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Full transcript text (optional)"
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 border rounded-lg font-medium transition-all ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
