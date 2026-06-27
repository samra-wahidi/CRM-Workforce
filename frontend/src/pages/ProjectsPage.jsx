import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, X, Loader2, FolderKanban, Users, Calendar, Link, AlertCircle, Trash2, Edit3 } from 'lucide-react';

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-orange-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-500">Completion</span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState(project || { name: '', description: '', team: '', milestones: '', deliverableUrl: '', completionPercentage: 0 });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onSave(form); onClose(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-900">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Project name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Project description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Team</label>
            <input value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Frontend, Backend" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Key Milestones</label>
            <input value={form.milestones} onChange={e => setForm({ ...form, milestones: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. MVP, Beta, Launch" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deliverable URL</label>
            <input type="url" value={form.deliverableUrl} onChange={e => setForm({ ...form, deliverableUrl: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://github.com/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion % ({form.completionPercentage || 0}%)</label>
            <input type="range" min={0} max={100} value={form.completionPercentage || 0}
              onChange={e => setForm({ ...form, completionPercentage: Number(e.target.value) })}
              className="w-full accent-blue-600" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 text-sm">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    api.getProjects()
      .then(data => setProjects(Array.isArray(data) ? data : data?.projects || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = async (form) => {
    if (modal && modal._id) await api.updateProject(modal._id || modal.id, form);
    else await api.createProject(form);
    fetchProjects();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    await api.deleteProject(id).catch(e => alert(e.message));
    fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} active projects</p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div key={project._id || project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(project)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(project._id || project.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
              {project.description && <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>}

              <div className="space-y-2 mb-4 text-xs text-gray-500">
                {project.team && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>{project.team}</span>
                  </div>
                )}
                {project.milestones && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.milestones}</span>
                  </div>
                )}
                {project.deliverableUrl && (
                  <div className="flex items-center gap-2">
                    <Link className="w-3.5 h-3.5" />
                    <a href={project.deliverableUrl} target="_blank" rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate">{project.deliverableUrl}</a>
                  </div>
                )}
              </div>

              <ProgressBar value={project.completionPercentage} />
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ProjectModal
          project={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
