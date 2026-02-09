import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchFeed = async () => {
    try {
      const response = await api.get<{ posts: Post[] }>('/api/social/feed');
      if (response.success && response.data) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Feed fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      const response = await api.post<{ post: Post }>('/api/social/posts', {
        content: newPostContent,
      });
      if (response.success && response.data) {
        setPosts([response.data.post, ...posts]);
        setNewPostContent('');
      }
    } catch (error) {
      console.error('Post error:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !isLiked, likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );

    try {
      await api.post(`/api/social/posts/${postId}/like`);
    } catch (error) {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isLiked: isLiked, likeCount: isLiked ? p.likeCount : p.likeCount - 1 }
            : p
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>
            {item.author.firstName[0]}
            {item.author.lastName[0]}
          </Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>
            {item.author.firstName} {item.author.lastName}
          </Text>
          <Text style={styles.postTime}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id, item.isLiked)}
        >
          <Text style={[styles.actionIcon, item.isLiked && styles.likedIcon]}>
            {item.isLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionText}>{item.likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{item.commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.rose} />
        }
        ListHeaderComponent={
          <View style={styles.createPost}>
            <View style={styles.createAvatar}>
              <Text style={styles.createAvatarText}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Text>
            </View>
            <TextInput
              style={styles.createInput}
              placeholder="Share your wins, questions, or tips..."
              placeholderTextColor={colors.gray400}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
            />
            <TouchableOpacity
              style={[styles.postButton, !newPostContent.trim() && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={!newPostContent.trim() || posting}
            >
              <Text style={styles.postButtonText}>{posting ? '...' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share something!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  createPost: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  createAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAvatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  createInput: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.rose,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-end',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  postCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  authorInfo: {
    marginLeft: spacing.sm,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  postTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  postContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionIcon: {
    fontSize: 18,
  },
  likedIcon: {
    color: colors.error,
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
