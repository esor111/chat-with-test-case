import { TEST_USERS } from './users.mock';

export interface TestMessageData {
  chatId: string;
  senderUuid: string;
  content: string;
}

export const TEST_MESSAGES = {
  BASIC_HELLO: {
    chatId: 'test-chat-1',
    senderUuid: TEST_USERS.ALICE.uuid,
    content: 'Hello from test!'
  },
  PERSISTENCE_TEST: {
    chatId: 'test-chat-persistence',
    senderUuid: TEST_USERS.EVE.uuid,
    content: 'This message should persist!'
  },
  REALTIME_TEST: {
    chatId: 'test-realtime-chat',
    senderUuid: TEST_USERS.CHARLIE.uuid,
    content: 'Real-time message!'
  },
  READ_RECEIPT_TEST: {
    chatId: 'test-read-receipts',
    senderUuid: TEST_USERS.CHARLIE.uuid,
    content: 'Message to be read!'
  },
  SMOKE_TEST: {
    chatId: 'smoke-test-chat',
    senderUuid: TEST_USERS.CHARLIE.uuid,
    content: 'End-to-end smoke test message!'
  }
} as const;

export const TEST_CHAT_IDS = {
  BASIC: 'test-chat-1',
  PERSISTENCE: 'test-chat-persistence',
  REALTIME: 'test-realtime-chat',
  READ_RECEIPTS: 'test-read-receipts',
  SMOKE_TEST: 'smoke-test-chat'
} as const;