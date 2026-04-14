import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, AlertCircle, Info } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [batch, setBatch] = useState('');
  const [section, setSection] = useState('');
  const [facultyAdvisor, setFacultyAdvisor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend email validation
    if (role === 'student' && !email.toLowerCase().endsWith('@klu.ac.in')) {
      setError('Students must use a @klu.ac.in email address to register.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        department: role === 'student' ? department : 'N/A',
        year: role === 'student' ? year : 'N/A',
        register_number: role === 'student' ? registerNumber : undefined,
        batch: role === 'student' ? batch : undefined,
        section: role === 'student' ? section : undefined,
        faculty_advisor: role === 'student' ? facultyAdvisor : undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-xl shadow-sm border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-4 space-y-5" onSubmit={handleRegister}>
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a:</label>
            <div className="flex gap-6">
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" className="form-radio text-indigo-600 h-4 w-4" name="role" value="student"
                  checked={role === 'student'} onChange={() => setRole('student')} />
                <span className="ml-2 text-gray-700">Student</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input type="radio" className="form-radio text-indigo-600 h-4 w-4" name="role" value="admin"
                  checked={role === 'admin'} onChange={() => setRole('admin')} />
                <span className="ml-2 text-gray-700">Admin / Faculty</span>
              </label>
            </div>
          </div>

          {/* Email notice for students */}
          {role === 'student' && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-md p-3">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Students must register with a <strong>@klu.ac.in</strong> email address (e.g. 99240040229@klu.ac.in)
              </p>
            </div>
          )}

          {/* Basic fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input type="email" required autoComplete="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={role === 'student' ? 'rollno@klu.ac.in' : 'admin@email.com'}
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required autoComplete="new-password"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {/* Student-only fields */}
          {role === 'student' && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-semibold text-gray-700">Academic Information</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Register Number</label>
                  <input type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. 99240040229" value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch</label>
                  <input type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. 2024" value={batch}
                    onChange={(e) => setBatch(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="">Select Dept</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="EEE">EEE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year of Study</label>
                  <select required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">Select Year</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <input type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g. 24S02" value={section}
                    onChange={(e) => setSection(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Faculty Advisor</label>
                  <input type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Faculty Name" value={facultyAdvisor}
                    onChange={(e) => setFacultyAdvisor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
