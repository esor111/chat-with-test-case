import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { 
  TEST_MESSAGES, 
  TEST_USERS, 
  TEST_CHAT_IDS 
} from './mocks';
import { 
  createTestApp, 
  createWebSocketClient, 
  expectValidChatList,
  expectValidMessage,
  expectValidSendResponse
} from './utils';

describe('User Outcomes (Blue Phase - All Skeleton Tests)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp(3001);
  });

  afterEach(async () => {
    await app.close();
  });

  it('user sees chat list', async () => {
    const response = await request(app.getHttpServer())
      .get('/chats')
      .expect(200);

    const chatList = response.body;
    expectValidChatList(chatList);
  });

  it('user opens chat shows history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/chats/${TEST_CHAT_IDS.BASIC}/messages`)
      .expect(200);

    const messages = response.body;
    expect(messages.length).toBeGreaterThan(0);
    expectValidMessage(messages[0]);
  });

  it('user sends message shows locally', async () => {
    const messageData = TEST_MESSAGES.BASIC_HELLO;

    const response = await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages`)
      .send(messageData)
      .expect(201);

    expectValidSendResponse(response.body);
  });

  it('message persists across sessions', async () => {
    const messageData = TEST_MESSAGES.PERSISTENCE_TEST;

    // Send a message
    await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages`)
      .send(messageData)
      .expect(201);

    // Simulate app restart
    await app.close();
    app = await createTestApp();

    // Check if message still exists after restart
    const response = await request(app.getHttpServer())
      .get(`/chats/${messageData.chatId}/messages`)
      .expect(200);

    const messages = response.body;
    const persistedMessage = messages.find(msg => msg.content === messageData.content);
    expect(persistedMessage).toBeDefined();
    expect(persistedMessage.senderUuid).toBe(messageData.senderUuid);
  });

  it('recipient receives in real time', async () => {
    const wsClient = createWebSocketClient(3001);
    await wsClient.connect();

    const messageData = TEST_MESSAGES.REALTIME_TEST;

    // Send message via HTTP API (simulating sender)
    await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages`)
      .send(messageData)
      .expect(201);

    // Wait for real-time delivery
    const receivedMessage = await wsClient.waitForMessage(1000);

    // Verify recipient received the message in real-time
    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.content).toBe(messageData.content);
    expect(receivedMessage.senderUuid).toBe(messageData.senderUuid);

    wsClient.disconnect();
  }, 15000);

  it('read receipts update correctly', async () => {
    const messageData = TEST_MESSAGES.READ_RECEIPT_TEST;

    // Send a message
    const sendResponse = await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages`)
      .send(messageData)
      .expect(201);

    const messageId = sendResponse.body.messageId;

    // Mark message as read by recipient
    await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages/${messageId}/read`)
      .send({ readerUuid: TEST_USERS.DIANA.uuid })
      .expect(200);

    // Get chat history and verify read receipt is tracked
    const historyResponse = await request(app.getHttpServer())
      .get(`/chats/${messageData.chatId}/messages`)
      .expect(200);

    const messages = historyResponse.body;
    const readMessage = messages.find((msg: any) => msg.id === messageId);
    
    expect(readMessage).toBeDefined();
    expect(readMessage).toHaveProperty('readBy');
    expect(readMessage.readBy).toHaveProperty(TEST_USERS.DIANA.uuid);
    expect(readMessage.readBy[TEST_USERS.DIANA.uuid]).toBeDefined();
  });

  it('user sees real names in chat list', async () => {
    const response = await request(app.getHttpServer())
      .get('/chats')
      .expect(200);

    const chatList = response.body;
    expect(chatList.length).toBeGreaterThan(0);
    
    // Expect real user names instead of UUIDs
    expect(chatList[0]).toHaveProperty('participantName');
    expect(chatList[0].participantName).toBeDefined();
    expect(chatList[0].participantName).not.toMatch(/^uuid-/); // Should not be a UUID format
    expect(typeof chatList[0].participantName).toBe('string');
    expect(chatList[0].participantName.length).toBeGreaterThan(0);
    
    // Should still have UUID for internal reference
    expect(chatList[0]).toHaveProperty('participantUuid');
    expect(chatList[0].participantUuid).toMatch(/^uuid-/); // Should be UUID format
    
    // Verify it matches our test data
    expect(chatList[0].participantName).toBe(TEST_USERS.ALICE.name);
    expect(chatList[0].participantUuid).toBe(TEST_USERS.ALICE.uuid);
  });
});