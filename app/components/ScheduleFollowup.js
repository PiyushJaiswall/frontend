'use client';
import { useState } from 'react';
import { Calendar, Clock, Users, Link } from 'lucide-react';

const ScheduleFollowup = ({ meetingId, meetingTitle, onClose, onScheduled }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: `Follow-up: ${meetingTitle}`,
    description: '',
    date: '',
    time: '',
    duration: '30',
    attendees: '',
    meetingUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);

      const payload = {
        title: formData.title,
        description: formData.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        meeting_url: formData.meetingUrl || null,
        attendees: formData.attendees ? formData.attendees.split(',').map(e => e.trim()) : []
      };

      // ✅ FIX: Get token from localStorage
      const token = localStorage.getItem('meetingRecorderToken');
      
      if (!token) {
        alert('❌ Not authenticated. Please log in again.');
        return;
      }

      console.log('🚀 Sending schedule request with token:', token.substring(0, 20) + '...');

      const response = await fetch('https://piyushooo-backend.hf.space/api/calendar/schedule-followup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ Follow-up meeting scheduled! You will receive a reminder 30 minutes before.');
        onScheduled && onScheduled(data.event);
        onClose && onClose();
      } else {
        throw new Error(data.detail || data.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Schedule error:', error);
      alert('❌ Failed to schedule meeting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Follow-up Meeting</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Meeting agenda..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attendees (comma-separated emails)
              </label>
              <input
                type="text"
                value={formData.attendees}
                onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="email1@example.com, email2@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting URL</label>
              <input
                type="url"
                value={formData.meetingUrl}
                onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            📧 You will receive an email reminder 30 minutes before
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleFollowup;
