import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Trash2, AlertCircle, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api';

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt?: string;
  created_at?: string;
}

export interface Registration {
  id: string;
  announcementId: string;
  userId: string;
  userName: string;
  user_name?: string;
  userEmail?: string;
  user_email?: string;
  paymentStatus?: string;
  payment_status?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  pdfData?: string;
  pdfName?: string;
  department: string;
  year: string;
  category: string;
  fee_amount?: number;
  feeAmount?: number;
  authorId: string;
  authorName: string;
  createdAt?: string;
  created_at?: string;
  comments: Comment[];
  registrations?: Registration[];
}

export default function AdminPanel() {
  const { userProfile, currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [department, setDepartment] = useState('All');
  const [year, setYear] = useState('All');
  const [category, setCategory] = useState('Academic');
  const [feeAmount, setFeeAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  useEffect(() => {
    loadAnnouncements();
    // Re-fetch when comments are updated from Dashboard
    window.addEventListener('announcementsUpdated', loadAnnouncements);
    return () => {
      window.removeEventListener('announcementsUpdated', loadAnnouncements);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed.');
        e.target.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB.');
        e.target.value = '';
        return;
      }
      setPdfName(file.name);
      
      // Store the actual file for FormData
      setPdfData(file as unknown as string); 
    } else {
      setPdfData('');
      setPdfName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) return;
    
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('department', department);
      formData.append('year', year);
      formData.append('category', category);
      formData.append('feeAmount', feeAmount);
      
      if (pdfData && pdfData instanceof File) {
        formData.append('pdf', pdfData);
      }
      
      const { data } = await api.post('/api/announcements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAnnouncements(data.announcements);
      window.dispatchEvent(new Event('announcementsUpdated'));
      
      setSuccess('Announcement posted successfully!');
      setTitle('');
      setDescription('');
      setPdfData('');
      setPdfName('');
      setDepartment('All');
      setYear('All');
      setCategory('Academic');
      setFeeAmount('0');
      
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/api/announcements/${id}`);
        setAnnouncements(announcements.filter(a => a.id !== id));
        window.dispatchEvent(new Event('announcementsUpdated'));
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete');
      }
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You must be an admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and post new announcements</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-indigo-600" />
          Post New Announcement
        </h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Attach PDF (Optional, max 2MB)</label>
            <div className="mt-1 flex items-center gap-4">
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Department</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700">Target Year</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="All">All Years</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
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

          {category === 'Event' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                Registration Fee (₹) — enter 0 for free
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="mt-1 block w-full sm:w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">Students will see this fee before registering. Leave 0 for free registration.</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {submitting ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Announcements</h2>
        
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No announcements posted yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <React.Fragment key={announcement.id}>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      {announcement.pdfData && <FileText className="h-4 w-4 text-indigo-500" />}
                      {announcement.title.length > 30 ? announcement.title.substring(0, 30) + '...' : announcement.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {announcement.department} / {announcement.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${announcement.category === 'Academic' ? 'bg-blue-100 text-blue-800' :
                        announcement.category === 'Event' ? 'bg-yellow-100 text-yellow-800' :
                        announcement.category === 'Exams' ? 'bg-red-100 text-red-800' :
                        announcement.category === 'Fees' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'}`}>
                        {announcement.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(announcement.createdAt || announcement.created_at || new Date()), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {(announcement.category === 'Event' || announcement.category === 'Events') && (
                        <button 
                          onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold"
                        >
                          {expandedId === announcement.id ? 'Hide Registrations' : 'View Registrations'}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(announcement.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                  {expandedId === announcement.id && (announcement.category === 'Event' || announcement.category === 'Events') && (
                    <tr className="bg-gray-50 shadow-inner">
                      <td colSpan={5} className="px-6 py-4">
                        {/* Summary row */}
                        <div className="flex flex-wrap gap-6 mb-4 text-sm">
                          <div className="font-semibold text-gray-900">Total Registered: <span className="text-indigo-600">{announcement.registrations?.length || 0}</span></div>
                          {(announcement.fee_amount || 0) > 0 && (
                            <>
                              <div className="font-semibold text-green-700">Paid: <span>{(announcement.registrations || []).filter(r => (r.paymentStatus || r.payment_status) === 'paid').length}</span></div>
                              <div className="font-semibold text-red-600">Pending: <span>{(announcement.registrations || []).filter(r => (r.paymentStatus || r.payment_status) !== 'paid').length}</span></div>
                              <div className="font-semibold text-gray-700">Fee/student: <span>₹{announcement.fee_amount}</span></div>
                              <div className="font-semibold text-gray-700">Total Collected: <span className="text-green-700">₹{((announcement.fee_amount || 0) * (announcement.registrations || []).filter(r => (r.paymentStatus || r.payment_status) === 'paid').length).toFixed(2)}</span></div>
                            </>
                          )}
                          {(announcement.fee_amount || 0) === 0 && (
                            <div className="text-gray-500 italic">Free Event — no fees collected</div>
                          )}
                        </div>
                        {announcement.registrations && announcement.registrations.length > 0 ? (
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {announcement.registrations.map(reg => {
                              const isPaid = (reg.paymentStatus || reg.payment_status) === 'paid';
                              const isFree = (announcement.fee_amount || 0) === 0;
                              return (
                                <li key={reg.id} className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between gap-2">
                                  <div>
                                    <div className="font-medium text-gray-800">{reg.userName || reg.user_name}</div>
                                    <div className="text-sm text-gray-500">{reg.userEmail || reg.user_email || 'Email unavailable'}</div>
                                  </div>
                                  {isFree ? (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">Free</span>
                                  ) : isPaid ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">✓ Paid</span>
                                  ) : (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">Pending</span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No registrations yet.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
