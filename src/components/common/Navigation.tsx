import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpen,
  FileText,
  CreditCard,
  Brain,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Notebooks', href: '/notebooks', icon: BookOpen },
    { name: 'Notes', href: '/notes', icon: FileText },
    { name: 'Flashcards', href: '/flashcards', icon: CreditCard },
    { name: 'Quizzes', href: '/quizzes', icon: Brain },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white shadow-lg border border-gray-200"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-gradient-to-br from-primary-100/80 via-white/80 to-secondary-100/80 backdrop-blur-xl shadow-2xl border-r-4 border-primary-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } rounded-tr-3xl rounded-br-3xl`}
      >
        <div className="flex flex-col h-full max-h-screen justify-between">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-primary-200 bg-white/60 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
                <BookOpen size={28} className="text-white drop-shadow-lg" />
              </div>
              <span className="text-2xl font-extrabold text-primary-700 tracking-wide drop-shadow">StudyPal</span>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-8 border-b border-primary-200 bg-white/60">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-white font-bold text-lg">
                  {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-primary-800 truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.username}
                </p>
                <p className="text-xs text-primary-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-4 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 shadow-sm group ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-primary-200/80 to-secondary-100/80 text-primary-900 border-l-4 border-primary-500 shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-800 hover:scale-105'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={22} className="drop-shadow" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-6 py-8 border-t border-primary-200 bg-white/60 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-4 w-full px-4 py-3 rounded-xl text-base font-semibold text-primary-700 bg-gradient-to-r from-primary-100 to-secondary-100 hover:from-primary-200 hover:to-secondary-200 shadow transition-all duration-200"
            >
              <LogOut size={22} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation; 