import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Note, Notebook } from '../../services/api';
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Calendar,
  BookOpen,
  Brain,
  Save,
  X,
  CreditCard,
  List,
} from 'lucide-react';
import toast from 'react-hot-toast';
import QuizzesModal from '../quizzes/QuizzesModal';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    notebook: '',
  });
  const [generatingQuiz, setGeneratingQuiz] = useState<number | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<number | null>(null);
  const [showQuizzesModal, setShowQuizzesModal] = useState(false);
  const [selectedNoteForQuizzes, setSelectedNoteForQuizzes] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes, notebooksRes] = await Promise.all([
        apiService.getNotes(),
        apiService.getNotebooks(),
      ]);
      setNotes(notesRes.data);
      setNotebooks(notebooksRes.data);
    } catch (error) {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.notebook) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await apiService.createNote({
        notebook: parseInt(formData.notebook),
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      toast.success('Note created successfully');
      setShowCreateModal(false);
      setFormData({ title: '', content: '', notebook: '' });
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create note';
      toast.error(message);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await apiService.updateNote(editingNote.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      toast.success('Note updated successfully');
      setEditingNote(null);
      setFormData({ title: '', content: '', notebook: '' });
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to update note';
      toast.error(message);
    }
  };

  const handleDeleteNote = async (note: Note) => {
    if (!window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      return;
    }

    try {
      await apiService.deleteNote(note.id);
      toast.success('Note deleted successfully');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to delete note';
      toast.error(message);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      notebook: note.notebook.toString(),
    });
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', notebook: '' });
  };

  const handleGenerateQuiz = async (noteId: number) => {
    if (generatingQuiz === noteId) return; // Prevent multiple clicks
    
    setGeneratingQuiz(noteId);
    try {
      await apiService.generateQuiz(noteId);
      toast.success('Quiz generated successfully!');
    } catch (error: any) {
      const status = error.response?.status;
      let message = 'Failed to generate quiz';
      
      if (status === 429) {
        message = 'AI quota exceeded. Please try again tomorrow or upgrade your plan.';
      } else if (status === 503) {
        message = 'AI service temporarily unavailable. Please try again later.';
      } else {
        message = error.response?.data?.detail || 'Failed to generate quiz';
      }
      
      toast.error(message);
    } finally {
      setGeneratingQuiz(null);
    }
  };

  const handleGenerateFlashcards = async (noteId: number) => {
    if (generatingFlashcards === noteId) return; // Prevent multiple clicks
    
    setGeneratingFlashcards(noteId);
    try {
      await apiService.generateFlashcards(noteId);
      toast.success('Flashcards generated successfully!');
    } catch (error: any) {
      const status = error.response?.status;
      let message = 'Failed to generate flashcards';
      
      if (status === 429) {
        message = 'AI quota exceeded. Please try again tomorrow or upgrade your plan.';
      } else if (status === 503) {
        message = 'AI service temporarily unavailable. Please try again later.';
      } else {
        message = error.response?.data?.detail || 'Failed to generate flashcards';
      }
      
      toast.error(message);
    } finally {
      setGeneratingFlashcards(null);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
              <p className="text-gray-600 mt-2">
                Capture and organize your study notes with rich content
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
            >
              <Plus size={20} />
              <span>Create Note</span>
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
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No notes found' : 'No notes yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first note to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus size={20} />
                  <span>Create Note</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="card group hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-primary-500 rounded-lg flex items-center justify-center">
                      <FileText size={24} className="text-white" />
                    </div>
                  </div>
                  <div
                    className="mb-4 flex-1 cursor-pointer"
                    onClick={() => setSelectedNote(note)}
                    title="Click to view full note"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {truncateText(note.content)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <BookOpen size={16} className="mr-1" />
                      <span>{note.notebook_title}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleGenerateQuiz(note.id)}
                      disabled={generatingQuiz === note.id}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate Quiz"
                    >
                      {generatingQuiz === note.id ? (
                        <div className="w-4 h-4 border-2 border-secondary-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Brain size={16} />
                      )}
                      <span className="text-xs font-medium">Quiz</span>
                    </button>
                    <button
                      onClick={() => handleGenerateFlashcards(note.id)}
                      disabled={generatingFlashcards === note.id}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate Flashcards"
                    >
                      {generatingFlashcards === note.id ? (
                        <div className="w-4 h-4 border-2 border-warning-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <CreditCard size={16} />
                      )}
                      <span className="text-xs font-medium">Flashcards</span>
                    </button>
                    <button
                      onClick={() => handleEdit(note)}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                    >
                      <Edit3 size={16} />
                      <span className="text-xs font-medium">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note)}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                      <span className="text-xs font-medium">Delete</span>
                    </button>
                    <button
                      onClick={() => { setSelectedNoteForQuizzes(note.id); setShowQuizzesModal(true); }}
                      className="flex items-center space-x-1 px-3 py-2 text-gray-400 hover:text-info-600 hover:bg-info-50 rounded-lg transition-colors duration-200"
                      title="View Quizzes"
                    >
                      <List size={16} />
                      <span className="text-xs font-medium">Quizzes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Create/Edit Modal */}
      {(showCreateModal || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingNote ? 'Edit Note' : 'Create Note'}
            </h2>
            <form onSubmit={editingNote ? handleUpdateNote : handleCreateNote}>
              {!editingNote && (
                <div className="mb-4">
                  <label htmlFor="notebook" className="block text-sm font-medium text-gray-700 mb-2">
                    Notebook
                  </label>
                  <select
                    id="notebook"
                    value={formData.notebook}
                    onChange={(e) => setFormData({ ...formData, notebook: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a notebook</option>
                    {notebooks.map((notebook) => (
                      <option key={notebook.id} value={notebook.id}>
                        {notebook.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter note title"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input-field min-h-[200px] resize-y"
                  placeholder="Write your note content here..."
                  required
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>{editingNote ? 'Update' : 'Create'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showQuizzesModal && selectedNoteForQuizzes !== null && (
        <QuizzesModal
          noteId={selectedNoteForQuizzes}
          onClose={() => { setShowQuizzesModal(false); setSelectedNoteForQuizzes(null); }}
        />
      )}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedNote(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedNote.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                <div className="flex items-center">
                  <BookOpen size={16} className="mr-1" />
                  <span>{selectedNote.notebook_title}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>{formatDate(selectedNote.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="prose max-w-none text-gray-900 whitespace-pre-line">
              {selectedNote.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes; 