import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import QuizzesModal from './QuizzesModal'; // This will be handled by renaming if needed
import { BookOpen, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizStat {
  quiz_id: number;
  attempts: number;
  average_score: number;
  best_score: number;
  last_score: number;
}

const QuizzesPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [quizCounts, setQuizCounts] = useState<{ [noteId: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [showQuizzesModal, setShowQuizzesModal] = useState(false);
  const [selectedNoteForQuizzes, setSelectedNoteForQuizzes] = useState<number | null>(null);
  const [quizStats, setQuizStats] = useState<{ [quizId: number]: QuizStat }>({});
  const [loadingStats, setLoadingStats] = useState<{ [quizId: number]: boolean }>({});

  useEffect(() => {
    fetchNotesAndQuizCounts();
  }, []);

  useEffect(() => {
    if (
      showQuizzesModal &&
      selectedNoteForQuizzes !== null &&
      quizCounts[selectedNoteForQuizzes] === 0
    ) {
      setShowQuizzesModal(false);
      setSelectedNoteForQuizzes(null);
    }
  }, [quizCounts, selectedNoteForQuizzes, showQuizzesModal]);

  const fetchNotesAndQuizCounts = async () => {
    setLoading(true);
    try {
      const notesRes = await apiService.getNotes();
      setNotes(notesRes.data);
      // For each note, fetch quiz count and quiz stats
      const counts: { [noteId: number]: number } = {};
      const stats: { [quizId: number]: QuizStat } = {};
      const loading: { [quizId: number]: boolean } = {};
      await Promise.all(notesRes.data.map(async (note: any) => {
        try {
          const res = await apiService.getQuizzesForNote(note.id);
          counts[note.id] = res.data.quizzes ? res.data.quizzes.length : 0;
          // For each quiz, fetch stats
          if (res.data.quizzes) {
            for (const quiz of res.data.quizzes) {
              loading[quiz.quiz_id] = true;
              try {
                const statRes = await apiService.getQuizStats(quiz.quiz_id);
                stats[quiz.quiz_id] = { quiz_id: quiz.quiz_id, ...statRes.data };
              } catch (err) {
                // If stats not found, skip
              } finally {
                loading[quiz.quiz_id] = false;
              }
            }
          }
        } catch {
          counts[note.id] = 0;
        }
      }));
      setQuizStats(stats);
      setLoadingStats(loading);
      setQuizCounts(counts);
    } catch (error) {
      toast.error('Failed to load notes or quizzes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Quizzes Overview</h1>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.filter(note => (quizCounts[note.id] || 0) > 0).map((note) => (
              <div
                key={note.id}
                className="card group hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
                onClick={() => { setSelectedNoteForQuizzes(note.id); setShowQuizzesModal(true); }}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                    <BookOpen size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{note.title}</h3>
                    <p className="text-sm text-gray-600">{note.notebook_title}</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center space-x-2 mt-2">
                    <Brain size={18} className="text-primary-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      {quizCounts[note.id] || 0} quizzes generated
                    </span>
                  </div>
                  {/* Quiz Stats for each quiz under this note */}
                  {quizCounts[note.id] > 0 && (
                    <div className="mt-4">
                      <h5 className="text-xs font-semibold text-gray-700 mb-1">Quiz Stats:</h5>
                      {Object.values(quizStats).filter(stat => stat.quiz_id && note.quizzes?.some((q: any) => q.quiz_id === stat.quiz_id)).length === 0 ? (
                        <span className="text-xs text-gray-400">No stats</span>
                      ) : (
                        <div className="space-y-2">
                          {Object.values(quizStats)
                            .filter(stat => stat.quiz_id && note.quizzes?.some((q: any) => q.quiz_id === stat.quiz_id))
                            .map(stat => (
                              <div key={stat.quiz_id} className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                {loadingStats[stat.quiz_id] ? (
                                  <span>Loading...</span>
                                ) : (
                                  <>
                                    <div>Quiz ID: {stat.quiz_id}</div>
                                    <div>Attempts: {stat.attempts}</div>
                                    <div>Average Score: {stat.average_score}</div>
                                    <div>Best Score: {stat.best_score}</div>
                                    <div>Last Score: {stat.last_score}</div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {showQuizzesModal && selectedNoteForQuizzes !== null && (
          <QuizzesModal
            noteId={selectedNoteForQuizzes}
            onClose={() => { setShowQuizzesModal(false); setSelectedNoteForQuizzes(null); }}
            onQuizzesChanged={fetchNotesAndQuizCounts}
          />
        )}
      </div>
    </div>
  );
};

export default QuizzesPage;