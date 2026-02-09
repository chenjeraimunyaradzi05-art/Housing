'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Button, Card, Avatar, Spinner, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';

interface Participant {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: Participant;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  hasUnread: boolean;
  lastMessageAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get<{ conversations: Conversation[] }>('/api/messages/conversations');
      if (res.success && res.data) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get<{ messages: Message[]; conversation: any }>(
        `/api/messages/conversations/${conversationId}`
      );
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark as read
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, hasUnread: false } : c)
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: user!.id,
      sender: {
        id: user!.id,
        username: user!.username || '',
        firstName: user!.firstName || '',
        lastName: user!.lastName || '',
        avatar: user!.profileImage || null,
      },
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await api.post<{ message: Message }>(
        `/api/messages/conversations/${selectedConversation.id}/messages`,
        { body: { content: messageContent } }
      );

      if (res.success && res.data) {
        // Replace optimistic message with real one
        setMessages(prev =>
          prev.map(m => m.id === optimisticMessage.id ? res.data!.message : m)
        );
        // Update conversation list
        setConversations(prev =>
          prev.map(c => c.id === selectedConversation.id
            ? { ...c, lastMessage: { id: res.data!.message.id, content: res.data!.message.content, senderId: res.data!.message.senderId, createdAt: res.data!.message.createdAt }, lastMessageAt: res.data!.message.createdAt }
            : c
          ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.participants.some(p =>
      p.firstName.toLowerCase().includes(query) ||
      p.lastName.toLowerCase().includes(query) ||
      p.username.toLowerCase().includes(query)
    );
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Conversation List */}
      <div className="w-80 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <Button variant="ghost" size="sm" className="text-purple-600">
              <UserPlusIcon className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a conversation with someone!</p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const participant = conv.participants[0];
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left ${
                    selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      src={participant?.avatar || undefined}
                      alt={participant?.firstName}
                      fallback={participant?.firstName?.[0]}
                    />
                    {conv.hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-medium text-gray-900 truncate ${conv.hasUnread ? 'font-semibold' : ''}`}>
                        {participant?.firstName} {participant?.lastName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-sm truncate ${conv.hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3">
              <Avatar
                src={selectedConversation.participants[0]?.avatar || undefined}
                alt={selectedConversation.participants[0]?.firstName}
                fallback={selectedConversation.participants[0]?.firstName?.[0]}
              />
              <div>
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation.participants[0]?.firstName} {selectedConversation.participants[0]?.lastName}
                </h2>
                <p className="text-sm text-gray-500">
                  @{selectedConversation.participants[0]?.username}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Spinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map(message => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && (
                          <Avatar
                            src={message.sender?.avatar || undefined}
                            alt={message.sender?.firstName}
                            fallback={message.sender?.firstName?.[0]}
                            size="sm"
                          />
                        )}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-3"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">Your Messages</h3>
              <p className="mt-1">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
