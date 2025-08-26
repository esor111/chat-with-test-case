export function expectHealthyResponse(healthResponse: any) {
  expect(healthResponse.status).toBe('ok');
}

export function expectDatabaseHealth(dbHealth: any) {
  expectHealthyResponse(dbHealth);
  expect(dbHealth.connection).toBe('healthy');
  expect(dbHealth.lastQuery.success).toBe(true);
  expect(dbHealth.lastQuery).toHaveProperty('timestamp');
}

export function expectWebSocketHealth(wsHealth: any) {
  expectHealthyResponse(wsHealth);
  expect(wsHealth.server).toBe('running');
  expect(wsHealth).toHaveProperty('uptime');
}

export function expectCacheHealth(cacheHealth: any) {
  expectHealthyResponse(cacheHealth);
  expect(cacheHealth.connection).toBe('healthy');
  expect(cacheHealth.performance).toHaveProperty('pingTime');
  expect(cacheHealth.operations.set.success).toBe(true);
  expect(cacheHealth.operations.get.success).toBe(true);
}

export function expectValidChatList(chatList: any[]) {
  expect(chatList.length).toBeGreaterThan(0);
  expect(chatList[0]).toHaveProperty('id');
  expect(chatList[0]).toHaveProperty('participantUuid');
  expect(chatList[0]).toHaveProperty('participantName');
  expect(chatList[0]).toHaveProperty('lastMessage');
}

export function expectValidMessage(message: any) {
  expect(message).toHaveProperty('id');
  expect(message).toHaveProperty('senderUuid');
  expect(message).toHaveProperty('content');
  expect(message).toHaveProperty('timestamp');
}

export function expectValidSendResponse(response: any) {
  expect(response.status).toBe('sent');
  expect(response.messageId).toBeDefined();
}

export function expectValidReadReceiptResponse(response: any) {
  expect(response.status).toBe('read');
}