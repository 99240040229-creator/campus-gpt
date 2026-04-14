import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Filter, Calendar, Tag, Building2, FileText, MessageSquare, Send, Users, CheckCircle, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api';
import { Announcement, Comment } from './AdminPanel';

interface FeeRecord {
  id: string;
  title: string;
  fee_amount: number;
  payment_status: string;
  created_at: string;
}

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterDept, setFilterDept] = useState((userProfile?.role === 'student' && userProfile.department) ? userProfile.department : 'All');
  const [filterYear, setFilterYear] = useState((userProfile?.role === 'student' && userProfile.year) ? userProfile.year : 'All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [registeringEvent, setRegisteringEvent] = useState<Announcement | null>(null);

  // Fees state (students only)
  const [fees, setFees] = useState<{ totalFees: number; paidFees: number; balance: number; registrations: FeeRecord[] } | null>(null);

  // Comments state
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadAnnouncements = async () => {
    try {
      const { data } = await api.get('/api/announcements');
      setAnnouncements(data.announcements);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFees = async () => {
    if (userProfile?.role !== 'student') return;
    try {
      const { data } = await api.get('/api/users/me/fees');
      setFees(data);
    } catch (e) {
      console.error('Failed to load fees', e);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadFees();
    window.addEventListener('announcementsUpdated', loadAnnouncements);
    return () => {
      window.removeEventListener('announcementsUpdated', loadAnnouncements);
    };
  }, []);

  const handleAddComment = async (announcementId: string) => {
    const text = commentInputs[announcementId]?.trim();
    if (!text || !currentUser || !userProfile) return;

    try {
      await api.post(`/api/announcements/${announcementId}/comments`, { text });
      
      // Optionally reload all announcements to get the updated comments list,
      // or we could optimistically update the state. Re-fetching is simplest:
      loadAnnouncements();
      
      setCommentInputs(prev => ({ ...prev, [announcementId]: '' }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment');
    }
  };

  const handleRegister = async (announcementId: string) => {
    try {
      await api.post(`/api/announcements/${announcementId}/register`);
      loadAnnouncements();
      loadFees();
      setRegisteringEvent(null);
      alert('Payment successful & Successfully registered for the event!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register for the event.');
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchDept = filterDept === 'All' || a.department === 'All' || a.department === filterDept;
    const matchYear = filterYear === 'All' || a.year === 'All' || a.year === filterYear;
    const matchCategory = filterCategory === 'All' || a.category === filterCategory;
    return matchDept && matchYear && matchCategory;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">


      <div className="pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-100">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
          <select 
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="EEE">EEE</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
          <select 
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="All">All Years</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select 
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Academic">Academic</option>
            <option value="Non-Academic">Non-Academic</option>
            <option value="Event">Event</option>
            <option value="Exams">Exams</option>
            <option value="Holidays">Holidays</option>
            <option value="Fees">Fees</option>
            <option value="Special Classes">Special Classes</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-gray-500">No announcements found matching your filters.</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{announcement.title}</h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${announcement.category === 'Academic' ? 'bg-blue-100 text-blue-800' :
                      announcement.category === 'Event' ? 'bg-yellow-100 text-yellow-800' :
                      announcement.category === 'Exams' ? 'bg-red-100 text-red-800' :
                      announcement.category === 'Fees' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'}`}>
                    {announcement.category}
                  </span>
                </div>
                
                <p className="text-gray-600 whitespace-pre-wrap mb-6">{announcement.description}</p>
                
                {announcement.pdfData && (
                  <a 
                    href={announcement.pdfData} 
                    download={announcement.pdfName || 'announcement.pdf'}
                    className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-6 bg-indigo-50 px-3 py-2 rounded-md border border-indigo-100"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF ({announcement.pdfName || 'Document'})
                  </a>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(announcement.createdAt || announcement.created_at || new Date()), 'MMM d, yyyy h:mm a')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Dept: {announcement.department}
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Year: {announcement.year}
                  </div>
                  {(announcement.category === 'Event' || announcement.category === 'Events') && (
                     <div className="flex items-center gap-1">
                       <Users className="h-4 w-4" />
                       Registered: {(announcement.registrations || []).length}
                     </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="font-medium">By {announcement.authorName}</span>
                  </div>
                </div>

                {(announcement.category === 'Event' || announcement.category === 'Events') && (
                  <div className="mt-6 flex justify-end">
                    {(() => {
                        const isRegistered = (announcement.registrations || []).some(r => r.userId === currentUser?.uid);
                        if (isRegistered) {
                          return (
                            <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm font-medium">
                              <CheckCircle className="h-4 w-4" /> Registered
                            </button>
                          );
                        }
                        return (
                          <button 
                            onClick={() => setRegisteringEvent(announcement)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            <Users className="h-4 w-4" /> Register for Event
                          </button>
                        );
                    })()}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-gray-50 p-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  Comments ({(announcement.comments || []).length})
                </h3>
                
                <div className="space-y-4 mb-4">
                  {(announcement.comments || []).map(comment => (
                    <div key={comment.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">{format(new Date(comment.createdAt || comment.created_at || new Date()), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={commentInputs[announcement.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [announcement.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(announcement.id);
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(announcement.id)}
                    disabled={!commentInputs[announcement.id]?.trim()}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment / Registration Modal */}
      {registeringEvent && (() => {
        const fee = registeringEvent.fee_amount ?? 0;
        const isFree = fee === 0;
        return (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isFree ? 'Event Registration' : 'Event Registration & Payment'}
              </h3>

              <div className={`p-4 rounded-md mb-4 border ${isFree ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <h4 className={`font-medium ${isFree ? 'text-green-900' : 'text-indigo-900'}`}>{registeringEvent.title}</h4>
                <p className={`text-sm mt-1 ${isFree ? 'text-green-700' : 'text-indigo-700'}`}>
                  {isFree
                    ? '🎉 This is a free event! Kindly confirm your details and register.'
                    : `Please confirm your details and pay ₹${fee} to secure your spot.`}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Full Name</label>
                  <div className="mt-1 text-sm text-gray-900 font-medium">{userProfile?.name}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Email Address</label>
                  <div className="mt-1 text-sm text-gray-900 font-medium">{userProfile?.email}</div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-500">Registration Fee</label>
                  {isFree ? (
                    <div className="mt-1 text-lg font-bold text-green-600">Free of Cost ✓</div>
                  ) : (
                    <div className="mt-1 text-lg font-bold text-gray-900">₹{fee.toFixed(2)}</div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setRegisteringEvent(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRegister(registeringEvent.id)}
                  className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md ${isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isFree ? 'Register for Free' : `Pay ₹${fee} & Register`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
