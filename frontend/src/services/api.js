const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const api = {
  login: async (credentials) => {
    const data = await request('POST', '/login', credentials);
    // Flask returns "access_token", we normalize it to "token"
    return { token: data.access_token, user: data.user };
  },

  getProfile: () => request('GET', '/profile'),
  updateProfile: (d) => request('PUT', '/profile', d),

  getDashboard: async () => {
    const data = await request('GET', '/dashboard');
    return {
      stats: {
        presentToday: data.present_today,
        activeTasks: data.total_tasks,
        completedTasks: data.completed_tasks,
        performanceScore: data.performance_score,
      },
      recentTasks: [],
      activityLogs: [],
      announcements: [],
    };
  },

  getAttendance: async () => {
    try {
      const history = await request('GET', '/attendance/history');
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = (Array.isArray(history) ? history : []).find(r => r.date === todayStr);
      return {
        today: todayRecord ? {
          loginTime: todayRecord.check_in,
          logoutTime: todayRecord.check_out,
          totalHours: todayRecord.total_hours,
          status: todayRecord.status,
        } : {},
      };
    } catch { return { today: {} }; }
  },

  checkIn: () => request('POST', '/attendance/checkin'),
  checkOut: () => request('POST', '/attendance/checkout'),

  getAttendanceHistory: async () => {
    const data = await request('GET', '/attendance/history');
    return (Array.isArray(data) ? data : []).map(r => ({
      date: r.date,
      loginTime: r.check_in,
      logoutTime: r.check_out,
      totalHours: r.total_hours,
      status: r.status || 'Present',
    }));
  },

  getTasks: () => request('GET', '/tasks'),

  createTask: (task) => request('POST', '/tasks', {
    title: task.title,
    description: task.description,
    assigned_to: task.assigned_to || null,
    priority: task.priority,
    deadline: task.deadline || null,
  }),

  updateTask: (id, task) => request('PUT', `/tasks/${id}`, {
    status: task.status,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
  }),

  updateTaskStatus: (id, status) => request('PUT', `/tasks/${id}`, { status }),
  deleteTask: (id) => request('PUT', `/tasks/${id}`, { status: 'Rejected' }),

  getProjects: async () => {
    const data = await request('GET', '/projects');
    return (Array.isArray(data) ? data : []).map(p => ({
      ...p,
      team: p.assigned_team,
      milestones: p.milestone,
      deliverableUrl: p.deliverable_url,
      completionPercentage: p.completion_percentage,
    }));
  },

  createProject: (p) => request('POST', '/projects', {
    name: p.name,
    description: p.description,
    assigned_team: p.team,
    milestone: p.milestones,
    deliverable_url: p.deliverableUrl,
    completion_percentage: p.completionPercentage || 0,
  }),

  updateProject: (id, p) => request('PUT', `/projects/${id}`, {
    completion_percentage: p.completionPercentage || 0,
    milestone: p.milestones,
  }),

  deleteProject: async () => ({ message: 'Not supported' }),

  getLeaderboard: () => request('GET', '/leaderboard'),

  getReports: async (type) => {
    try { return await request('GET', `/reports/${type}`); }
    catch { return []; }
  },

  getMessages: async (channel) => {
    try { return await request('GET', `/chat/${channel}`); }
    catch { return []; }
  },

  sendMessage: async (channel, content) => {
    try { return await request('POST', `/chat/${channel}`, { content }); }
    catch { return { content, createdAt: new Date().toISOString() }; }
  },

  getUsers: async () => {
    try { return await request('GET', '/users'); }
    catch { return []; }
  },
};