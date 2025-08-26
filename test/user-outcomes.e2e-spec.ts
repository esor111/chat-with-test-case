import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User Outcomes (Blue Phase - All Skeleton Tests)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure WebSocket adapter for testing
    const { IoAdapter } = require('@nestjs/platform-socket.io');
    app.useWebSocketAdapter(new IoAdapter(app));
    
    await app.init();
    await app.listen(3001); // Listen on a test port for WebSocket connections
  });

  afterEach(async () => {
    await app.close();
  });

  it('user sees chat list', async () => {
    // Red phase: real expectations - should FAIL because ChatService doesn't exist
    const response = await request(app.getHttpServer())
      .get('/chats')
      .expect(200);

    const chatList = response.body;
    expect(chatList.length).toBeGreaterThan(0);
    expect(chatList[0]).toHaveProperty('id');
    expect(chatList[0]).toHaveProperty('participantUuid');
    expect(chatList[0]).toHaveProperty('lastMessage');
  });

  it('user opens chat shows history', async () => {
    // Red phase: real expectations - should FAIL because endpoint doesn't exist
    const response = await request(app.getHttpServer())
      .get('/chats/test-chat-1/messages')
      .expect(200);

    const messages = response.body;
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toHaveProperty('id');
    expect(messages[0]).toHaveProperty('senderUuid');
    expect(messages[0]).toHaveProperty('content');
    expect(messages[0]).toHaveProperty('timestamp');
  });

  it('user sends message shows locally', async () => {
    // Red phase: real expectations - should FAIL because POST endpoint doesn't exist
    const messageData = {
      chatId: 'test-chat-1',
      senderUuid: 'uuid-123',
      content: 'Hello from test!'
    };

    const response = await request(app.getHttpServer())
      .post('/chats/test-chat-1/messages')
      .send(messageData)
      .expect(201);

    expect(response.body).toHaveProperty('status', 'sent');
    expect(response.body).toHaveProperty('messageId');
    expect(response.body.messageId).toBeDefined();
  });

  it('message persists across sessions', async () => {
    // Red phase: real expectations - should FAIL because no persistence (hardcoded data disappears)
    const messageData = {
      chatId: 'test-chat-persistence',
      senderUuid: 'uuid-persistence-test',
      content: 'This message should persist!'
    };

    // Send a message
    await request(app.getHttpServer())
      .post('/chats/test-chat-persistence/messages')
      .send(messageData)
      .expect(201);

    // Simulate app restart by closing and reinitializing
    await app.close();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();

    // Check if message still exists after "restart"
    const response = await request(app.getHttpServer())
      .get('/chats/test-chat-persistence/messages')
      .expect(200);

    const messages = response.body;
    const persistedMessage = messages.find(msg => msg.content === 'This message should persist!');
    expect(persistedMessage).toBeDefined();
    expect(persistedMessage.senderUuid).toBe('uuid-persistence-test');
  });

  it('recipient receives in real time', async () => {
    // Red phase: real expectations - should FAIL because no WebSocket/real-time delivery
    const io = require('socket.io-client');
    
    // Connect to the test server
    const recipientSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      timeout: 5000,
    });

    let receivedMessage: any = null;
    let connected = false;
    
    // Listen for incoming messages
    recipientSocket.on('message', (message: any) => {
      receivedMessage = message;
    });

    // Wait for connection with timeout
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      recipientSocket.on('connect', () => {
        connected = true;
        clearTimeout(timeout);
        resolve(true);
      });

      recipientSocket.on('connect_error', (error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    expect(connected).toBe(true);

    // Send message via HTTP API (simulating sender)
    const messageData = {
      chatId: 'test-realtime-chat',
      senderUuid: 'uuid-sender',
      content: 'Real-time message!'
    };

    await request(app.getHttpServer())
      .post('/chats/test-realtime-chat/messages')
      .send(messageData)
      .expect(201);

    // Wait a bit for real-time delivery
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify recipient received the message in real-time
    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.content).toBe('Real-time message!');
    expect(receivedMessage.senderUuid).toBe('uuid-sender');

    recipientSocket.disconnect();
  }, 15000);

  it('read receipts update correctly', async () => {
    // Red phase: real expectations - should FAIL because no read receipt tracking
    const messageData = {
      chatId: 'test-read-receipts',
      senderUuid: 'uuid-sender',
      content: 'Message to be read!'
    };

    // Send a message
    const sendResponse = await request(app.getHttpServer())
      .post('/chats/test-read-receipts/messages')
      .send(messageData)
      .expect(201);

    const messageId = sendResponse.body.messageId;

    // Mark message as read by recipient
    await request(app.getHttpServer())
      .post(`/chats/test-read-receipts/messages/${messageId}/read`)
      .send({ readerUuid: 'uuid-recipient' })
      .expect(200);

    // Get chat history and verify read receipt is tracked
    const historyResponse = await request(app.getHttpServer())
      .get('/chats/test-read-receipts/messages')
      .expect(200);

    const messages = historyResponse.body;
    const readMessage = messages.find((msg: any) => msg.id === messageId);
    
    expect(readMessage).toBeDefined();
    expect(readMessage).toHaveProperty('readBy');
    expect(readMessage.readBy).toContain('uuid-recipient');
    expect(readMessage.readBy['uuid-recipient']).toBeDefined();
  });
});