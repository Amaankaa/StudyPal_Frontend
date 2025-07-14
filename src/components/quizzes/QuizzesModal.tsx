import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { XCircle, Play, Trash2, ChevronLeft, ChevronRight, Trophy, CheckCircle, Target } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuizzesModalProps {
  noteId: number;
  onClose: () => void;
}

const QuizzesModal: React.FC<QuizzesModalProps> = ({ noteId, onClose }) => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line
  }, [noteId]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await apiService.getQuizzesForNote(noteId);
      setQuizzes(res.data.quizzes || []);
    } catch (error) {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(''));
    setShowResults(false);
    setScore(0);
  };

  const exitQuiz = () => {
    setSelectedQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setScore(0);
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (selectedQuiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = () => {
    if (!selectedQuiz) return;
    let correctAnswers = 0;
    selectedQuiz.questions.forEach((question: any, index: number) => {
      const selectedAnswer = selectedAnswers[index];
      const correctAnswer = question.correct;
      const selectedLetter = selectedAnswer ? selectedAnswer.trim().charAt(0).toUpperCase() : '';
      const correctLetter = correctAnswer ? correctAnswer.trim().charAt(0).toUpperCase() : '';
      if (selectedLetter === correctLetter) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / selectedQuiz.questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await apiService.deleteQuiz(quizId);
      toast.success('Quiz deleted successfully');
      fetchQuizzes();
      if (selectedQuiz && selectedQuiz.quiz_id === quizId) exitQuiz();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  // Modal UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-danger-600">
          <XCircle size={28} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quizzes for this Note</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : selectedQuiz ? (
          // Quiz Taking UI
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quiz #{selectedQuiz.quiz_id}</h3>
                <p className="text-gray-600">Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</p>
              </div>
              <button onClick={exitQuiz} className="btn-secondary flex items-center space-x-2">
                <XCircle size={20} />
                <span>Exit Quiz</span>
              </button>
            </div>
            {!showResults ? (
              <div className="card mb-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {selectedQuiz.questions[currentQuestionIndex]?.question}
                  </h4>
                  <div className="space-y-3">
                    {selectedQuiz.questions[currentQuestionIndex]?.options.map((option: string, idx: number) => {
                      const letter = String.fromCharCode(65 + idx); // A, B, C, D, ...
                      const displayOption = option.trim().startsWith(`${letter}.`) ? option : `${letter}. ${option}`;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerSelect(displayOption)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors duration-200 ${
                            selectedAnswers[currentQuestionIndex] === displayOption
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="font-medium">{displayOption}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                    <span>Previous</span>
                  </button>
                  <span className="text-gray-600">
                    {currentQuestionIndex + 1} / {selectedQuiz.questions.length}
                  </span>
                  {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
                    <button onClick={submitQuiz} className="btn-primary flex items-center space-x-2">
                      <Trophy size={20} />
                      <span>Submit Quiz</span>
                    </button>
                  ) : (
                    <button onClick={nextQuestion} className="btn-primary flex items-center space-x-2">
                      <span>Next</span>
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              // Results UI
              <div className="card text-center mb-6">
                <div className="mb-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    score >= 70 ? 'bg-success-100' : 'bg-warning-100'
                  }`}>
                    {score >= 70 ? (
                      <Trophy size={40} className="text-success-600" />
                    ) : (
                      <Target size={40} className="text-warning-600" />
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Quiz Complete!</h4>
                  <p className="text-gray-600 mb-4">
                    Your score: <span className="font-bold text-primary-600">{score}%</span>
                  </p>
                  <div className={`text-lg font-semibold ${
                    score >= 70 ? 'text-success-600' : 'text-warning-600'
                  }`}>
                    {score >= 70 ? 'Great job!' : 'Keep practicing!'}
                  </div>
                </div>
                <div className="space-y-4">
                  {selectedQuiz.questions.map((question: any, idx: number) => (
                    <div key={idx} className="text-left p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">
                        {idx + 1}. {question.question}
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option: string, optionIdx: number) => {
                          const letter = String.fromCharCode(65 + optionIdx);
                          const displayOption = option.trim().startsWith(`${letter}.`) ? option : `${letter}. ${option}`;
                          const selectedLetter = selectedAnswers[idx] ? selectedAnswers[idx].trim().charAt(0).toUpperCase() : '';
                          const correctLetter = question.correct ? question.correct.trim().charAt(0).toUpperCase() : '';
                          const optionLetter = displayOption.trim().charAt(0).toUpperCase();
                          const isCorrect = optionLetter === correctLetter;
                          const isSelected = selectedLetter === optionLetter;
                          const isWrongSelection = isSelected && !isCorrect;
                          return (
                            <div key={optionIdx} className="flex items-center space-x-2">
                              {isCorrect ? (
                                <CheckCircle size={16} className="text-success-600" />
                              ) : isWrongSelection ? (
                                <XCircle size={16} className="text-danger-600" />
                              ) : (
                                <div className="w-4 h-4"></div>
                              )}
                              <span className={`$ {
                                isCorrect
                                  ? 'text-success-600 font-medium'
                                  : isWrongSelection
                                  ? 'text-danger-600 line-through'
                                  : 'text-gray-600'
                              }`}>
                                {displayOption}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-4 mt-6">
                  <button onClick={exitQuiz} className="btn-primary">
                    Back to Quizzes
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Quiz List UI
          <div>
            {quizzes.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found for this note</h3>
                <p className="text-gray-600 mb-6">Generate a quiz to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="card flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-gray-900">Quiz #{quiz.quiz_id}</div>
                      <div className="text-sm text-gray-500">Created {quiz.created_at ? new Date(quiz.created_at).toLocaleString() : ''}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startQuiz(quiz)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Play size={16} />
                        <span>Take Quiz</span>
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.quiz_id)}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizzesModal; 