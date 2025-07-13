import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Search, ChevronDown, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface Group {
  id: number;
  name: string;
  description?: string;
  public?: boolean;
  member_count?: number;
  is_member?: boolean;
  created_by?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at?: string;
}

const Groups: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', public: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Effect to trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      searchPublicGroups(debouncedSearchTerm);
      setShowSearchDropdown(true);
    } else {
      setPublicGroups([]);
      setShowSearchDropdown(false);
    }
  }, [debouncedSearchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Use different endpoints based on user role
      const res = currentUser?.is_superuser 
        ? await apiService.getAllGroups()
        : await apiService.getGroups();
      setGroups(res.data);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const searchPublicGroups = async (term: string) => {
    setSearching(true);
    try {
      const res = await apiService.searchGroups(term.trim());
      // For superusers, show all groups. For regular users, filter to public groups only
      const filteredGroups = currentUser?.is_superuser 
        ? res.data 
        : res.data.filter((group: any) => group.public === true);
      
      // Check if user is already a member of any of these groups
      const groupsWithMembership = filteredGroups.map((group: any) => ({
        ...group,
        is_member: groups.some(userGroup => userGroup.id === group.id)
      }));
      setPublicGroups(groupsWithMembership);
    } catch (error) {
      toast.error('Failed to search groups');
      setPublicGroups([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    try {
      await apiService.createGroup({ 
        name: createForm.name.trim(), 
        description: createForm.description.trim(),
        public: createForm.public 
      });
      toast.success('Group created successfully');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', public: true });
      fetchGroups();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create group';
      toast.error(message);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await apiService.joinGroup(groupId);
      toast.success('Joined group!');
      // Update the search results to reflect the new membership
      setPublicGroups(prev => prev.map(group => 
        group.id === groupId ? { ...group, is_member: true } : group
      ));
      fetchGroups();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to join group';
      toast.error(message);
    }
  };

  const handleViewGroup = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the group "${groupName}"? This action cannot be undone and will remove all members and content.`);
    if (!confirmed) return;

    try {
      await apiService.deleteGroup(groupId);
      toast.success(`Group "${groupName}" deleted successfully!`);
      fetchGroups(); // Refresh the groups list
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Only superusers can delete groups');
      } else if (error.response?.status === 404) {
        toast.error('Group not found');
      } else {
        const message = error.response?.data?.detail || 'Failed to delete group';
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
            <p className="text-gray-600 mt-2">Collaborate and learn with others in your study groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
          >
            <Plus size={20} />
            <span>Create Group</span>
          </button>
        </div>

        {/* Search Public Groups */}
        <div className="mb-8 max-w-md relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={currentUser?.is_superuser ? "Search all groups..." : "Search public groups..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              onFocus={() => searchTerm.trim() && setShowSearchDropdown(true)}
            />
            {searching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && publicGroups.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {publicGroups.map(group => (
                <div key={group.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                        <div className="flex items-center space-x-2">
                          {currentUser?.is_superuser && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              group.public 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {group.public ? 'Public' : 'Private'}
                            </span>
                          )}
                          {group.is_member && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {group.member_count ?? 0} members
                        </span>
                        {group.is_member ? (
                          <button
                            onClick={() => handleViewGroup(group.id)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View Group
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinGroup(group.id)}
                            className="text-xs bg-primary-600 text-white px-3 py-1 rounded-full hover:bg-primary-700 transition-colors"
                            disabled={searching}
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results message */}
          {showSearchDropdown && searchTerm.trim() && !searching && publicGroups.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <p className="text-sm text-gray-500 text-center">
                {currentUser?.is_superuser ? 'No groups found' : 'No public groups found'}
              </p>
            </div>
          )}
        </div>

        {/* Groups Section */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {currentUser?.is_superuser ? 'All Groups' : 'Your Groups'}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <Users size={32} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentUser?.is_superuser ? 'No groups exist yet' : 'You are not in any groups yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {currentUser?.is_superuser 
                ? 'Create the first group to get started' 
                : 'Create or join a group to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {groups.map(group => (
              <div key={group.id} className="card group hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
                    {currentUser?.is_superuser && (
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        group.public 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.public ? 'Public' : 'Private'}
                      </span>
                    )}
                  </div>
                  {/* Superuser delete button */}
                  {currentUser?.is_superuser && (
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete group (Superuser only)"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {group.member_count ? `${group.member_count} members` : 'View group'}
                    </span>
                  </div>
                  {/* Additional info for superusers */}
                  {currentUser?.is_superuser && group.created_by && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Created by: {group.created_by.first_name} {group.created_by.last_name}</p>
                      {group.created_at && (
                        <p>Created: {new Date(group.created_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}
                  <button
                    className="btn-secondary mt-4"
                    onClick={() => handleViewGroup(group.id)}
                  >
                    View Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}



        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Group</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    id="group-name"
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="group-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    id="group-description"
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Visibility
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={createForm.public}
                        onChange={() => setCreateForm({ ...createForm, public: true })}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Public</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={!createForm.public}
                        onChange={() => setCreateForm({ ...createForm, public: false })}
                        className="mr-2 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Private</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {createForm.public 
                      ? "Public groups can be found and joined by anyone"
                      : "Private groups are only visible to invited members"
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups; 