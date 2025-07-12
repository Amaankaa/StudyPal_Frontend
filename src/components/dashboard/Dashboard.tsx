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
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  notebooks: number;
  notes: number;
  flashcards: number;
  quizzes: number;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [notebooksRes, notesRes, quizzesRes] = await Promise.all([
          apiService.getNotebooks(),
          apiService.getNotes(),
          apiService.getQuizzes(),
        ]);

        setStats({
          notebooks: notebooksRes.data.length,
          notes: notesRes.data.length,
          flashcards: 0, // Flashcards are now AI-generated per note
          quizzes: quizzesRes.data.length,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Create Notebook',
      description: 'Organize your notes',
      icon: BookOpen,
      href: '/notebooks',
      color: 'bg-primary-500',
    },
    {
      title: 'Add Note',
      description: 'Capture your thoughts',
      icon: FileText,
      href: '/notes',
      color: 'bg-success-500',
    },
    {
      title: 'Study Flashcards',
      description: 'AI-generated from notes',
      icon: CreditCard,
      href: '/flashcards',
      color: 'bg-warning-500',
    },
    {
      title: 'Generate Quiz',
      description: 'Test your knowledge',
      icon: Brain,
      href: '/quizzes',
      color: 'bg-secondary-500',
    },
  ];

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
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.href}
                    className="card hover:shadow-md transition-shadow duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Study Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Clock size={20} className="text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Dashboard loaded</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Welcome to StudyPal</p>
                    <p className="text-xs text-gray-500">Start organizing your studies</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Tips */}
            <div className="card">
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
      </div>
    );
};

export default Dashboard; 