import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, CheckSquare, Clock, TrendingUp, AlertCircle,
  CalendarCheck, FolderOpen, Star, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color, trend, trendValue }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value ?? '—'}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function TaskRow({ task }) {
  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Under Review': 'bg-purple-100 text-purple-700',
    'Completed': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
  };
  const priorityColors = {
    'High': 'text-red-500',
    'Medium': 'text-orange-500',
    'Low': 'text-green-500',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">Due {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</p>
      </div>
      <span className={`text-xs font-medium ${priorityColors[task.priority] || 'text-gray-500'}`}>
        {task.priority}
      </span>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
        {task.status}
      </span>
    </div>
  );
}

function ActivityItem({ log }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Activity className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{log.description || log.action}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {log.createdAt ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <div>
        <p className="font-medium text-red-700">Failed to load dashboard</p>
        <p className="text-sm text-red-500 mt-0.5">{error}</p>
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const recentTasks = data?.recentTasks || [];
  const activityLogs = data?.activityLogs || [];
  const announcements = data?.announcements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present Today" value={stats.presentToday ?? 0} icon={CalendarCheck} color="green" trend="up" trendValue="+5%" />
        <StatCard label="Active Tasks" value={stats.activeTasks ?? 0} icon={CheckSquare} color="blue" sub="Across all projects" />
        <StatCard label="Completed" value={stats.completedTasks ?? 0} icon={TrendingUp} color="purple" trend="up" trendValue="+12%" />
        <StatCard label="Performance" value={stats.performanceScore ? `${stats.performanceScore}%` : '—'} icon={Star} color="orange" sub="This month" />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Tasks</h2>
            <a href="/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</a>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No tasks assigned yet</p>
            </div>
          ) : (
            recentTasks.slice(0, 5).map((task, i) => <TaskRow key={task._id || task.id || i} task={task} />)
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Announcements</h2>
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 4).map((a, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm font-medium text-blue-800">{a.title}</p>
                  <p className="text-xs text-blue-600 mt-1 line-clamp-2">{a.content || a.message}</p>
                  <p className="text-xs text-blue-400 mt-1.5">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      {activityLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {activityLogs.slice(0, 6).map((log, i) => <ActivityItem key={i} log={log} />)}
          </div>
        </div>
      )}
    </div>
  );
}
