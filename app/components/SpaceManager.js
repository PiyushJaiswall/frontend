'use client'
import { useState, useEffect } from 'react'

export default function SpaceManager({ meetings, onClose, darkMode, dateFilter, customDateRange }) {
  const [spaceStats, setSpaceStats] = useState({
    totalMeetings: 0,
    totalSize: 0,
    averageSize: 0,
    transcriptSize: 0,
    summarySize: 0
  })

  useEffect(() => {
    calculateSpaceStats()
  }, [meetings])

    const getFilteredMeetings = () => {
      if (dateFilter === 'all') return meetings;
  
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
      if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        const endDate = new Date(customDateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire final day
  
        return meetings.filter(meeting => {
          const meetingDate = new Date(meeting.created_at);
          return meetingDate >= startDate && meetingDate <= endDate;
        });
      }
  
      return meetings.filter(meeting => {
        const meetingDate = new Date(meeting.created_at);
        switch (dateFilter) {
          case 'today':
            return meetingDate >= today;
          case 'week':
            return meetingDate >= weekAgo;
          case 'month':
            return meetingDate >= monthAgo;
          default:
            return true;
        }
      });
    }
      
  const calculateSpaceStats = () => {
    let totalSize = 0
    let transcriptSize = 0
    let summarySize = 0

    meetings.forEach(meeting => {
      if (meeting.transcript_text) {
        transcriptSize += meeting.transcript_text.length
      }
      if (meeting.summary) {
        summarySize += meeting.summary.length
      }
      if (meeting.key_points) {
        summarySize += JSON.stringify(meeting.key_points).length
      }
      if (meeting.followup_points) {
        summarySize += JSON.stringify(meeting.followup_points).length
      }
    })

    totalSize = transcriptSize + summarySize

    setSpaceStats({
      totalMeetings: meetings.length,
      totalSize: totalSize,
      averageSize: meetings.length > 0 ? totalSize / meetings.length : 0,
      transcriptSize: transcriptSize,
      summarySize: summarySize
    })
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadAllData = () => {
    const allData = {
      export_date: new Date().toISOString(),
      total_meetings: meetings.length,
      meetings: meetings.map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        summary: meeting.summary,
        key_points: meeting.key_points,
        followup_points: meeting.followup_points,
        transcript: meeting.transcript_text,
        created_at: meeting.created_at,
        client_id: meeting.client_id,
        transcript_created_at: meeting.transcript_created_at
      }))
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    const filtered = getFilteredMeetings();
  
    const csvHeaders = ['Title', 'Summary', 'Key Points', 'Follow-ups', 'Created Date', 'Client ID'];
    const csvRows = filtered.map(meeting => [
      `"${(meeting.title || '').replace(/"/g, '""')}"`,
      `"${(meeting.summary || '').replace(/"/g, '""')}"`,
      `"${(meeting.key_points || []).join('; ').replace(/"/g, '""')}"`,
      `"${(meeting.followup_points || []).join('; ').replace(/"/g, '""')}"`,
      `"${new Date(meeting.created_at).toLocaleDateString()}"`,
      `"${meeting.client_id || ''}"`
    ]);
  
    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const getStorageUsagePercentage = () => {
    // Simulate storage limits (you can adjust based on your actual limits)
    const totalLimit = 750 * 1024 * 1024 // 750MB limit
    return Math.min((spaceStats.totalSize / totalLimit) * 100, 100)
  }

  const storagePercentage = getStorageUsagePercentage()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Storage Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Storage Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Storage Overview</h3>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Used Storage</span>
                <span className="text-gray-800 dark:text-white font-medium">
                  {formatBytes(spaceStats.totalSize)} / 100 MB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    storagePercentage > 80 ? 'bg-red-500' : 
                    storagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {storagePercentage.toFixed(1)}% used
                {storagePercentage > 80 && (
                  <span className="text-red-600 dark:text-red-400 ml-2">
                    ⚠️ Storage almost full
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meetings</h4>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {spaceStats.totalMeetings}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Size</h4>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatBytes(spaceStats.averageSize)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Transcripts</h4>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatBytes(spaceStats.transcriptSize)}
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Summaries</h4>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatBytes(spaceStats.summarySize)}
              </p>
            </div>
          </div>

          {/* Backup & Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">Data Backup & Export</h3>
            
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={downloadAllData}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📦</span>
                <span>Download Complete Backup (JSON)</span>
              </button>
              
              <button
                onClick={downloadCSV}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>📊</span>
                <span>Export Summaries (CSV)</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>• <strong>Complete Backup:</strong> All meeting data including transcripts</p>
              <p>• <strong>CSV Export:</strong> Summaries only, suitable for spreadsheets</p>
              <p>• Backup files can be imported back if needed</p>
            </div>
          </div>

          {/* Storage Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-2">
              💡 Storage Management Tips
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Delete old meetings you no longer need</li>
              <li>• Download backups regularly to preserve data</li>
              <li>• Use bulk delete for multiple meetings at once</li>
              <li>• Consider keeping only summaries for very old meetings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
