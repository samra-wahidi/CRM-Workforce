import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Clock, LogIn, LogOut, Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  Present: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  Absent: { color: 'bg-red-100 text-red-700', icon: XCircle },
  Late: { color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
};

export default function AttendancePage() {
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([api.getAttendance(), api.getAttendanceHistory()])
      .then(([att, hist]) => {
        setAttendance(att);
        setHistory(Array.isArray(hist) ? hist : hist?.history || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const notify = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleCheckIn = async () => {
    setActionLoading('in');
    try {
      const res = await api.checkIn();
      setAttendance(res);
      notify('Checked in successfully!');
    } catch (e) { notify(e.message, true); }
    finally { setActionLoading(''); }
  };

  const handleCheckOut = async () => {
    setActionLoading('out');
    try {
      const res = await api.checkOut();
      setAttendance(res);
      notify('Checked out successfully!');
    } catch (e) { notify(e.message, true); }
    finally { setActionLoading(''); }
  };

  const today = attendance?.today || {};
  const isCheckedIn = !!today.loginTime && !today.logoutTime;
  const isCheckedOut = !!today.logoutTime;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Track your daily attendance and work hours</p>
      </div>

      {(error || success) && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {error || success}
        </div>
      )}

      {/* Clock + Check-in Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clock */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-8 text-white flex flex-col items-center justify-center">
          <Clock className="w-10 h-10 text-blue-400 mb-4" />
          <p className="text-5xl font-bold tabular-nums tracking-tight">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-slate-400 mt-2 text-sm">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Today's status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Today's Status</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><LogIn className="w-4 h-4" /> Check-In</span>
              <span className="text-sm font-semibold text-gray-800">
                {today.loginTime ? new Date(today.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-sm text-gray-500 flex items-center gap-2"><LogOut className="w-4 h-4" /> Check-Out</span>
              <span className="text-sm font-semibold text-gray-800">
                {today.logoutTime ? new Date(today.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Hours Worked</span>
              <span className="text-sm font-semibold text-gray-800">{today.totalHours ?? '—'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn || isCheckedOut || actionLoading === 'in'}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {actionLoading === 'in' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn || actionLoading === 'out'}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {actionLoading === 'out' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Monthly stats */}
      {attendance?.monthly && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Present', value: attendance.monthly.present, color: 'text-green-600 bg-green-50' },
            { label: 'Absent', value: attendance.monthly.absent, color: 'text-red-600 bg-red-50' },
            { label: 'Late', value: attendance.monthly.late, color: 'text-yellow-600 bg-yellow-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl p-5 text-center ${color.split(' ')[1]}`}>
              <p className={`text-3xl font-bold ${color.split(' ')[0]}`}>{value ?? 0}</p>
              <p className={`text-sm font-medium mt-1 ${color.split(' ')[0]}`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Attendance History</h2>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Check-In', 'Check-Out', 'Hours', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.map((record, i) => {
                  const cfg = statusConfig[record.status] || { color: 'bg-gray-100 text-gray-600', icon: AlertCircle };
                  return (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        {record.date ? new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {record.loginTime ? new Date(record.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{record.totalHours ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          {record.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
