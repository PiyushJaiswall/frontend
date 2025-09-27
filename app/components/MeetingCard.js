'use client';

export default function MeetingCard({ meeting, onClick }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div
            onClick={onClick}
            className="bg-secondary rounded-lg p-6 shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-1 border border-transparent hover:border-accent/50"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">{meeting.title || 'Untitled Meeting'}</h3>
                    <p className="text-sm text-medium-gray mt-1">Created: {formatDate(meeting.created_at)}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-white">Next Meeting:</p>
                    <p className="text-sm text-light-gray">{meeting.next_meet_schedule ? formatDate(meeting.next_meet_schedule) : 'Not Scheduled'}</p>
                </div>
            </div>
             <p className="text-medium-gray mt-4 text-sm truncate">{meeting.summary || "No summary available."}</p>
        </div>
    );
}
