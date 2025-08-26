import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TEST_MESSAGES, TEST_USERS } from './mocks';
import { 
  createTestApp, 
  restartTestApp,
  createWebSocketClient,
  expectDatabaseHealth,
  expectWebSocketHealth,
  expectCacheHealth,
  expectValidChatList
} from './utils';

describe('End-to-End Smoke Test', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp(3002);
  });

  afterEach(async () => {
    await app.close();
  });

  it('complete chat flow works end-to-end', async () => {
    // This test validates the entire system integration:
    // Infrastructure → Database → Messaging → Real-time → Profiles → Read Receipts
    
    console.log('🚀 Starting End-to-End Smoke Test...');

    // Step 1: Verify all infrastructure components are healthy
    console.log('📊 Step 1: Checking infrastructure health...');
    
    // Database health check
    const dbHealth = await request(app.getHttpServer())
      .get('/health/database')
      .expect(200);
    
    expectDatabaseHealth(dbHealth.body);
    console.log('✅ Database connection healthy');

    // WebSocket health check
    const wsHealth = await request(app.getHttpServer())
      .get('/health/websocket')
      .expect(200);
    
    expectWebSocketHealth(wsHealth.body);
    console.log('✅ WebSocket server healthy');

    // Cache health check
    const cacheHealth = await request(app.getHttpServer())
      .get('/health/cache')
      .expect(200);
    
    expectCacheHealth(cacheHealth.body);
    console.log('✅ Cache system healthy');

    // Step 2: Test profile integration in chat list
    console.log('👤 Step 2: Testing profile integration...');
    
    const chatListResponse = await request(app.getHttpServer())
      .get('/chats')
      .expect(200);

    const chatList = chatListResponse.body;
    expectValidChatList(chatList);
    expect(chatList[0].participantName).not.toMatch(/^uuid-/);
    console.log(`✅ Profile integration working: ${chatList[0].participantName}`);

    // Step 3: Set up real-time WebSocket connection
    console.log('🔌 Step 3: Setting up real-time connection...');
    
    const wsClient = createWebSocketClient(3002);
    await wsClient.connect();
    console.log('✅ WebSocket connected successfully');

    // Step 4: Send message and verify database persistence
    console.log('💾 Step 4: Testing message persistence...');
    
    const messageData = TEST_MESSAGES.SMOKE_TEST;

    const sendResponse = await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages`)
      .send(messageData)
      .expect(201);

    expect(sendResponse.body.status).toBe('sent');
    expect(sendResponse.body.messageId).toBeDefined();
    const messageId = sendResponse.body.messageId;
    console.log(`✅ Message sent and persisted: ${messageId}`);

    // Step 5: Verify real-time delivery
    console.log('⚡ Step 5: Verifying real-time delivery...');
    
    const receivedMessage = await wsClient.waitForMessage(1000);

    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.content).toBe(messageData.content);
    expect(receivedMessage.senderUuid).toBe(messageData.senderUuid);
    expect(receivedMessage.id).toBe(messageId);
    console.log('✅ Real-time delivery confirmed');

    // Step 6: Fetch message history and verify persistence
    console.log('📚 Step 6: Testing message history retrieval...');
    
    const historyResponse = await request(app.getHttpServer())
      .get(`/chats/${messageData.chatId}/messages`)
      .expect(200);

    const messages = historyResponse.body;
    const persistedMessage = messages.find((msg: any) => msg.id === messageId);
    
    expect(persistedMessage).toBeDefined();
    expect(persistedMessage.content).toBe(messageData.content);
    expect(persistedMessage.senderUuid).toBe(messageData.senderUuid);
    console.log('✅ Message history retrieval confirmed');

    // Step 7: Test read receipts functionality
    console.log('👁️ Step 7: Testing read receipts...');
    
    const readReceiptResponse = await request(app.getHttpServer())
      .post(`/chats/${messageData.chatId}/messages/${messageId}/read`)
      .send({ readerUuid: TEST_USERS.DIANA.uuid })
      .expect(200);

    expect(readReceiptResponse.body.status).toBe('read');
    console.log('✅ Read receipt marked successfully');

    // Wait for real-time read receipt delivery
    const receivedReadReceipt = await wsClient.waitForReadReceipt(500);

    expect(receivedReadReceipt).toBeDefined();
    expect(receivedReadReceipt.messageId).toBe(messageId);
    expect(receivedReadReceipt.readerUuid).toBe(TEST_USERS.DIANA.uuid);
    console.log('✅ Real-time read receipt confirmed');

    // Step 8: Verify read receipt persistence
    console.log('💾 Step 8: Verifying read receipt persistence...');
    
    const updatedHistoryResponse = await request(app.getHttpServer())
      .get(`/chats/${messageData.chatId}/messages`)
      .expect(200);

    const updatedMessages = updatedHistoryResponse.body;
    const readMessage = updatedMessages.find((msg: any) => msg.id === messageId);
    
    expect(readMessage).toBeDefined();
    expect(readMessage.readBy).toBeDefined();
    expect(readMessage.readBy[TEST_USERS.DIANA.uuid]).toBeDefined();
    console.log('✅ Read receipt persistence confirmed');

    // Step 9: Simulate app restart and verify data persistence
    console.log('🔄 Step 9: Testing persistence across app restart...');
    
    // Close and restart the app
    wsClient.disconnect();
    app = await restartTestApp(app, 3002);

    // Verify data still exists after restart
    const postRestartResponse = await request(app.getHttpServer())
      .get(`/chats/${messageData.chatId}/messages`)
      .expect(200);

    const postRestartMessages = postRestartResponse.body;
    const survivedMessage = postRestartMessages.find((msg: any) => msg.id === messageId);
    
    expect(survivedMessage).toBeDefined();
    expect(survivedMessage.content).toBe(messageData.content);
    expect(survivedMessage.readBy[TEST_USERS.DIANA.uuid]).toBeDefined();
    console.log('✅ Data persistence across restart confirmed');

    console.log('🎉 End-to-End Smoke Test PASSED - All systems working together!');
  }, 30000); // 30 second timeout for comprehensive test
});