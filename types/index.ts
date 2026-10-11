//  User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

// Auth
export interface AuthResponse {
  user: User;
  accessToken: string;
}

//  Conversation
export type MemberRole = "MEMBER" | "ADMIN";

export interface ConversationMember {
  id: string;
  role: MemberRole;
  joinedAt: string;
  lastReadAt: string;
  user: Pick<
    User,
    "id" | "name" | "email" | "avatar" | "isOnline" | "lastSeen"
  >;
}

export interface LastMessage {
  id: string;
  content: string;
  type: MessageType;
  createdAt: string;
  sender: Pick<User, "id" | "name" | "avatar">;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  inviteToken: string | null;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  messages: LastMessage[];
  unreadCount: number;
}

// Message
export type MessageType = "TEXT" | "IMAGE" | "FILE";

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: Pick<User, "id" | "name">;
}

export interface ReplyPreview {
  id: string;
  content: string;
  isDeleted: boolean;
  sender: Pick<User, "id" | "name">;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  conversationId: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender: Pick<User, "id" | "name" | "avatar">;
  replyTo: ReplyPreview | null;
  reactions: MessageReaction[];
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  nextCursor?: string | null;
  hasMore?: boolean;
}

// Socket Payloads
export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface SeenPayload {
  conversationId: string;
  messageId: string;
  seenBy: { userId: string; userName: string };
}

export interface ReactionPayload {
  messageId: string;
  action: "added" | "removed";
  emoji: string;
  userId: string;
}

export interface UserOfflinePayload {
  userId: string;
  lastSeen: string;
}
