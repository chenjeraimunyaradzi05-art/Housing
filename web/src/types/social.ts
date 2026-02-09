export interface Author {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

export interface Post {
    id: string;
    content: string | null;
    mediaUrls: string[];
    authorId: string;
    author: Author;
    createdAt: string;
    updatedAt: string;
    likeCount: number;
    commentCount: number;
    isLiked: boolean;
}

export interface Comment {
    id: string;
    content: string;
    postId: string;
    authorId: string;
    author: Author;
    parentId: string | null;
    children?: Comment[];
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    content: string;
    senderId: string;
    sender: Author;
    conversationId: string;
    isSystemMessage: boolean;
    createdAt: string;
}

export interface Conversation {
    id: string;
    participants: Author[];
    lastMessage: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
    } | null;
    hasUnread: boolean;
    lastMessageAt: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, any> | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface Group {
    id: string;
    name: string;
    description: string | null;
    avatar: string | null;
    owner: Author;
    memberCount: number;
    postCount: number;
    isPrivate: boolean;
    isMember: boolean;
    isOwner: boolean;
    createdAt: string;
}

export interface GroupMember {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    role: string;
    joinedAt: string;
}

export interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    phone: string | null;
    createdAt: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
    isFollowing: boolean;
}
