import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Mail, Building2, Calendar, Shield,
  Lock, AlertCircle, CheckCircle, Hash, BookOpen,
  Users, GraduationCap, IdCard
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../api';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-gray-500 w-48">{label}</td>
      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{value || <span className="text-gray-400 italic">—</span>}</td>
    </tr>
  );
}

export default function Profile() {
  const { userProfile, currentUser } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setMessage('');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/change-password', { oldPassword, newPassword });
      setMessage(data.message || 'Password changed successfully!');
      setError('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
      setMessage('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!userProfile || !currentUser) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  const isStudent = userProfile.role === 'student';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">View your personal and academic information</p>
      </div>

      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white flex items-center gap-5 shadow-md">
        <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
          <User className="h-10 w-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{userProfile.name}</h2>
          <p className="text-indigo-200 text-sm mt-0.5">{userProfile.email}</p>
          <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isStudent ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
            <Shield className="h-3 w-3" />
            {isStudent ? 'Student' : 'Administrator'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-teal-600 px-4 py-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <IdCard className="h-4 w-4" /> Personal Details
            </h3>
          </div>
          <table className="w-full">
            <tbody>
              {isStudent && <DetailRow label="Register Number" value={userProfile.register_number} />}
              <DetailRow label="Name" value={userProfile.name} />
              <DetailRow label="Email" value={userProfile.email} />
              <DetailRow label="Role" value={isStudent ? 'Student' : 'Administrator'} />
              <DetailRow label="Joined" value={format(new Date(userProfile.created_at || userProfile.createdAt || new Date()), 'dd MMM yyyy')} />
            </tbody>
          </table>
        </div>

        {/* Academic Details */}
        {isStudent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-teal-600 px-4 py-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Academic Details
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <DetailRow label="Department" value={userProfile.department} />
                <DetailRow label="Year of Study" value={userProfile.year} />
                <DetailRow label="Batch" value={userProfile.batch} />
                <DetailRow label="Section" value={userProfile.section} />
                <DetailRow label="Faculty Advisor" value={userProfile.faculty_advisor} />
              </tbody>
            </table>
          </div>
        )}

        {/* Account Info for admin */}
        {!isStudent && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-teal-600 px-4 py-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" /> Admin Account
              </h3>
            </div>
            <table className="w-full">
              <tbody>
                <DetailRow label="Access Level" value="Full Administrator" />
                <DetailRow label="Email" value={userProfile.email} />
                <DetailRow label="Joined" value={format(new Date(userProfile.created_at || userProfile.createdAt || new Date()), 'dd MMM yyyy')} />
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white shadow-sm overflow-hidden rounded-xl border border-gray-200">
        <div className="bg-gray-700 px-4 py-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h3>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input type="password" required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input type="password" required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input type="password" required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="sm:col-start-3">
              <button type="submit" disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70">
                {submitting ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
