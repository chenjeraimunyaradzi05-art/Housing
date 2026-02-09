import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/ui/Avatar';

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

export default function MessagesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const res = await api.get<{ conversations: Conversation[] }>('/api/messages/conversations');
      if (res.success && res.data) {
        setConversations(res.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get<{ messages: Message[] }>(`/api/messages/conversations/${conversationId}`);
      if (res.success && res.data) {
        setMessages(res.data.messages);
        // Mark as read
        await api.post(`/api/messages/conversations/${conversationId}/read`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      senderId: user?.id || '',
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        avatar: null,
      },
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const res = await api.post<{ message: Message }>(
        `/api/messages/conversations/${selectedConversation.id}/messages`,
        { body: { content: optimisticMessage.content } }
      );
      if (res.success && res.data) {
        setMessages(prev => prev.map(m => (m.id === tempId ? res.data!.message : m)));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id) || conversation.participants[0];
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    return (
      <TouchableOpacity
        style={[styles.conversationItem, item.hasUnread && styles.unreadConversation]}
        onPress={() => setSelectedConversation(item)}
      >
        <Avatar
          name={`${other.firstName} ${other.lastName}`}
          source={other.avatar ? { uri: other.avatar } : undefined}
          size="md"
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>
              {other.firstName} {other.lastName}
            </Text>
            <Text style={styles.conversationTime}>
              {item.lastMessage ? formatTime(item.lastMessage.createdAt) : ''}
            </Text>
          </View>
          <Text style={[styles.lastMessage, item.hasUnread && styles.unreadText]} numberOfLines={1}>
            {item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
        {item.hasUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    return (
      <View style={[styles.messageContainer, isOwn && styles.ownMessageContainer]}>
        {!isOwn && (
          <Avatar
            name={`${item.sender.firstName} ${item.sender.lastName}`}
            source={item.sender.avatar ? { uri: item.sender.avatar } : undefined}
            size="sm"
          />
        )}
        <View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>{item.content}</Text>
          <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  // Conversation List View
  if (!selectedConversation) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.rose} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by messaging someone from their profile
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    );
  }

  // Chat View
  const otherParticipant = getOtherParticipant(selectedConversation);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Avatar
            name={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
            source={otherParticipant.avatar ? { uri: otherParticipant.avatar } : undefined}
            size="sm"
          />
          <Text style={styles.chatHeaderName}>
            {otherParticipant.firstName} {otherParticipant.lastName}
          </Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.rose} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            inverted={false}
          />
        )}

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray400}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.gray900,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.gray500,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  unreadConversation: {
    backgroundColor: colors.rose + '05',
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
  },
  conversationTime: {
    fontSize: fontSize.xs,
    color: colors.gray500,
  },
  lastMessage: {
    fontSize: fontSize.sm,
    color: colors.gray500,
  },
  unreadText: {
    color: colors.gray700,
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.rose,
    marginLeft: spacing.sm,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.rose,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.gray900,
    marginLeft: spacing.sm,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginLeft: spacing.sm,
  },
  ownBubble: {
    backgroundColor: colors.rose,
    marginLeft: 0,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.gray100,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: fontSize.md,
    color: colors.gray900,
  },
  ownMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.gray900,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.rose,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
});
