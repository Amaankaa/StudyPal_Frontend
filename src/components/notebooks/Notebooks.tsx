import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Notebook } from '../../services/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  FileText,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Notebooks: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [formData, setFormData] = useState({ title: '' });

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const response = await apiService.getNotebooks();
      setNotebooks(response.data);
    } catch (error) {
      toast.error('Failed to load notebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a notebook title');
      return;
    }

    try {
      await apiService.createNotebook({ title: formData.title.trim() });
      toast.success('Notebook created successfully');
      setShowCreateModal(false);
      setFormData({ title: '' });
      fetchNotebooks();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create notebook';
      toast.error(message);
    }
  };

  const handleUpdateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotebook || !formData.title.trim()) {
      toast.error('Please enter a notebook title');
      return;
    }

    try {
      await apiService.updateNotebook(editingNotebook.id, { title: formData.title.trim() });
      toast.success('Notebook updated successfully');
      setEditingNotebook(null);
      setFormData({ title: '' });
      fetchNotebooks();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update notebook';
      toast.error(message);
    }
  };

  const handleDeleteNotebook = async (notebook: Notebook) => {
    if (!window.confirm(`Are you sure you want to delete "${notebook.title}"?`)) {
      return;
    }

    try {
      await apiService.deleteNotebook(notebook.id);
      toast.success('Notebook deleted successfully');
      fetchNotebooks();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to delete notebook';
      toast.error(message);
    }
  };

  const handleEdit = (notebook: Notebook) => {
    setEditingNotebook(notebook);
    setFormData({ title: notebook.title });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingNotebook(null);
    setFormData({ title: '' });
  };

  const filteredNotebooks = notebooks.filter(notebook =>
    notebook.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notebooks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notebooks</h1>
              <p className="text-gray-600 mt-2">
                Organize your notes into notebooks for better study management
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            >
              <Plus size={20} />
              <span>Create Notebook</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search notebooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Notebooks Grid */}
          {filteredNotebooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No notebooks found' : 'No notebooks yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first notebook to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus size={20} />
                  <span>Create Notebook</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredNotebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="rounded-2xl shadow-xl bg-gradient-to-br from-primary-100 via-white to-secondary-100 border-2 border-primary-200 flex flex-col p-6 transition-transform duration-200 hover:scale-105 hover:shadow-2xl group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen size={28} className="text-white" />
                    </div>
                    <div className="relative">
                      <button className="p-2 hover:bg-primary-50 rounded-xl transition-colors duration-200">
                        <MoreVertical size={18} className="text-primary-400" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-primary-900 mb-2 line-clamp-2">
                    {notebook.title}
                  </h3>

                  <div className="flex items-center text-sm text-primary-600 mb-4">
                    <Calendar size={18} className="mr-2" />
                    {formatDate(notebook.created_at)}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center text-base text-primary-700 font-semibold">
                      <FileText size={18} className="mr-1" />
                      <span>{notebook.note_count} note{notebook.note_count === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(notebook)}
                        className="p-2 text-primary-400 hover:text-primary-700 hover:bg-primary-100 rounded-xl transition-colors duration-200"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteNotebook(notebook)}
                        className="p-2 text-danger-400 hover:text-danger-700 hover:bg-danger-100 rounded-xl transition-colors duration-200"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Create/Edit Modal */}
      {(showCreateModal || editingNotebook) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingNotebook ? 'Edit Notebook' : 'Create Notebook'}
            </h2>
            <form onSubmit={editingNotebook ? handleUpdateNotebook : handleCreateNotebook}>
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Notebook Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ title: e.target.value })}
                  className="input-field"
                  placeholder="Enter notebook title"
                  autoFocus
                />
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingNotebook ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
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
  );
};

export default Notebooks; 