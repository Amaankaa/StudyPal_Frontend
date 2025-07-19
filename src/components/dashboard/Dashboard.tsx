import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../common/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import {
  BookOpen,
  FileText,
  CreditCard,
  Brain,
  Plus,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Calendar,
  Users,
  Check,
  X,
  Bell,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { CheckCircle, Flame, Trophy } from 'lucide-react';

interface DashboardStats {
  notebooks: number;
  notes: number;
  flashcards: number;
  quizzes: number;
}

interface GroupInvitation {
  id: number;
  group: {
    id: number;
    name: string;
    description: string;
  };
  invited_by: {
    id: number;
    username: string;
    first_name: string;
  };
  created_at: string;
  status: string;
}

interface UserProgress {
  total_quiz_attempts: number;
  total_flashcard_attempts: number;
  average_quiz_score: number;
  flashcard_accuracy: number;
  current_streak_days: number;
  flashcard_set_attempts?: number;
}

interface LeaderboardUser {
  user_id: number;
  username: string;
  total_points: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    notebooks: 0,
    notes: 0,
    flashcards: 0,
    quizzes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [yourPoints, setYourPoints] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loadingUserPoints, setLoadingUserPoints] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notebooksRes, notesRes, quizzesRes, flashcardsRes] = await Promise.all([
          apiService.getNotebooks(),
          apiService.getNotes(),
          apiService.getQuizzes(),
          apiService.getFlashcards(),
        ]);

        setStats({
          notebooks: notebooksRes.data.length,
          notes: notesRes.data.length,
          flashcards: flashcardsRes.data.length,
          quizzes: quizzesRes.data.length,
        });
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProgress = async () => {
      setLoadingProgress(true);
      try {
        const res = await apiService.getUserProgress();
        setUserProgress(res.data);
      } catch (error) {
        toast.error('Failed to load user progress');
      } finally {
        setLoadingProgress(false);
      }
    };

    const fetchInvitations = async () => {
      setLoadingInvitations(true);
      try {
        const response = await apiService.getPendingInvitations();
        setInvitations(response.data);
      } catch (error) {
        console.error('Error fetching invitations:', error);
      } finally {
        setLoadingInvitations(false);
      }
    };

    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const res = await apiService.getLeaderboard() as any;
        console.log('Leaderboard API response:', res.data);
        setLeaderboard(Array.isArray(res.data.leaderboard) ? res.data.leaderboard : []);
        setYourRank(res.data.user_rank);
        setYourPoints(res.data.user_points);
      } catch (error) {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    const fetchUserPoints = async () => {
      setLoadingUserPoints(true);
      try {
        const res = await apiService.getUserPoints() as any;
        setUserPoints(res.data.total_points);
      } catch (error) {
        toast.error('Failed to load your points');
      } finally {
        setLoadingUserPoints(false);
      }
    };

    fetchStats();
    fetchUserProgress();
    fetchInvitations();
    fetchLeaderboard();
    fetchUserPoints();
  }, []);

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await apiService.acceptInvitation(invitationId);
      toast.success('Invitation accepted!');
      // Remove the accepted invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to accept invitation';
      toast.error(message);
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      await apiService.declineInvitation(invitationId);
      toast.success('Invitation declined');
      // Remove the declined invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to decline invitation';
      toast.error(message);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  const statCards = [
    {
      title: 'Notebooks',
      value: stats.notebooks,
      icon: BookOpen,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Notes',
      value: stats.notes,
      icon: FileText,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Flashcards',
      value: stats.flashcards,
      icon: CreditCard,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Quizzes',
      value: stats.quizzes,
      icon: Brain,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
  ];

  const quickActions = [
    {
      title: 'Create Notebook',
      description: 'Organize your notes',
      icon: BookOpen,
      href: '/notebooks',
      color: 'from-primary-400 to-primary-600',
    },
    {
      title: 'Add Note',
      description: 'Capture your thoughts',
      icon: FileText,
      href: '/notes',
      color: 'from-success-400 to-success-600',
    },
    {
      title: 'Study Flashcards',
      description: 'AI-generated from notes',
      icon: CreditCard,
      href: '/flashcards',
      color: 'from-warning-400 to-warning-600',
    },
    {
      title: 'Generate Quiz',
      description: 'Test your knowledge',
      icon: Brain,
      href: '/quizzes',
      color: 'from-secondary-400 to-secondary-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Debug: log leaderboard before rendering
  console.log('Leaderboard:', leaderboard);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your studies today.
            </p>
            {/* User Progress Summary - visually appealing */}
            <div className="mt-6">
              <div className="card p-6 max-w-4xl min-h-[320px] shadow-xl bg-gradient-to-br from-primary-50 to-white border border-primary-200 flex flex-col justify-center items-center">
                <h2 className="text-xl font-bold text-primary-700 mb-4 flex items-center gap-2">
                  <CheckCircle className="text-success-500" size={22} /> Your Progress Summary
                </h2>
                {loadingProgress ? (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div className="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <span>Loading progress...</span>
                  </div>
                ) : userProgress ? (
                  <div className="flex flex-col items-center w-full">
                    {/* Donut Chart for Attempts */}
                    <div className="w-96 h-96 flex flex-col items-center justify-center mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Quiz Attempts', value: userProgress.total_quiz_attempts },
                              { name: 'Flashcard Sets', value: Math.floor(userProgress.total_flashcard_attempts / 5) },
                            ]}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="48%"
                            innerRadius={60}
                            outerRadius={90}
                            fill="#8884d8"
                            label={({ percent }) => `${(percent ? percent * 100 : 0).toFixed(2)}%`}
                            labelLine={false}
                          >
                            <Cell key="quiz" fill="#6366f1" />
                            <Cell key="flashcard" fill="#f59e42" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex gap-8 mt-4 text-base">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block"></span>Quiz Attempts</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>Flashcard Sets</span>
                      </div>
                    </div>
                    {/* Stats Row */}
                    <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-stretch mt-6">
                      {/* Average Quiz Score */}
                      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center">
                        <Brain className="text-secondary-500 mb-1" size={28} />
                        <span className="font-semibold text-lg text-gray-700 mb-1">Average Quiz Score</span>
                        <span className="font-bold text-2xl text-primary-600 mb-1">{Number(userProgress.average_quiz_score).toFixed(2)}%</span>
                        <div className="w-full h-3 bg-primary-100 rounded-full overflow-hidden">
                          <div className="h-3 bg-primary-500 rounded-full transition-all duration-700" style={{ width: `${userProgress.average_quiz_score}%` }}></div>
                        </div>
                      </div>
                      {/* Flashcard Accuracy */}
                      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center">
                        <CreditCard className="text-warning-500 mb-1" size={28} />
                        <span className="font-semibold text-lg text-gray-700 mb-1">Flashcard Accuracy</span>
                        <span className="font-bold text-2xl text-warning-600 mb-1">{Number(userProgress.flashcard_accuracy).toFixed(2)}%</span>
                        <div className="w-full h-3 bg-warning-100 rounded-full overflow-hidden">
                          <div className="h-3 bg-warning-500 rounded-full transition-all duration-700" style={{ width: `${userProgress.flashcard_accuracy}%` }}></div>
                        </div>
                      </div>
                      {/* Current Streak */}
                      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col items-center">
                        <Flame className="text-red-500 mb-1" size={28} />
                        <span className="font-semibold text-lg text-gray-700 mb-1">Current Streak</span>
                        <span className="font-bold text-2xl text-red-600 mb-1">{userProgress.current_streak_days} day{userProgress.current_streak_days !== 1 ? 's' : ''}</span>
                        <div className="w-full h-3 bg-red-100 rounded-full overflow-hidden">
                          <div className="h-3 bg-red-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(userProgress.current_streak_days * 10, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">No progress data available.</span>
                )}
              </div>
            </div>
            </div>
           {/* Leaderboard */}
           <div className="mt-6">
             <div className="p-8 max-w-3xl mx-auto rounded-3xl shadow-2xl bg-gradient-to-br from-yellow-50 via-white to-primary-100 border-2 border-yellow-200">
               <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2">
                 <Trophy className="text-yellow-400" size={28} /> Leaderboard
               </h2>
               {loadingLeaderboard ? (
                 <div className="flex items-center space-x-2 text-gray-600">
                   <div className="w-6 h-6 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                   <span>Loading leaderboard...</span>
                 </div>
               ) : Array.isArray(leaderboard) && leaderboard.length > 0 ? (
                 <div className="overflow-x-auto">
                   <table className="min-w-full text-lg rounded-xl">
                     <thead>
                       <tr className="bg-primary-100 text-primary-700">
                         <th className="px-6 py-3 text-left">Rank</th>
                         <th className="px-6 py-3 text-left">User</th>
                         <th className="px-6 py-3 text-left">Points</th>
                       </tr>
                     </thead>
                     <tbody>
                       {leaderboard.map((user, idx) => {
                         const isTop = idx === 0;
                         const isCurrent = yourRank === idx + 1;
                         return (
                           <tr
                             key={user.user_id}
                             className={`transition-all ${isCurrent ? 'bg-primary-200/60 font-bold text-primary-900' : 'hover:bg-primary-50'} ${isTop ? 'text-yellow-600' : ''}`}
                           >
                             <td className="px-6 py-3 font-bold flex items-center gap-2">
                               {isTop && <Trophy className="inline text-yellow-400" size={22} />} {idx + 1}
                             </td>
                             <td className="px-6 py-3">{user.username}</td>
                             <td className="px-6 py-3 font-bold">{user.total_points}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               ) : (
                 <span className="text-gray-400">No leaderboard data available.</span>
               )}
               {yourRank !== null && yourPoints !== null && (
                 <div className="mt-4 text-lg text-primary-800 flex items-center gap-4 justify-center">
                   <span className="px-4 py-2 rounded-full bg-primary-100 font-bold shadow">Your Rank: {yourRank}</span>
                   <span className="px-4 py-2 rounded-full bg-yellow-100 font-bold shadow">Your Points: {yourPoints}</span>
                 </div>
               )}
             </div>
           </div>
          </div>

          {/* Invitation Notifications */}
          {invitations.length > 0 && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Bell size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {loadingInvitations && (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="bg-white rounded border border-blue-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Users size={14} className="text-blue-500 flex-shrink-0" />
                            <h3 className="font-medium text-gray-900 text-sm truncate">{invitation.group.name}</h3>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>by {invitation.invited_by.first_name || invitation.invited_by.username}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(invitation.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            className="px-2 py-1 bg-gray-500 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-primary-700 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className={
                      `group card p-6 rounded-2xl shadow-xl bg-gradient-to-br ${action.color} text-white flex flex-col items-start justify-between transition-transform duration-200 hover:scale-105 hover:shadow-2xl border-2 border-white/30`
                    }
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-white/20 shadow-lg">
                        <Icon size={28} className="text-white drop-shadow" />
                      </div>
                      <h3 className="text-lg font-bold tracking-wide drop-shadow">{action.title}</h3>
                    </div>
                    <p className="text-base font-medium opacity-90 mb-2 drop-shadow">{action.description}</p>
                    <span className="mt-auto text-sm font-semibold underline underline-offset-4 opacity-80 group-hover:opacity-100">Go</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {(Array.isArray(statCards) ? statCards : []).map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`rounded-2xl shadow-xl bg-gradient-to-br ${stat.bgColor} flex flex-col items-center justify-center p-8 border-2 border-white/30 transition-transform duration-200 hover:scale-105 hover:shadow-2xl`}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-4 rounded-xl bg-white/30 shadow-lg">
                      <Icon size={32} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-primary-900 mb-1">{stat.value}</p>
                  <p className="text-base font-semibold text-gray-800 mb-1">{stat.title}</p>
                </div>
              );
            })}
          </div>

          {/* Study Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="card rounded-2xl shadow-xl bg-gradient-to-br from-primary-50 via-white to-primary-100 border border-primary-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Clock size={20} className="text-gray-400" />
              </div>
              <div className="space-y-4">
                {/* Placeholder for last 2 recent actions. Replace with real activity data if available. */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Completed a quiz</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Reviewed 5 flashcards</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Tips */}
            <div className="card rounded-2xl shadow-xl bg-gradient-to-br from-secondary-50 via-white to-secondary-100 border border-secondary-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Study Tips</h3>
                <Target size={20} className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary-600">1</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Create notebooks to organize related topics together
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-success-600">2</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Use flashcards to memorize key concepts
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-warning-600">3</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Generate quizzes to test your understanding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
};

export default Dashboard; 