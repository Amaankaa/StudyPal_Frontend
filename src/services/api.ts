import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Notebook {
  id: number;
  user: string;
  title: string;
  created_at: string;
  note_count: number; // Add this line
}

export interface Note {
  id: number;
  notebook: number;
  notebook_title: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Flashcard {
  id: number;
  note: number;
  note_title: string;
  question: string;
  answer: string;
}

export interface Quiz {
  id: number;
  note: number;
  note_title: string;
  created_at: string;
}

export interface Question {
  id: number;
  quiz: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
}

export interface QuizResponse {
  quiz_id: number;
  questions: QuizQuestion[];
}

// API Service Class
class ApiService {
  private api: AxiosInstance;
  private baseURL = 'http://127.0.0.1:8000/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.data.access);
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  async register(userData: { username: string; email: string; password: string }): Promise<AxiosResponse> {
    return this.api.post('/register/', userData);
  }

  async login(credentials: { username: string; password: string }): Promise<AxiosResponse<AuthTokens>> {
    const response = await this.api.post('/token/', credentials);
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response;
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<{ access: string }>> {
    return this.api.post('/token/refresh/', { refresh: refreshToken });
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Profile Methods
  async getProfile(): Promise<AxiosResponse<User>> {
    return this.api.get('/profile/');
  }

  async updateProfile(profileData: { first_name: string; last_name: string }): Promise<AxiosResponse<User>> {
    return this.api.put('/profile/', profileData);
  }

  // Notebook Methods
  async getNotebooks(): Promise<AxiosResponse<Notebook[]>> {
    return this.api.get('/notebooks/');
  }

  async createNotebook(notebookData: { title: string }): Promise<AxiosResponse<Notebook>> {
    return this.api.post('/notebooks/', notebookData);
  }

  async getNotebook(id: number): Promise<AxiosResponse<Notebook>> {
    return this.api.get(`/notebooks/${id}/`);
  }

  async updateNotebook(id: number, notebookData: { title: string }): Promise<AxiosResponse<Notebook>> {
    return this.api.put(`/notebooks/${id}/`, notebookData);
  }

  async deleteNotebook(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/notebooks/${id}/`);
  }

  // Note Methods
  async getNotes(): Promise<AxiosResponse<Note[]>> {
    return this.api.get('/notes/');
  }

  async createNote(noteData: { notebook: number; title: string; content: string }): Promise<AxiosResponse<Note>> {
    return this.api.post('/notes/', noteData);
  }

  async getNote(id: number): Promise<AxiosResponse<Note>> {
    return this.api.get(`/notes/${id}/`);
  }

  async updateNote(id: number, noteData: { title: string; content: string }): Promise<AxiosResponse<Note>> {
    return this.api.put(`/notes/${id}/`, noteData);
  }

  async deleteNote(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/notes/${id}/`);
  }

  // Flashcard Methods
  async getFlashcard(id: number): Promise<AxiosResponse<Flashcard>> {
    return this.api.get(`/flashcards/${id}/`);
  }

  async deleteFlashcard(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/flashcards/${id}/`);
  }

  async getFlashcards(): Promise<AxiosResponse<Flashcard[]>> {
    return this.api.get('/flashcards/');
  }

  // Quiz Methods
  async getQuizzes(): Promise<AxiosResponse<Quiz[]>> {
    return this.api.get('/quizzes/');
  }

  async createQuiz(quizData: { note: number }): Promise<AxiosResponse<Quiz>> {
    return this.api.post('/quizzes/', quizData);
  }

  async getQuiz(id: number): Promise<AxiosResponse<Quiz>> {
    return this.api.get(`/quizzes/${id}/`);
  }

  async updateQuiz(id: number, quizData: { note: number }): Promise<AxiosResponse<Quiz>> {
    return this.api.put(`/quizzes/${id}/`, quizData);
  }

  async deleteQuiz(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/quizzes/${id}/`);
  }

  // Question Methods
  async getQuestions(): Promise<AxiosResponse<Question[]>> {
    return this.api.get('/questions/');
  }

  async createQuestion(questionData: { quiz: number; question: string; options: string[]; correct: string }): Promise<AxiosResponse<Question>> {
    return this.api.post('/questions/', questionData);
  }

  async getQuestion(id: number): Promise<AxiosResponse<Question>> {
    return this.api.get(`/questions/${id}/`);
  }

  async updateQuestion(id: number, questionData: { question: string; options: string[]; correct: string }): Promise<AxiosResponse<Question>> {
    return this.api.put(`/questions/${id}/`, questionData);
  }

  async deleteQuestion(id: number): Promise<AxiosResponse> {
    return this.api.delete(`/questions/${id}/`);
  }

  // Special Methods
  async generateQuiz(noteId: number): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post(`/generate_quiz/${noteId}/`);
  }

  async getQuizForNote(noteId: number): Promise<AxiosResponse<QuizResponse>> {
    return this.api.get(`/get_quiz/${noteId}/`);
  }

  async generateFlashcards(noteId: number): Promise<AxiosResponse<{ message: string; flashcards: Flashcard[] }>> {
    return this.api.post(`/generate_flashcards/${noteId}/`);
  }

  async getFlashcardsForNote(noteId: number): Promise<AxiosResponse<{ note_id: number; note_title: string; flashcards: Flashcard[] }>> {
    return this.api.get(`/get_flashcards/${noteId}/`);
  }

  async getQuizzesForNote(noteId: number): Promise<AxiosResponse<{ quizzes: any[] }>> {
    return this.api.get(`/get_quizzes/${noteId}/`);
  }

  // Study Group Methods
  async createGroup(data: { name: string; description?: string; public?: boolean }): Promise<AxiosResponse> {
    return this.api.post('/groups/create/', data);
  }

  async getGroups(): Promise<AxiosResponse> {
    return this.api.get('/groups/');
  }

  async getAllGroups(): Promise<AxiosResponse> {
    return this.api.get('/groups/all/');
  }

  async getGroup(groupId: number): Promise<AxiosResponse> {
    return this.api.get(`/groups/${groupId}/`);
  }

  async joinGroup(groupId: number): Promise<AxiosResponse> {
    return this.api.post(`/groups/${groupId}/join/`);
  }

  async leaveGroup(groupId: number): Promise<AxiosResponse> {
    return this.api.post(`/groups/${groupId}/leave/`);
  }

  async inviteToGroup(groupId: number, username: string): Promise<AxiosResponse> {
    return this.api.post(`/groups/${groupId}/invite/`, { username });
  }

  async getPendingInvitations(): Promise<AxiosResponse> {
    return this.api.get('/invitations/pending/');
  }

  async acceptInvitation(invitationId: number): Promise<AxiosResponse> {
    return this.api.post(`/invitations/${invitationId}/accept/`);
  }

  async declineInvitation(invitationId: number): Promise<AxiosResponse> {
    return this.api.post(`/invitations/${invitationId}/decline/`);
  }

  async getGroupMembers(groupId: number): Promise<AxiosResponse> {
    return this.api.get(`/groups/${groupId}/members/`);
  }

  async searchGroups(query: string): Promise<AxiosResponse> {
    return this.api.get(`/groups/search/?search=${encodeURIComponent(query)}`);
  }

  // Content Sharing Methods
  async shareNote(noteId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.post(`/notes/${noteId}/share/${groupId}/`);
  }

  async shareQuiz(quizId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.post(`/quizzes/${quizId}/share/${groupId}/`);
  }

  async shareFlashcard(flashcardId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.post(`/flashcards/${flashcardId}/share/${groupId}/`);
  }

  async getSharedContent(groupId: number): Promise<AxiosResponse> {
    return this.api.get(`/groups/${groupId}/shared-content/`);
  }

  // Group Chat Methods
  async getGroupChat(groupId: number): Promise<AxiosResponse> {
    return this.api.get(`/groups/${groupId}/chat/`);
  }

  async sendGroupMessage(groupId: number, data: { message: string; message_type: 'text' | 'resource' | 'link' }): Promise<AxiosResponse> {
    return this.api.post(`/groups/${groupId}/chat/send/`, data);
  }

  // Group Resources Methods
  async getGroupResources(groupId: number): Promise<AxiosResponse> {
    return this.api.get(`/groups/${groupId}/resources/`);
  }

  async shareResourceToGroup(groupId: number, data: { type: 'note' | 'quiz' | 'flashcard'; resource_id: number; title?: string; description?: string }): Promise<AxiosResponse> {
    // Only send title/description if provided
    const payload: any = {
      type: data.type,
      resource_id: data.resource_id,
    };
    if (data.title) payload.title = data.title;
    if (data.description) payload.description = data.description;
    return this.api.post(`/groups/${groupId}/resources/share/`, payload);
  }

  async likeResource(resourceId: number): Promise<AxiosResponse> {
    return this.api.post(`/resources/${resourceId}/like/`);
  }

  // Shareable Links Methods
  async createShareableLink(data: { content_type: string; content_id: number; access_level?: string }): Promise<AxiosResponse> {
    return this.api.post('/shared-links/create/', data);
  }

  async getSharedContentByLink(linkId: string): Promise<AxiosResponse> {
    return this.api.get(`/shared/${linkId}/`);
  }

  async getMySharedLinks(): Promise<AxiosResponse> {
    return this.api.get('/shared-links/');
  }

  async deleteSharedLink(linkId: string): Promise<AxiosResponse> {
    return this.api.delete(`/shared-links/${linkId}/delete/`);
  }

  // Superuser Group Deletion
  async deleteGroup(groupId: number): Promise<AxiosResponse> {
    return this.api.delete(`/groups/${groupId}/delete/`);
  }

  // Group Resources Delete Methods
  async deleteGroupResource(resourceId: number): Promise<AxiosResponse> {
    return this.api.delete(`/resources/${resourceId}/delete/`);
  }

  // Legacy Group Sharing Delete Methods
  async unshareNote(noteId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.delete(`/notes/${noteId}/unshare/${groupId}/`);
  }

  async unshareQuiz(quizId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.delete(`/quizzes/${quizId}/unshare/${groupId}/`);
  }

  async unshareFlashcard(flashcardId: number, groupId: number): Promise<AxiosResponse> {
    return this.api.delete(`/flashcards/${flashcardId}/unshare/${groupId}/`);
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // AI-powered Note Generation
  /**
   * Generates a note using AI. The backend responds with a JSON object: { content: string }
   * @param data - { title, notebook_id, prompt? }
   */
  async generateNote(data: { title: string; notebook_id: number; prompt?: string }): Promise<AxiosResponse<{ content: string }>> {
    return this.api.post('/notes/generate/', data);
  }

  // Quiz Attempt Methods
  async submitQuizAttempt(quizId: number, answers: string[]): Promise<AxiosResponse<{ score: number; result: any }>> {
    return this.api.post('/quiz_attempts/', {
      quiz: quizId,
      answers: answers,
    });
  }

  // Flashcard Attempt Methods
  async submitFlashcardAttempt(flashcardId: number, correct?: boolean): Promise<AxiosResponse<{ result: any }>> {
    const data: any = { flashcard: flashcardId };
    if (typeof correct === 'boolean') data.correct = correct;
    return this.api.post('/flashcard_attempts/', data);
  }

  // Quiz Stats Methods
  async getQuizStats(quizId: number): Promise<AxiosResponse<{ attempts: number; average_score: number; best_score: number; last_score: number }>> {
    return this.api.get(`/quiz_stats/${quizId}/`);
  }

  // Flashcard Stats Methods
  async getFlashcardStats(flashcardId: number): Promise<AxiosResponse<{ attempts: number; correct: number; accuracy: number; last_reviewed: string }>> {
    return this.api.get(`/flashcard_stats/${flashcardId}/`);
  }

  // User Progress Methods
  async getUserProgress(): Promise<AxiosResponse<{ total_quiz_attempts: number; total_flashcard_attempts: number; average_quiz_score: number; flashcard_accuracy: number; current_streak_days: number }>> {
    return this.api.get('/user/progress/');
  }

  // Leaderboard Methods
  async getLeaderboard(): Promise<AxiosResponse<{ top_users: Array<{ username: string; points: number; rank: number }>; your_rank: number; your_points: number }>> {
    return this.api.get('/leaderboard/');
  }

  // User Points Methods
  async getUserPoints(): Promise<AxiosResponse<{ points: number; breakdown?: any }>> {
    return this.api.get('/user/points/');
  }
}

export const apiService = new ApiService();
export default apiService;