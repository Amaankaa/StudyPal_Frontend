import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Flashcard, Note } from '../../services/api';
import {
  CreditCard,
  Search,
  Edit3,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  BookOpen,
  Brain,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Flashcards: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notesRes] = await Promise.all([
        apiService.getNotes(),
      ]);
      setNotes(notesRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load notes');
      setLoading(false);
    }
  };

  const fetchFlashcardsForNote = async (noteId: number) => {
    try {
      const response = await apiService.getFlashcardsForNote(noteId);
      setFlashcards(response.data.flashcards);
      setSelectedNote(noteId);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to load flashcards';
      toast.error(message);
    }
  };

  const handleDeleteFlashcard = async (flashcard: Flashcard) => {
    if (!window.confirm(`Are you sure you want to delete this flashcard?`)) {
      return;
    }

    try {
      await apiService.deleteFlashcard(flashcard.id);
      toast.success('Flashcard deleted successfully');
      if (selectedNote) {
        fetchFlashcardsForNote(selectedNote);
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to delete flashcard';
      toast.error(message);
    }
  };

  const startStudyMode = () => {
    if (filteredFlashcards.length === 0) {
      toast.error('No flashcards to study');
      return;
    }
    setStudyMode(true);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const exitStudyMode = () => {
    setStudyMode(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
  };

  const nextCard = () => {
    if (currentCardIndex < filteredFlashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setShowAnswer(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleGenerateFlashcards = async (noteId: number) => {
    if (generatingFlashcards === noteId) return; // Prevent multiple clicks
    
    setGeneratingFlashcards(noteId);
    try {
      await apiService.generateFlashcards(noteId);
      toast.success('Flashcards generated successfully!');
      fetchFlashcardsForNote(noteId);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to generate flashcards';
      toast.error(message);
    } finally {
      setGeneratingFlashcards(null);
    }
  };

  const filteredFlashcards = flashcards.filter(flashcard =>
    flashcard.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flashcard.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentCard = filteredFlashcards[currentCardIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (studyMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Study Mode Header */}
        <div className="p-6 max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study Mode</h1>
              <p className="text-gray-600 mt-2">
                Card {currentCardIndex + 1} of {filteredFlashcards.length}
              </p>
            </div>
            <button
              onClick={exitStudyMode}
              className="btn-secondary flex items-center space-x-2"
            >
              <Pause size={20} />
              <span>Exit Study Mode</span>
            </button>
          </div>
        </div>
        {/* Center the card */}
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-2xl w-full">
            <div className="card">
              <div className="relative h-96" style={{ perspective: '1000px' }}>
                <div
                  className="absolute inset-0 transition-transform duration-500"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front of card */}
                  <div 
                    className="absolute inset-0"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="h-full flex flex-col justify-center items-center p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6">
                        <CreditCard size={32} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {currentCard?.question}
                      </h2>
                      <button
                        onClick={flipCard}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <RotateCcw size={20} />
                        <span>Flip Card</span>
                      </button>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="h-full flex flex-col justify-center items-center p-8 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-success-500 to-warning-500 rounded-full flex items-center justify-center mb-6">
                        <Eye size={32} className="text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {currentCard?.answer}
                      </h2>
                      <button
                        onClick={flipCard}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <RotateCcw size={20} />
                        <span>Flip Back</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={prevCard}
                  disabled={currentCardIndex === 0}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                  <span>Previous</span>
                </button>
                <span className="text-gray-600">
                  {currentCardIndex + 1} / {filteredFlashcards.length}
                </span>
                <button
                  onClick={nextCard}
                  disabled={currentCardIndex === filteredFlashcards.length - 1}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
              <p className="text-gray-600 mt-2">
                Study AI-generated flashcards from your notes
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              {flashcards.length > 0 && (
                <button
                  onClick={startStudyMode}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Play size={20} />
                  <span>Study Mode</span>
                </button>
              )}
            </div>
          </div>

          {/* Note Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Note</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <div key={note.id} className="card hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => fetchFlashcardsForNote(note.id)}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                      <BookOpen size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{note.title}</h3>
                      <p className="text-sm text-gray-600">{note.notebook_title}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateFlashcards(note.id);
                        }}
                        disabled={generatingFlashcards === note.id}
                        className="p-2 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generate Flashcards"
                      >
                        {generatingFlashcards === note.id ? (
                          <div className="w-4 h-4 border-2 border-warning-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Brain size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flashcards Display */}
          {selectedNote && flashcards.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Flashcards</h2>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search flashcards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Flashcards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFlashcards.map((flashcard) => (
                  <div key={flashcard.id} className="card group hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-warning-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <CreditCard size={24} className="text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteFlashcard(flashcard)}
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Question
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {flashcard.question}
                      </p>
                      <h4 className="text-md font-semibold text-gray-900 mb-2">
                        Answer
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {flashcard.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedNote && flashcards.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards yet</h3>
              <p className="text-gray-600 mb-6">
                Generate flashcards from your notes to get started
              </p>
            </div>
          )}
        </div>
      </div>
    );
};

export default Flashcards; 