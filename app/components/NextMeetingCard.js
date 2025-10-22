'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users } from 'lucide-react';

const NextMeetingCard = () => {
  const [nextMeeting, setNextMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeUntil, setTimeUntil] = useState('');

  useEffect(() => {
    fetchNextMeeting();
    const interval = setInterval(fetchNextMeeting, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (nextMeeting) {
      const interval = setInterval(() => {
        updateTimeUntil();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [nextMeeting]);

  const fetchNextMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://piyushooo-backend.hf.space/api/meetings/next-scheduled', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success && data.next_meeting) {
        setNextMeeting(data.next_meeting);
      } else {
        setNextMeeting(null);
      }
    } catch (error) {
      console.error('Failed to fetch next meeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeUntil = () => {
    if (!nextMeeting) return;
    
    const now = new Date();
    const meetingTime = new Date(nextMeeting.start_time);
    const diff = meetingTime - now;

    if (diff < 0) {
      setTimeUntil('Meeting in progress');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      setTimeUntil(`in ${days} day${days > 1 ? 's' : ''}`);
    } else if (hours > 0) {
      setTimeUntil(`in ${hours}h ${minutes}m`);
    } else {
      setTimeUntil(`in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'google_meet':
        return '📹';
      case 'zoom':
        return '🎥';
      case 'microsoft_teams':
        return '💼';
      default:
        return '🎯';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!nextMeeting) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Next Scheduled Meeting</h3>
        </div>
        <p className="text-gray-600 text-sm">No upcoming meetings scheduled</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Next Meeting</h3>
        </div>
        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
          {timeUntil}
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-lg text-gray-900">
          {getPlatformIcon(nextMeeting.platform)} {nextMeeting.title}
        </h4>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(nextMeeting.start_time)}</span>
          </div>
          <span className="font-medium">{formatTime(nextMeeting.start_time)}</span>
        </div>

        {nextMeeting.attendees && nextMeeting.attendees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{nextMeeting.attendees.length} attendee{nextMeeting.attendees.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {nextMeeting.meeting_url && (
          <button
            onClick={() => window.open(nextMeeting.meeting_url, '_blank')}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Meeting
          </button>
        )}
      </div>
    </div>
  );
};

export default NextMeetingCard;
