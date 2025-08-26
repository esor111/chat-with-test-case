import { TEST_USERS } from './users.mock';

export interface TestChatPreview {
  id: string;
  participantUuid: string;
  participantName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

export const TEST_CHAT_PREVIEW = {
  id: 'test-chat-1',
  participantUuid: TEST_USERS.ALICE.uuid,
  participantName: TEST_USERS.ALICE.name,
  lastMessage: 'Hello there!',
  timestamp: new Date(),
  unreadCount: 1
};

export function createMockChatPreview(overrides: Partial<TestChatPreview> = {}): TestChatPreview {
  return {
    ...TEST_CHAT_PREVIEW,
    ...overrides
  };
}