import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, Note, Quiz, Flashcard } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  LogOut, 
  ArrowLeft, 
  Crown, 
  Calendar, 
  MessageSquare, 
  Send, 
  User, 
  Info,
  X,
  Plus,
  FileText,
  BookOpen,
  HelpCircle,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GroupMember {
  id: number;
  user: string;
  group: string;
  role: string;
  joined_at: string;
}

interface Group {
  id: number;
  name: string;
  description?: string;
  public?: boolean;
  member_count?: number;
  created_at: string;
  owner?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface ChatMessage {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  message: string;
  created_at: string;
  message_type: 'text' | 'resource' | 'system';
  resource_data?: {
    type: 'note' | 'quiz' | 'flashcard';
    title: string;
    id: number;
    url: string;
  };
}

interface SharedResource {
  id: number;
  type: 'note' | 'quiz' | 'flashcard';
  title: string;
  url: string;
  shareable_link_id: string;
  shared_by: {
    id: number;
    username: string;
  };
  shared_at: string;
  description?: string;
}

interface SharedContent {
  title: string;
  content?: string;
  notebook_title?: string;
  created_at?: string;
  quiz_id?: number;
  note_title?: string;
  questions?: Array<{
    question: string;
    options: string[];
    correct: string;
  }>;
  question?: string;
  answer?: string;
}

const GroupDetails: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviting, setInviting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'resources'>('chat');
  const [resources, setResources] = useState<SharedResource[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<SharedContent | null>(null);
  const [shareForm, setShareForm] = useState<{
    type: string;
    resource_id: string;
    title: string;
    description: string;
  }>({
    type: '',
    resource_id: '',
    title: '',
    description: ''
  });
  const [sharing, setSharing] = useState(false);
  const [loadingResource, setLoadingResource] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ correct: number; total: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchedRef = useRef(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userNotes, setUserNotes] = useState<Note[]>([]);
  const [userQuizzes, setUserQuizzes] = useState<Quiz[]>([]);
  const [userFlashcards, setUserFlashcards] = useState<Flashcard[]>([]);
  const [loadingUserResources, setLoadingUserResources] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    if (!groupId || fetchedRef.current) return;
    
    fetchedRef.current = true;
    
    setLoading(true);
    try {
      const [groupRes, membersRes] = await Promise.all([
        apiService.getGroup(parseInt(groupId)),
        apiService.getGroupMembers(parseInt(groupId))
      ]);
      
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (error: any) {
      console.error('Error fetching group details:', error);
      const message = error.response?.data?.detail || 'Failed to load group details';
      toast.error(message);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  const fetchResources = async () => {
    try {
      const response = await apiService.getGroupResources(parseInt(groupId!));
      console.log('Group resources response:', response.data);
      setResources(response.data);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load shared resources');
    }
  };

  const shareResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareForm.resource_id.trim() || sharing) return;

    setSharing(true);
    try {
      await apiService.shareResourceToGroup(parseInt(groupId!), {
        type: shareForm.type as 'note' | 'quiz' | 'flashcard',
        resource_id: parseInt(shareForm.resource_id),
        title: shareForm.title?.trim() || undefined,
        description: shareForm.description?.trim() || undefined
      });
      
      toast.success('Resource shared successfully!');
      setShowShareModal(false);
      setShareForm({ type: 'note', resource_id: '', title: '', description: '' });
      fetchResources(); // Refresh the resources list
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to share resource';
      toast.error(message);
    } finally {
      setSharing(false);
    }
  };

  const viewResource = async (resource: SharedResource) => {
    setLoadingResource(true);
    try {
      const response = await apiService.getSharedContentByLink(resource.shareable_link_id);
      setSelectedResource(response.data);
      setShowResourceModal(true);
      // Reset quiz state when opening a new resource
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    } catch (error: any) {
      console.error('Error fetching resource content:', error);
      toast.error('Failed to load resource content');
    } finally {
      setLoadingResource(false);
    }
  };

  const handleQuizAnswer = (questionIndex: number, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = async () => {
    if (!selectedResource?.questions || !selectedResource.quiz_id) return;
  
    try {
      // Convert object to ordered array of answers
      const orderedAnswers = selectedResource.questions.map((_, index) => quizAnswers[index] || "");
  
      const response = await apiService.submitQuizAttempt(selectedResource.quiz_id, orderedAnswers);
      console.log(response.data)
      const { correct, score } = response.data;
  
      setQuizScore({ correct, total: selectedResource.questions.length });
      setQuizSubmitted(true);
  
      const percentage = Math.round(score);
      toast.success(`Quiz completed! Score: ${score}/${selectedResource.questions.length} (${percentage}%)`);
  
    } catch (error) {
      console.error('Quiz submission failed:', error);
      toast.error('Failed to submit quiz. Please try again.');
    }
  };
  

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const fetchMessages = async () => {
    try {
      const response = await apiService.getGroupChat(parseInt(groupId!));
      setMessages(response.data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        toast.error('You must be a member to view group chat');
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await apiService.sendGroupMessage(parseInt(groupId!), {
        message: newMessage.trim(),
        message_type: 'text'
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send message';
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  // Start polling for new messages
  useEffect(() => {
    fetchMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [groupId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  useEffect(() => {
    if (groupId) {
      fetchedRef.current = false;
      fetchGroupDetails();
      fetchResources();
    }
  }, [fetchGroupDetails]);

  useEffect(() => {
    if (!hasScrolledToBottom && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasScrolledToBottom(true);
    }
  }, [messages, hasScrolledToBottom]);

  // Reset hasScrolledToBottom on unmount
  useEffect(() => {
    return () => {
      setHasScrolledToBottom(false);
    };
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setInviting(true);
    try {
      await apiService.inviteToGroup(parseInt(groupId!), inviteUsername.trim());
      toast.success(`Invitation sent to ${inviteUsername}`);
      setShowInviteModal(false);
      setInviteUsername('');
      fetchGroupDetails(); // Refresh members
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to send invitation';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = window.confirm('Are you sure you want to leave this group?');
    if (!confirmed) return;
    
    try {
      await apiService.leaveGroup(parseInt(groupId!));
      toast.success('You have left the group');
      navigate('/groups');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to leave group';
      toast.error(message);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTime(dateString);
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.user.id === currentUser?.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group not found</h2>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/groups')}
            className="btn-primary"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              <p className="text-sm text-gray-600">{members.length} members</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowGroupInfo(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Info size={20} />
              <span>Group Info</span>
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus size={20} />
              <span>Invite</span>
            </button>
            <button
              onClick={handleLeaveGroup}
              className="btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <LogOut size={20} />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'resources'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Resources
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border border-gray-200 flex flex-col h-full">
          {activeTab === 'chat' ? (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                {messages.length === 0 ? (
                  <div className="text-center py-12 flex-1 flex flex-col justify-center">
                    <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-600">Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          isOwnMessage(message)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {/* Message Header */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-1">
                            <User size={12} className={isOwnMessage(message) ? 'text-primary-100' : 'text-gray-500'} />
                            <span className="text-xs font-medium">
                              {message.user.first_name && message.user.last_name
                                ? `${message.user.first_name} ${message.user.last_name}`
                                : message.user.username}
                            </span>
                          </div>
                          <span className={`text-xs ${isOwnMessage(message) ? 'text-primary-100' : 'text-gray-500'}`}>
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        {/* Message Content */}
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <textarea
                    ref={inputRef as any}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 input-field resize-none min-h-[40px] max-h-[120px]"
                    disabled={sending}
                    rows={1}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Resources Tab */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Shared Resources</h3>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Share Resource</span>
                </button>
              </div>
              
              {resources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shared resources yet</h3>
                  <p className="text-gray-600">Share your notes, quizzes, or flashcards with the group.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => viewResource(resource)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {resource.type === 'note' && <FileText size={20} className="text-blue-500" />}
                          {resource.type === 'quiz' && <HelpCircle size={20} className="text-green-500" />}
                          {resource.type === 'flashcard' && <BookOpen size={20} className="text-purple-500" />}
                          <span className="text-xs font-medium text-gray-500 uppercase">{resource.type}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(resource.shared_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 mb-2">{resource.title}</h4>
                      
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Shared by {resource.shared_by.username}</span>
                        {currentUser && resource.shared_by.username === currentUser.username && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log('Attempting to delete resource:', resource);
                              if (!window.confirm('Are you sure you want to remove this resource from the group?')) return;
                              try {
                                await apiService.deleteGroupResource(resource.id);
                                toast.success('Resource removed from group');
                                fetchResources();
                              } catch (err: any) {
                                toast.error(err.response?.data?.error || err.message || 'Failed to remove resource');
                              }
                            }}
                            className="ml-2 p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                            title="Delete shared resource"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Group Information</h2>
              <button
                onClick={() => setShowGroupInfo(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Group Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{group.name}</h3>
                {group.description && (
                  <p className="text-gray-600 mb-4">{group.description}</p>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                    <p className="text-sm text-gray-600">Members</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {group.public ? 'Public' : 'Private'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Created Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={20} className="text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-600">
                    {new Date(group.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Members ({members.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((member, index) => (
                    <div key={member?.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {member?.user?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member?.user || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{member?.role || 'member'}</p>
                        </div>
                      </div>
                      {member?.role === 'admin' && (
                        <Crown size={16} className="text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Invite User</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUsername('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteUser}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={inviteUsername}
                  onChange={e => setInviteUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={inviting}
                >
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteUsername('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={inviting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Resource Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Share Resource</h2>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareForm({ type: 'note', resource_id: '', title: '', description: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={shareResource}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource Type
                  </label>
                  <select
                    value={shareForm.type}
                    onChange={async (e) => {
                      const type = e.target.value as 'note' | 'quiz' | 'flashcard';
                      setShareForm({ ...shareForm, type, resource_id: '' });
                      setLoadingUserResources(true);
                      try {
                        if (type === 'note') {
                          const res = await apiService.getNotes();
                          setUserNotes(res.data);
                        } else if (type === 'quiz') {
                          const res = await apiService.getQuizzes();
                          setUserQuizzes(res.data);
                        } else if (type === 'flashcard') {
                          const res = await apiService.getFlashcards();
                          setUserFlashcards(res.data);
                        }
                      } catch (err) {
                        toast.error('Failed to load your resources');
                      } finally {
                        setLoadingUserResources(false);
                      }
                    }}
                    className="input-field"
                    required
                  >
                    <option value="" disabled>Select Resource</option>
                    <option value="note">Note</option>
                    <option value="quiz">Quiz</option>
                    <option value="flashcard">Flashcard</option>
                  </select>
                </div>
                {shareForm.type && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select {shareForm.type.charAt(0).toUpperCase() + shareForm.type.slice(1)}
                    </label>
                    {loadingUserResources ? (
                      <div className="text-gray-500 text-sm">Loading...</div>
                    ) : (
                      <select
                        value={shareForm.resource_id}
                        onChange={e => setShareForm({ ...shareForm, resource_id: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="">Select a {shareForm.type}</option>
                        {shareForm.type === 'note' && userNotes.map(note => (
                          <option key={note.id} value={note.id}>{note.title}</option>
                        ))}
                        {shareForm.type === 'quiz' && userQuizzes.map(quiz => (
                          <option key={quiz.id} value={quiz.id}>{quiz.note_title ? `${quiz.note_title} (Quiz)` : `Quiz #${quiz.id}`}</option>
                        ))}
                        {shareForm.type === 'flashcard' && userFlashcards.map(fc => (
                          <option key={fc.id} value={fc.id}>{fc.question}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={shareForm.title}
                    onChange={e => setShareForm({ ...shareForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter a custom title (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={shareForm.description}
                    onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                    className="input-field"
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-6">
                <button 
                  type="submit" 
                  className="btn-primary flex-1"
                  disabled={sharing}
                >
                  {sharing ? 'Sharing...' : 'Share Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareModal(false);
                    setShareForm({ type: 'note', resource_id: '', title: '', description: '' });
                  }}
                  className="btn-secondary flex-1"
                  disabled={sharing}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource View Modal */}
      {showResourceModal && selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{selectedResource.title}</h2>
              <button
                onClick={() => {
                  setShowResourceModal(false);
                  setSelectedResource(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingResource ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Note Content */}
                  {selectedResource.content && typeof selectedResource.content === 'string' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Content</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedResource.content}</p>
                      </div>
                    </div>
                  )}
                  {/* If content is a JSON object, extract and display only the 'content' field */}
                  {selectedResource.content &&
                    typeof selectedResource.content === 'object' &&
                    'content' in selectedResource.content &&
                    typeof (selectedResource.content as any).content === 'string' && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Content</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900 whitespace-pre-wrap">{(selectedResource.content as any).content}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Quiz Questions */}
                  {selectedResource.questions && selectedResource.questions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Quiz Questions</h3>
                        {quizSubmitted && (
                          <button
                            onClick={resetQuiz}
                            className="btn-secondary text-sm px-3 py-1"
                          >
                            Retake Quiz
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {selectedResource.questions.map((question, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                              {index + 1}. {question.question}
                            </h4>
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => {
                                const letter = String.fromCharCode(65 + optionIndex); // A, B, C, D...
                                const cleanOption = option.trim().replace(/^[A-D]\.\s*/, '');
                                const displayOption = `${letter}. ${cleanOption}`;

                                const selectedLetter = quizAnswers[index]; // e.g., "B"
                                const correctLetter = question.correct.trim().charAt(0);

                                const isSelected = selectedLetter === letter;
                                const isCorrect = correctLetter === letter;
                                const showResults = quizSubmitted;

                                let className = "p-3 rounded border cursor-pointer transition-colors";

                                if (showResults) {
                                  if (isCorrect) {
                                    className += " bg-green-100 border-green-300 text-green-800";
                                  } else if (isSelected && !isCorrect) {
                                    className += " bg-red-100 border-red-300 text-red-800";
                                  } else {
                                    className += " bg-gray-100 border-gray-300 text-gray-700";
                                  }
                                } else {
                                  if (isSelected) {
                                    className += " bg-primary-100 border-primary-300 text-primary-800";
                                  } else {
                                    className += " bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
                                  }
                                }

                                return (
                                  <div
                                    key={optionIndex}
                                    className={className}
                                    onClick={() => !quizSubmitted && handleQuizAnswer(index, letter)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{displayOption}</span>
                                      {showResults && (
                                        <span className="text-sm font-medium">
                                          {isCorrect ? "✓ Correct Answer" : isSelected ? "✗ Your Answer" : ""}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {!quizSubmitted && (
                        <div className="mt-6">
                          <button
                            onClick={submitQuiz}
                            disabled={Object.keys(quizAnswers).length < selectedResource.questions.length}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Submit Quiz ({Object.keys(quizAnswers).length}/{selectedResource.questions.length} answered)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Flashcard */}
                  {selectedResource.question && selectedResource.answer && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Flashcard</h3>
                      <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Question</h4>
                          <p className="text-blue-800">{selectedResource.question}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="font-medium text-green-900 mb-2">Answer</h4>
                          <p className="text-green-800">{selectedResource.answer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Metadata */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      {selectedResource.notebook_title && (
                        <div>
                          <span className="font-medium">Notebook:</span> {selectedResource.notebook_title}
                        </div>
                      )}
                      {selectedResource.created_at && (
                        <div>
                          <span className="font-medium">Created:</span> {new Date(selectedResource.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetails; 