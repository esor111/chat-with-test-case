import { TEST_USERS } from './users.mock';

export interface TestConversation {
  id: string;
  type: 'direct' | 'group' | 'business';
  participants: string[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
}

export interface TestConversationParticipant {
  conversationId: string;
  userUuid: string;
  joinedAt: Date;
  leftAt?: Date;
  role: 'member' | 'admin' | 'agent';
  lastReadMessageId?: string;
  unreadCount: number;
}

export const TEST_CONVERSATIONS = {
  DIRECT_ALICE_BOB: {
    id: 'conv-direct-alice-bob',
    type: 'direct' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid],
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  
  DIRECT_ALICE_CHARLIE: {
    id: 'conv-direct-alice-charlie',
    type: 'direct' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.CHARLIE.uuid],
    createdAt: new Date('2024-01-01T11:00:00Z'),
    updatedAt: new Date('2024-01-01T11:00:00Z')
  },

  GROUP_TEAM: {
    id: 'conv-group-team',
    type: 'group' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid],
    name: 'Team Chat',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z')
  },

  GROUP_PROJECT: {
    id: 'conv-group-project',
    type: 'group' as const,
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid],
    name: 'Project Discussion',
    createdAt: new Date('2024-01-01T13:00:00Z'),
    updatedAt: new Date('2024-01-01T13:00:00Z')
  },

  BUSINESS_SUPPORT: {
    id: 'conv-business-support',
    type: 'business' as const,
    participants: [TEST_USERS.ALICE.uuid, 'business-uuid-1', 'agent-uuid-1'],
    name: 'Customer Support',
    createdAt: new Date('2024-01-01T14:00:00Z'),
    updatedAt: new Date('2024-01-01T14:00:00Z'),
    metadata: {
      businessId: 'business-uuid-1',
      assignedAgentId: 'agent-uuid-1',
      priority: 'medium'
    }
  }
} as const;

export const TEST_CONVERSATION_PARTICIPANTS = {
  ALICE_IN_DIRECT: {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date('2024-01-01T10:00:00Z'),
    role: 'member' as const,
    unreadCount: 0
  },

  BOB_IN_DIRECT: {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.BOB.uuid,
    joinedAt: new Date('2024-01-01T10:00:00Z'),
    role: 'member' as const,
    unreadCount: 2
  },

  ALICE_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'admin' as const,
    unreadCount: 0
  },

  BOB_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.BOB.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'member' as const,
    unreadCount: 1
  },

  CHARLIE_IN_GROUP: {
    conversationId: TEST_CONVERSATIONS.GROUP_TEAM.id,
    userUuid: TEST_USERS.CHARLIE.uuid,
    joinedAt: new Date('2024-01-01T12:00:00Z'),
    role: 'member' as const,
    unreadCount: 3
  }
} as const;

export const TEST_UNREAD_COUNT_DATA = {
  ALICE_COUNTS: new Map([
    [TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id, 0],
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 0]
  ]),
  
  BOB_COUNTS: new Map([
    [TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id, 2],
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 1]
  ]),
  
  CHARLIE_COUNTS: new Map([
    [TEST_CONVERSATIONS.GROUP_TEAM.id, 3]
  ])
} as const;

// Utility functions for conversation testing
export function createMockConversation(overrides: Partial<TestConversation> = {}): TestConversation {
  return {
    id: `conv-${Date.now()}`,
    type: 'direct',
    participants: [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

export function createMockConversationParticipant(overrides: Partial<TestConversationParticipant> = {}): TestConversationParticipant {
  return {
    conversationId: TEST_CONVERSATIONS.DIRECT_ALICE_BOB.id,
    userUuid: TEST_USERS.ALICE.uuid,
    joinedAt: new Date(),
    role: 'member',
    unreadCount: 0,
    ...overrides
  };
}

// Extended test scenarios for comprehensive testing
export const TEST_CONVERSATION_SCENARIOS = {
  // Edge case: Maximum group size
  MAX_GROUP_CONVERSATION: {
    id: 'conv-max-group',
    type: 'group' as const,
    participants: [
      TEST_USERS.ALICE.uuid,
      TEST_USERS.BOB.uuid,
      TEST_USERS.CHARLIE.uuid,
      TEST_USERS.DIANA.uuid,
      'uuid-user-5',
      'uuid-user-6',
      'uuid-user-7',
      'uuid-user-8'
    ],
    name: 'Maximum Group Chat',
    createdAt: new Date('2024-01-01T15:00:00Z'),
    updatedAt: new Date('2024-01-01T15:00:00Z')
  },

  // Edge case: Single participant group (invalid)
  INVALID_SINGLE_GROUP: {
    id: 'conv-invalid-single',
    type: 'group' as const,
    participants: [TEST_USERS.ALICE.uuid],
    name: 'Invalid Single Group',
    createdAt: new Date('2024-01-01T16:00:00Z'),
    updatedAt: new Date('2024-01-01T16:00:00Z')
  },

  // Edge case: Over-sized group (invalid)
  INVALID_OVERSIZED_GROUP: {
    id: 'conv-invalid-oversized',
    type: 'group' as const,
    participants: [
      TEST_USERS.ALICE.uuid,
      TEST_USERS.BOB.uuid,
      TEST_USERS.CHARLIE.uuid,
      TEST_USERS.DIANA.uuid,
      'uuid-user-5',
      'uuid-user-6',
      'uuid-user-7',
      'uuid-user-8',
      'uuid-user-9' // 9th participant - invalid
    ],
    name: 'Oversized Group Chat',
    createdAt: new Date('2024-01-01T17:00:00Z'),
    updatedAt: new Date('2024-01-01T17:00:00Z')
  },

  // Business conversation with multiple agents
  BUSINESS_ESCALATED: {
    id: 'conv-business-escalated',
    type: 'business' as const,
    participants: [TEST_USERS.ALICE.uuid, 'business-uuid-1', 'agent-uuid-1', 'agent-uuid-supervisor'],
    name: 'Escalated Support Case',
    createdAt: new Date('2024-01-01T18:00:00Z'),
    updatedAt: new Date('2024-01-01T18:00:00Z'),
    metadata: {
      businessId: 'business-uuid-1',
      assignedAgentId: 'agent-uuid-supervisor',
      originalAgentId: 'agent-uuid-1',
      priority: 'high',
      escalatedAt: new Date('2024-01-01T18:00:00Z'),
      escalationReason: 'complex_technical_issue'
    }
  }
} as const;

// Conversation state management utilities
export function getConversationWithParticipants(conversationId: string): { conversation: any | null; participants: TestConversationParticipant[] } {
  const conversation = Object.values(TEST_CONVERSATIONS).find(conv => conv.id === conversationId) || null;
  const participants = Object.values(TEST_CONVERSATION_PARTICIPANTS).filter(p => p.conversationId === conversationId);
  
  return { conversation, participants };
}

export function getConversationsForUser(userUuid: string): any[] {
  return Object.values(TEST_CONVERSATIONS).filter(conv => 
    conv.participants.includes(userUuid as any)
  );
}

export function getUnreadCountForUser(userUuid: string): Map<string, number> {
  const userCounts = new Map<string, number>();
  
  Object.values(TEST_CONVERSATION_PARTICIPANTS)
    .filter(p => p.userUuid === userUuid)
    .forEach(p => {
      userCounts.set(p.conversationId, p.unreadCount);
    });
  
  return userCounts;
}

export function getTotalUnreadCountForUser(userUuid: string): number {
  const counts = getUnreadCountForUser(userUuid);
  return Array.from(counts.values()).reduce((total, count) => total + count, 0);
}

// Conversation validation helpers
export function isValidConversationType(type: string): type is 'direct' | 'group' | 'business' {
  return ['direct', 'group', 'business'].includes(type);
}

export function isValidParticipantCount(type: 'direct' | 'group' | 'business', participantCount: number): boolean {
  switch (type) {
    case 'direct':
      return participantCount === 2;
    case 'group':
      return participantCount >= 2 && participantCount <= 8;
    case 'business':
      return participantCount >= 2;
    default:
      return false;
  }
}

export function canUserJoinConversation(conversation: any, userUuid: string): { canJoin: boolean; reason?: string } {
  if (conversation.participants.includes(userUuid)) {
    return { canJoin: false, reason: 'User is already a participant' };
  }

  if (conversation.type === 'direct') {
    return { canJoin: false, reason: 'Cannot join direct conversations' };
  }

  if (conversation.type === 'group' && conversation.participants.length >= 8) {
    return { canJoin: false, reason: 'Group conversation is at maximum capacity' };
  }

  return { canJoin: true };
}

export function canUserLeaveConversation(conversation: any, userUuid: string): { canLeave: boolean; reason?: string } {
  if (!conversation.participants.includes(userUuid)) {
    return { canLeave: false, reason: 'User is not a participant' };
  }

  if (conversation.type === 'direct') {
    return { canLeave: false, reason: 'Cannot leave direct conversations' };
  }

  return { canLeave: true };
}