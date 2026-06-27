import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Trophy, Medal, Star, TrendingUp, CheckSquare, CalendarCheck, AlertCircle } from 'lucide-react';

const medals = ['🥇', '🥈', '🥉'];

function RankBadge({ rank }) {
  if (rank <= 3) return <span className="text-2xl">{medals[rank - 1]}</span>;
  return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <span className="text-sm font-bold text-gray-600">#{rank}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLeaderboard()
      .then(res => setData(Array.isArray(res) ? res : res?.leaderboard || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">Monthly performance rankings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No leaderboard data yet</p>
          <p className="text-gray-400 text-sm mt-1">Performance scores will appear here</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 1 && (
            <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-2xl p-6">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd */}
                {top3[1] && (
                  <div className="flex flex-col items-center pb-2">
                    <div className="w-14 h-14 rounded-full bg-slate-400/20 border-2 border-slate-400 flex items-center justify-center mb-2">
                      <span className="text-xl font-bold text-white">{top3[1].name?.[0]}</span>
                    </div>
                    <div className="w-24 h-20 bg-slate-600/50 rounded-t-xl flex flex-col items-center justify-center">
                      <span className="text-2xl">🥈</span>
                      <p className="text-white text-xs font-medium mt-1 truncate px-1 w-full text-center">{top3[1].name}</p>
                      <p className="text-slate-300 text-xs">{top3[1].performanceScore || top3[1].score || 0}pts</p>
                    </div>
                  </div>
                )}
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center mb-2 ring-4 ring-yellow-400/20">
                    <span className="text-2xl font-bold text-white">{top3[0].name?.[0]}</span>
                  </div>
                  <div className="w-24 h-28 bg-yellow-500/20 border border-yellow-500/30 rounded-t-xl flex flex-col items-center justify-center">
                    <span className="text-2xl">🥇</span>
                    <p className="text-white text-xs font-bold mt-1 truncate px-1 w-full text-center">{top3[0].name}</p>
                    <p className="text-yellow-300 text-xs">{top3[0].performanceScore || top3[0].score || 0}pts</p>
                  </div>
                </div>
                {/* 3rd */}
                {top3[2] && (
                  <div className="flex flex-col items-center pb-2">
                    <div className="w-14 h-14 rounded-full bg-orange-400/20 border-2 border-orange-600 flex items-center justify-center mb-2">
                      <span className="text-xl font-bold text-white">{top3[2].name?.[0]}</span>
                    </div>
                    <div className="w-24 h-16 bg-orange-900/30 rounded-t-xl flex flex-col items-center justify-center">
                      <span className="text-2xl">🥉</span>
                      <p className="text-white text-xs font-medium mt-1 truncate px-1 w-full text-center">{top3[2].name}</p>
                      <p className="text-orange-300 text-xs">{top3[2].performanceScore || top3[2].score || 0}pts</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full rankings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Full Rankings</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.map((employee, i) => (
                <div key={employee._id || employee.id || i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 flex items-center justify-center">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                    {employee.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{employee.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{employee.role || 'Employee'}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
                    {employee.completedTasks !== undefined && (
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>{employee.completedTasks} tasks</span>
                      </div>
                    )}
                    {employee.attendance !== undefined && (
                      <div className="flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5 text-green-400" />
                        <span>{employee.attendance}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-gray-800">{employee.performanceScore || employee.score || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
