import { useState } from 'react';
import { api } from '../services/api';
import { BarChart3, Download, FileText, Users, CalendarCheck, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const reportTypes = [
  { id: 'employee', label: 'Employee Report', icon: Users, desc: 'Full employee performance summary', color: 'blue' },
  { id: 'attendance', label: 'Attendance Report', icon: CalendarCheck, desc: 'Attendance patterns and leave analysis', color: 'green' },
  { id: 'productivity', label: 'Productivity Report', icon: TrendingUp, desc: 'Task completion and milestone tracking', color: 'purple' },
  { id: 'project', label: 'Project ROI Report', icon: BarChart3, desc: 'Project progress and return metrics', color: 'orange' },
];

const iconColors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
};

function DataTable({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No data available</p>;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {keys.map(k => (
              <th key={k} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider capitalize">
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {keys.map(k => (
                <td key={k} className="px-4 py-3 text-gray-700">{String(row[k] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const [activeType, setActiveType] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async (type) => {
    setActiveType(type);
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const res = await api.getReports(type);
      setReportData(Array.isArray(res) ? res : res?.data || res?.report || [res]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const keys = Object.keys(reportData[0]);
    const rows = [keys.join(','), ...reportData.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${activeType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Generate and export workforce insights</p>
      </div>

      {/* Report type selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportTypes.map(({ id, label, icon: Icon, desc, color }) => (
          <button
            key={id}
            onClick={() => generateReport(id)}
            className={`text-left p-5 bg-white rounded-2xl border transition-all hover:shadow-md ${
              activeType === id ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconColors[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm mb-1">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </button>
        ))}
      </div>

      {/* Report results */}
      {(loading || error || reportData) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-900 capitalize">
                {activeType?.replace(/-/g, ' ')} Report
              </h2>
            </div>
            {reportData && reportData.length > 0 && (
              <button onClick={downloadCSV}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}

          {reportData && <DataTable data={reportData} />}
        </div>
      )}
    </div>
  );
}
