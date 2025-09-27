'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import MeetingCard from './MeetingCard';
import MeetingPopup from './MeetingPopup';
import toast from 'react-hot-toast';

export default function MeetingDetails() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchMeetings = async () => {
    setLoading(true);
    let query = supabase.from('meetings').select('*').order('created_at', { ascending: false });

    if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
    }
    if (dateFilter) {
        query = query.gte('created_at', new Date(dateFilter).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Could not fetch meetings.');
      console.error(error);
    } else {
      setMeetings(data);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchMeetings();
    
    const channel = supabase
      .channel('meetings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        (payload) => {
          console.log('Change received!', payload);
          fetchMeetings(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchTerm, dateFilter]);

  const handleCardClick = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleClosePopup = () => {
    setSelectedMeeting(null);
  };
  
    const handleSave = async (updatedMeeting) => {
    const { data, error } = await supabase
      .from('meetings')
      .update(updatedMeeting)
      .eq('id', updatedMeeting.id);

    if (error) {
      toast.error('Failed to update meeting.');
      console.error(error);
    } else {
      toast.success('Meeting updated successfully!');
      handleClosePopup();
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search meetings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow px-4 py-2 bg-secondary text-white border border-dark-gray rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 bg-secondary text-white border border-dark-gray rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {/* Manual Entry Button could trigger a popup similar to the edit one but with empty fields */}
        <button className="px-4 py-2 font-semibold text-white bg-accent rounded-md hover:bg-blue-700">
          Manual Entry
        </button>
      </div>
      
      {loading ? (
        <p>Loading meetings...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} onClick={() => handleCardClick(meeting)} />
          ))}
        </div>
      )}

      {selectedMeeting && (
        <MeetingPopup meeting={selectedMeeting} onClose={handleClosePopup} onSave={handleSave} />
      )}
    </div>
  );
}
