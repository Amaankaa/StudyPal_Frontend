import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Send, MessageSquare, FileText, BookOpen, Zap, User } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface GroupChatProps {
  groupId: number;
  groupName: string;
}

const GroupChat: React.FC<GroupChatProps> = ({ groupId, groupName }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await apiService.getGroupChat(groupId);
      setMessages(response.data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        toast.error('You must be a member to view group chat');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await apiService.sendGroupMessage(groupId, {
        message: newMessage.trim(),
        message_type: 'text'
      });
      
      // Add the new message to the list
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

  const getMessageIcon = (message: ChatMessage) => {
    if (message.message_type === 'resource' && message.resource_data) {
      switch (message.resource_data.type) {
        case 'note':
          return <FileText size={16} className="text-blue-500" />;
        case 'quiz':
          return <BookOpen size={16} className="text-green-500" />;
        case 'flashcard':
          return <Zap size={16} className="text-yellow-500" />;
        default:
          return <MessageSquare size={16} className="text-gray-500" />;
      }
    }
    return <MessageSquare size={16} className="text-gray-500" />;
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.user.id === currentUser?.id;
  };

  if (loading) {
    return (
      <div className="card h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-96 flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
          <MessageSquare size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Group Chat</h3>
          <p className="text-xs text-gray-500">{groupName}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  isOwnMessage(message)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center space-x-2 mb-1">
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
                <div className="flex items-start space-x-2">
                  {message.message_type === 'resource' && message.resource_data && (
                    <div className="flex-shrink-0 mt-0.5">
                      {getMessageIcon(message)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.message}</p>
                    {message.message_type === 'resource' && message.resource_data && (
                      <div className={`mt-1 p-2 rounded text-xs ${
                        isOwnMessage(message) ? 'bg-primary-400' : 'bg-gray-200'
                      }`}>
                        <p className="font-medium">{message.resource_data.title}</p>
                        <p className="capitalize">{message.resource_data.type}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 input-field"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};

export default GroupChat; 