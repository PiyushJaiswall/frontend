'use client';
import { useState, useEffect } from 'react';

export default function MeetingPopup({ meeting, onClose, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...meeting });
  
  // Close popup with Escape key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Handle array fields
    if (name === 'key_points' || name === 'followup_points') {
      setFormData({ ...formData, [name]: value.split('\n') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSaveClick = () => {
    onSave(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-secondary rounded-lg shadow-2xl p-8 w-full max-w-2xl transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Meeting' : formData.title}</h2>
          <div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="mr-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-blue-700">Edit</button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-dark-gray text-white rounded-md hover:bg-gray-600">Close</button>
          </div>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label className="text-sm font-semibold text-medium-gray">Summary</label>
              {isEditing ? (
                  <textarea name="summary" value={formData.summary || ''} onChange={handleChange} className="w-full mt-1 p-2 bg-dark-gray text-white rounded-md border border-gray-600"/>
              ) : (
                  <p className="mt-1 p-2 bg-primary rounded-md">{formData.summary}</p>
              )}
            </div>
             <div>
              <label className="text-sm font-semibold text-medium-gray">Key Points</label>
              {isEditing ? (
                  <textarea name="key_points" value={Array.isArray(formData.key_points) ? formData.key_points.join('\n') : ''} onChange={handleChange} rows="4" className="w-full mt-1 p-2 bg-dark-gray text-white rounded-md border border-gray-600"/>
              ) : (
                  <ul className="list-disc list-inside mt-1 p-2 bg-primary rounded-md">
                      {Array.isArray(formData.key_points) && formData.key_points.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>
              )}
            </div>
             <div>
              <label className="text-sm font-semibold text-medium-gray">Follow-up Points</label>
              {isEditing ? (
                  <textarea name="followup_points" value={Array.isArray(formData.followup_points) ? formData.followup_points.join('\n') : ''} onChange={handleChange} rows="4" className="w-full mt-1 p-2 bg-dark-gray text-white rounded-md border border-gray-600"/>
              ) : (
                 <ul className="list-disc list-inside mt-1 p-2 bg-primary rounded-md">
                      {Array.isArray(formData.followup_points) && formData.followup_points.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>
              )}
            </div>
             <div>
              <label className="text-sm font-semibold text-medium-gray">Next Meeting Schedule</label>
              {isEditing ? (
                  <input type="datetime-local" name="next_meet_schedule" value={formData.next_meet_schedule ? formData.next_meet_schedule.slice(0, 16) : ''} onChange={handleChange} className="w-full mt-1 p-2 bg-dark-gray text-white rounded-md border border-gray-600"/>
              ) : (
                 <p className="mt-1 p-2 bg-primary rounded-md">{formData.next_meet_schedule ? new Date(formData.next_meet_schedule).toLocaleString() : 'Not set'}</p>
              )}
            </div>
        </div>

        {isEditing && (
            <div className="mt-6 flex justify-end">
                <button onClick={() => setIsEditing(false)} className="mr-2 px-4 py-2 bg-dark-gray text-white rounded-md hover:bg-gray-600">Cancel</button>
                <button onClick={handleSaveClick} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Changes</button>
            </div>
        )}
      </div>
    </div>
  );
}
