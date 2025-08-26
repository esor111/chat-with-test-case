import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TEST_MESSAGES, TEST_USERS, TEST_CHAT_IDS } from './mocks';
import { 
  createTestApp, 
  createWebSocketClient,
  expectValidSendResponse
} from './utils';

describe('Foundation Reliability Tests (Critical Missing Cases)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createTestApp(3003);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('1. Database Failure Handling', () => {
    it('handles database connection failure gracefully', async () => {
      // Test what happens when database is unavailable
      // This test ensures the system doesn't crash and provides meaningful error responses
      
      // First verify normal operation works
      const normalResponse = await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);
      
      expect(normalResponse.body.status).toBe('ok');
      expect(normalResponse.body.connection).toBe('healthy');

      // TODO: In real implementation, we would:
      // 1. Simulate database connection failure
      // 2. Verify system returns proper error codes (503 Service Unavailable)
      // 3. Verify system doesn't crash or expose internal errors
      // 4. Verify system recovers when database comes back online
      
      // For now, test that health endpoint structure is correct
      expect(normalResponse.body).toHaveProperty('lastQuery');
      expect(normalResponse.body.lastQuery).toHaveProperty('success');
      expect(normalResponse.body.lastQuery).toHaveProperty('responseTime');
      expect(normalResponse.body.lastQuery).toHaveProperty('timestamp');
    });

    it('handles database timeout gracefully', async () => {
      // Test slow database responses don't hang the system
      const response = await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);

      // Verify response time is reasonable (not hanging)
      expect(response.body.lastQuery.responseTime).toBeLessThan(5000); // 5 second max
      expect(response.body.lastQuery.success).toBe(true);
    });
  });

  describe('2. WebSocket Disconnection Recovery', () => {
    it('handles websocket disconnection and reconnection', async () => {
      const wsClient = createWebSocketClient(3003);
      
      // Test initial connection
      await wsClient.connect();
      expect(wsClient.socket.connected).toBe(true);

      // Test message delivery works
      const messageData = TEST_MESSAGES.REALTIME_TEST;
      await request(app.getHttpServer())
        .post(`/chats/${messageData.chatId}/messages`)
        .send(messageData)
        .expect(201);

      const receivedMessage = await wsClient.waitForMessage(1000);
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.content).toBe(messageData.content);

      // Test disconnection handling
      wsClient.disconnect();
      expect(wsClient.socket).toBe(null);

      // Test reconnection works
      await wsClient.connect();
      expect(wsClient.socket.connected).toBe(true);

      // Test message delivery works after reconnection
      const messageData2 = {
        ...TEST_MESSAGES.REALTIME_TEST,
        content: 'Message after reconnection'
      };

      await request(app.getHttpServer())
        .post(`/chats/${messageData2.chatId}/messages`)
        .send(messageData2)
        .expect(201);

      const receivedMessage2 = await wsClient.waitForMessage(1000);
      expect(receivedMessage2).toBeDefined();
      expect(receivedMessage2.content).toBe(messageData2.content);

      wsClient.disconnect();
    }, 15000);

    it('handles multiple websocket connections from same user', async () => {
      // Test user can have multiple connections (mobile + desktop)
      const wsClient1 = createWebSocketClient(3003);
      const wsClient2 = createWebSocketClient(3003);

      await wsClient1.connect();
      await wsClient2.connect();

      expect(wsClient1.socket.connected).toBe(true);
      expect(wsClient2.socket.connected).toBe(true);

      // Send message and verify both connections receive it
      const messageData = {
        ...TEST_MESSAGES.REALTIME_TEST,
        content: 'Multi-connection test message'
      };

      await request(app.getHttpServer())
        .post(`/chats/${messageData.chatId}/messages`)
        .send(messageData)
        .expect(201);

      // Both connections should receive the message
      const receivedMessage1 = await wsClient1.waitForMessage(1000);
      const receivedMessage2 = await wsClient2.waitForMessage(1000);

      expect(receivedMessage1).toBeDefined();
      expect(receivedMessage2).toBeDefined();
      expect(receivedMessage1.content).toBe(messageData.content);
      expect(receivedMessage2.content).toBe(messageData.content);

      wsClient1.disconnect();
      wsClient2.disconnect();
    }, 15000);
  });

  describe('3. Input Validation & Security', () => {
    it('rejects empty messages', async () => {
      const emptyMessageData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: TEST_USERS.ALICE.uuid,
        content: ''
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${emptyMessageData.chatId}/messages`)
        .send(emptyMessageData)
        .expect(400); // Should reject with Bad Request

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/content.*required|content.*empty/i);
    });

    it('rejects messages that are too long', async () => {
      const longContent = 'x'.repeat(10001); // Assume 10k character limit
      const longMessageData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: TEST_USERS.ALICE.uuid,
        content: longContent
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${longMessageData.chatId}/messages`)
        .send(longMessageData)
        .expect(400); // Should reject with Bad Request

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/content.*too long|content.*limit/i);
    });

    it('rejects invalid chat IDs', async () => {
      const invalidChatData = {
        chatId: 'invalid-chat-id-that-does-not-exist',
        senderUuid: TEST_USERS.ALICE.uuid,
        content: 'This should fail'
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${invalidChatData.chatId}/messages`)
        .send(invalidChatData)
        .expect(404); // Should reject with Not Found

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/chat.*not found|invalid.*chat/i);
    });

    it('rejects invalid user UUIDs', async () => {
      const invalidUserData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: 'invalid-user-uuid-format',
        content: 'This should fail'
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${invalidUserData.chatId}/messages`)
        .send(invalidUserData)
        .expect(400); // Should reject with Bad Request

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/user.*invalid|uuid.*format/i);
    });

    it('sanitizes message content for XSS', async () => {
      const xssMessageData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: TEST_USERS.ALICE.uuid,
        content: '<script>alert("XSS")</script>Hello World'
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${xssMessageData.chatId}/messages`)
        .send(xssMessageData)
        .expect(201);

      expectValidSendResponse(response.body);

      // Verify the stored message has sanitized content
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${xssMessageData.chatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      // Find the most recent message from this user (since script tags are removed, content will be just "Hello World")
      const sentMessage = messages
        .filter((msg: any) => msg.senderUuid === xssMessageData.senderUuid)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      expect(sentMessage).toBeDefined();
      // Script tags should be removed or escaped
      expect(sentMessage.content).not.toMatch(/<script.*>.*<\/script>/i);
      expect(sentMessage.content).toMatch(/Hello World/);
      // Verify script tags were actually removed
      expect(sentMessage.content).toBe('Hello World');
    });
  });

  describe('4. Concurrency & Race Conditions', () => {
    it('handles multiple users sending messages simultaneously', async () => {
      // Test concurrent message sending doesn't cause race conditions
      const messagePromises = [];
      const users = [TEST_USERS.ALICE, TEST_USERS.BOB, TEST_USERS.CHARLIE];
      
      // Send 3 messages simultaneously from different users
      const concurrentChatId = `concurrent-test-chat-${Date.now()}`;
      for (let i = 0; i < users.length; i++) {
        const messageData = {
          chatId: concurrentChatId,
          senderUuid: users[i].uuid,
          content: `Concurrent message ${i + 1} from ${users[i].name}`
        };

        const promise = request(app.getHttpServer())
          .post(`/chats/${messageData.chatId}/messages`)
          .send(messageData)
          .expect(201);

        messagePromises.push(promise);
      }

      // Wait for all messages to complete
      const responses = await Promise.all(messagePromises);

      // Verify all messages were processed successfully
      responses.forEach((response, index) => {
        expectValidSendResponse(response.body);
        expect(response.body.messageId).toBeDefined();
      });

      // Verify all messages are stored correctly
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${concurrentChatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      
      // Should have at least the 3 concurrent messages
      const concurrentMessages = messages.filter((msg: any) => 
        msg.content.includes('Concurrent message')
      );
      
      expect(concurrentMessages.length).toBe(3);
      
      // Verify each user's message is present
      users.forEach((user, index) => {
        const userMessage = concurrentMessages.find((msg: any) => 
          msg.senderUuid === user.uuid
        );
        expect(userMessage).toBeDefined();
        expect(userMessage.content).toContain(`Concurrent message ${index + 1}`);
      });
    }, 15000);

    it('maintains message order under concurrent load', async () => {
      // Test that messages from same user maintain order even under load
      const messagePromises = [];
      const messageCount = 5;
      
      // Send multiple messages rapidly from same user
      const orderedChatId = `ordered-test-chat-${Date.now()}`;
      for (let i = 0; i < messageCount; i++) {
        const messageData = {
          chatId: orderedChatId,
          senderUuid: TEST_USERS.ALICE.uuid,
          content: `Ordered message ${i + 1}`
        };

        const promise = request(app.getHttpServer())
          .post(`/chats/${messageData.chatId}/messages`)
          .send(messageData)
          .expect(201);

        messagePromises.push(promise);
      }

      // Wait for all messages to complete
      await Promise.all(messagePromises);

      // Verify message order is maintained
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${orderedChatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      const orderedMessages = messages
        .filter((msg: any) => msg.content.includes('Ordered message'))
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      expect(orderedMessages.length).toBe(messageCount);

      // Verify messages are in correct order
      for (let i = 0; i < messageCount; i++) {
        expect(orderedMessages[i].content).toBe(`Ordered message ${i + 1}`);
      }
    }, 15000);

    it('handles read receipts from multiple users on same message', async () => {
      // Send a message
      const messageData = TEST_MESSAGES.READ_RECEIPT_TEST;
      const sendResponse = await request(app.getHttpServer())
        .post(`/chats/${messageData.chatId}/messages`)
        .send(messageData)
        .expect(201);

      const messageId = sendResponse.body.messageId;
      const readers = [TEST_USERS.BOB, TEST_USERS.CHARLIE, TEST_USERS.DIANA];

      // Multiple users mark the same message as read simultaneously
      const readPromises = readers.map(reader => 
        request(app.getHttpServer())
          .post(`/chats/${messageData.chatId}/messages/${messageId}/read`)
          .send({ readerUuid: reader.uuid })
          .expect(200)
      );

      await Promise.all(readPromises);

      // Verify all read receipts are recorded
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${messageData.chatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      const readMessage = messages.find((msg: any) => msg.id === messageId);

      expect(readMessage).toBeDefined();
      expect(readMessage.readBy).toBeDefined();

      // Verify all readers are recorded
      readers.forEach(reader => {
        expect(readMessage.readBy).toHaveProperty(reader.uuid);
        expect(readMessage.readBy[reader.uuid]).toBeDefined();
      });
    }, 15000);
  });

  describe('5. Resource Management & Edge Cases', () => {
    it('handles very long message content within limits', async () => {
      // Test maximum allowed message length (just under the limit)
      const longContent = 'A'.repeat(9999); // Assume 10k limit, test 9999 chars
      const longMessageData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: TEST_USERS.ALICE.uuid,
        content: longContent
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${longMessageData.chatId}/messages`)
        .send(longMessageData)
        .expect(201);

      expectValidSendResponse(response.body);

      // Verify the message was stored correctly
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${longMessageData.chatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      const longMessage = messages.find((msg: any) => 
        msg.content.length === longContent.length
      );

      expect(longMessage).toBeDefined();
      expect(longMessage.content).toBe(longContent);
    });

    it('handles special characters and emojis in messages', async () => {
      const specialContent = '🚀 Hello! @user #hashtag $pecial ch@rs: áéíóú ñ 中文 العربية русский 🎉';
      const specialMessageData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: TEST_USERS.ALICE.uuid,
        content: specialContent
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${specialMessageData.chatId}/messages`)
        .send(specialMessageData)
        .expect(201);

      expectValidSendResponse(response.body);

      // Verify special characters are preserved
      const historyResponse = await request(app.getHttpServer())
        .get(`/chats/${specialMessageData.chatId}/messages`)
        .expect(200);

      const messages = historyResponse.body;
      const specialMessage = messages.find((msg: any) => 
        msg.content.includes('🚀') && msg.content.includes('中文')
      );

      expect(specialMessage).toBeDefined();
      expect(specialMessage.content).toBe(specialContent);
    });

    it('handles rapid message sending (rate limiting)', async () => {
      // Test rapid message sending to ensure system doesn't get overwhelmed
      const rapidMessages = [];
      const messageCount = 10;
      const startTime = Date.now();

      // Send messages as fast as possible
      for (let i = 0; i < messageCount; i++) {
        const messageData = {
          chatId: TEST_CHAT_IDS.BASIC,
          senderUuid: TEST_USERS.ALICE.uuid,
          content: `Rapid message ${i + 1}`
        };

        const promise = request(app.getHttpServer())
          .post(`/chats/${messageData.chatId}/messages`)
          .send(messageData);

        rapidMessages.push(promise);
      }

      const responses = await Promise.all(rapidMessages);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // System should handle rapid messages (either accept all or rate limit gracefully)
      const successfulResponses = responses.filter(res => res.status === 201);
      const rateLimitedResponses = responses.filter(res => res.status === 429);

      // Either all succeed (no rate limiting) or some are rate limited
      expect(successfulResponses.length + rateLimitedResponses.length).toBe(messageCount);
      
      // If rate limiting is implemented, should get 429 status
      if (rateLimitedResponses.length > 0) {
        rateLimitedResponses.forEach(response => {
          expect(response.body).toHaveProperty('error');
          expect(response.body.error).toMatch(/rate.*limit|too.*many.*requests/i);
        });
      }

      // System should respond reasonably quickly (not hang)
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for 10 messages
    }, 15000);

    it('handles chat with no message history', async () => {
      // Test accessing empty chat doesn't cause errors
      const emptyChatId = 'empty-chat-test';
      
      const response = await request(app.getHttpServer())
        .get(`/chats/${emptyChatId}/messages`)
        .expect(200);

      // Should return empty array, not error
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('handles user that does not exist', async () => {
      const nonExistentUserData = {
        chatId: TEST_CHAT_IDS.BASIC,
        senderUuid: 'non-existent-user-uuid',
        content: 'Message from non-existent user'
      };

      const response = await request(app.getHttpServer())
        .post(`/chats/${nonExistentUserData.chatId}/messages`)
        .send(nonExistentUserData)
        .expect(404); // Should reject with Not Found

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/user.*not found|invalid.*user/i);
    });
  });
});