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

      const token = localStorage.getItem('meetingRecorderToken');
      if (!token) {
        alert('❌ Not authenticated. Please log in again.');
        return;
      }

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Schedule Follow-up Meeting
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all"
              placeholder="Enter meeting title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all resize-none"
              placeholder="Meeting agenda..."
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
                Time *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 
                         text-gray-900 dark:text-white 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent
                         transition-all"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              Attendees (comma-separated emails)
            </label>
            <input
              type="text"
              value={formData.attendees}
              onChange={(e) => setFormData({...formData, attendees: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all"
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          {/* Meeting URL */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
              Meeting URL
            </label>
            <input
              type="url"
              value={formData.meetingUrl}
              onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       transition-all"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
          </div>

          {/* Info Note */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              📧 You will receive an email reminder 30 minutes before the meeting
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 
                       text-gray-700 dark:text-gray-300 rounded-lg 
                       hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                       text-white rounded-lg hover:from-purple-700 hover:to-blue-700 
                       transition-all font-medium shadow-lg hover:shadow-xl
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleFollowup;
