import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Edit2, Save, X, AlertCircle, CheckCircle, IndianRupee, CreditCard } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

interface StudentFee {
  id: string;
  name: string;
  email: string;
  department?: string;
  year?: string;
  register_number?: string;
  batch?: string;
  section?: string;
  faculty_advisor?: string;
  totalFees: number;
  paidFees: number;
  balance: number;
  created_at?: string;
}

const DEPT_OPTIONS = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'];
const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th'];

export default function StudentsPanel() {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StudentFee>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Payment Modal state
  const [selectedStudent, setSelectedStudent] = useState<StudentFee | null>(null);
  const [studentRegs, setStudentRegs] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/api/users');
      setStudents(data.students);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (s: StudentFee) => {
    setEditId(s.id);
    setEditData({
      register_number: s.register_number || '',
      batch: s.batch || '',
      year: s.year || '',
      section: s.section || '',
      faculty_advisor: s.faculty_advisor || '',
      department: s.department || '',
    });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await api.patch(`/api/users/${id}`, editData);
      await load();
      setEditId(null);
      showToast('success', 'Student details updated successfully!');
    } catch (e: any) {
      showToast('error', e.response?.data?.error || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = async (s: StudentFee) => {
    setSelectedStudent(s);
    setLoadingRegs(true);
    try {
      // We can reuse the student fees endpoint if we modify it or just use the existing one if we can.
      // Actually, let's just fetch registrations for this student.
      // Wait, we don't have a direct "admin get student regs" endpoint, but we can add one or use a trick.
      // Let's just fetch all regs for the student. I'll need a new route.
      const { data } = await api.get(`/api/users/${s.id}/registrations`);
      setStudentRegs(data.registrations);
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to load registrations.');
    } finally {
      setLoadingRegs(false);
    }
  };

  const togglePayment = async (regId: string) => {
    try {
      await api.post(`/api/users/registrations/${regId}/toggle-payment`);
      // Update local state for modal
      setStudentRegs(prev => prev.map(r => r.id === regId ? { ...r, payment_status: r.payment_status === 'paid' ? 'pending' : 'paid' } : r));
      // Reload main student list to update summary numbers
      load();
    } catch (e) {
      console.error(e);
      showToast('error', 'Failed to update payment status.');
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
      </div>
    );
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.register_number || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = students.reduce((s, st) => s + st.paidFees, 0);
  const totalPending = students.reduce((s, st) => s + st.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" /> Students Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">View, edit student academic details and track fees</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <IndianRupee className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Fees Collected</p>
            <p className="text-2xl font-bold text-green-600">₹{totalCollected.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <IndianRupee className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Pending Balance</p>
            <p className="text-2xl font-bold text-red-500">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or register number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No students found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name / Email', 'Reg. No', 'Dept', 'Year', 'Batch', 'Section', 'Faculty Advisor', 'Total Fees', 'Paid', 'Balance', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </td>
                    {editId === s.id ? (
                      <>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-28 text-xs" value={editData.register_number || ''} onChange={e => setEditData(p => ({ ...p, register_number: e.target.value }))} /></td>
                        <td className="px-4 py-2">
                          <select className="border rounded px-1 py-1 text-xs" value={editData.department || ''} onChange={e => setEditData(p => ({ ...p, department: e.target.value }))}>
                            <option value="">-</option>
                            {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select className="border rounded px-1 py-1 text-xs" value={editData.year || ''} onChange={e => setEditData(p => ({ ...p, year: e.target.value }))}>
                            <option value="">-</option>
                            {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-20 text-xs" value={editData.batch || ''} onChange={e => setEditData(p => ({ ...p, batch: e.target.value }))} /></td>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-20 text-xs" value={editData.section || ''} onChange={e => setEditData(p => ({ ...p, section: e.target.value }))} /></td>
                        <td className="px-4 py-2"><input className="border rounded px-2 py-1 w-32 text-xs" value={editData.faculty_advisor || ''} onChange={e => setEditData(p => ({ ...p, faculty_advisor: e.target.value }))} /></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-gray-700">{s.register_number || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{s.department || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{s.year || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{s.batch || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{s.section || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-700">{s.faculty_advisor || <span className="text-gray-300">—</span>}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-gray-700 font-medium">₹{s.totalFees.toFixed(2)}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">₹{s.paidFees.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${s.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>₹{s.balance.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editId === s.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(s.id)} disabled={saving} className="text-green-600 hover:text-green-800" title="Save"><Save className="h-4 w-4" /></button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600" title="Cancel"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button onClick={() => startEdit(s)} className="text-indigo-600 hover:text-indigo-800" title="Edit details"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => openPaymentModal(s)} className="text-green-600 hover:text-green-800" title="Manage Payments"><CreditCard className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Management Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Payments</h3>
                <p className="text-sm text-gray-500">{selectedStudent.name} ({selectedStudent.email})</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingRegs ? (
                <div className="flex flex-col items-center py-12 gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <p className="text-sm text-gray-500">Loading registrations...</p>
                </div>
              ) : studentRegs.length === 0 ? (
                <div className="text-center py-12 text-gray-500 italic">No event registrations found for this student.</div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {studentRegs.map(reg => (
                      <div key={reg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-900">{reg.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" /> {format(new Date(reg.created_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">₹{reg.fee_amount.toFixed(2)}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${reg.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {reg.payment_status}
                            </span>
                          </div>
                          <button
                            onClick={() => togglePayment(reg.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reg.payment_status === 'paid' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          >
                            Mark as {reg.payment_status === 'paid' ? 'Pending' : 'Paid'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center">
              <div className="text-sm">
                <span className="text-gray-500">Total Balance Pending: </span>
                <span className="font-bold text-red-600">₹{selectedStudent.balance.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
