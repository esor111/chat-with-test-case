// Export all test utilities for easy importing
export * from './test-app.util';
export * from './websocket.util';
export * from './assertions.util';
export * from './conversation.util';
export * from './business-chat.util';
export * from './profile.util';
export * from './presence.util';

// Advanced features utilities (to be implemented)
export function expectValidUnreadCount(unreadCount: any): void {
  expect(unreadCount).toBeDefined();
  expect(typeof unreadCount).toBe('number');
  expect(unreadCount).toBeGreaterThanOrEqual(0);
}

export function expectValidMessageManagement(messageOp: any): void {
  expect(messageOp).toBeDefined();
  expect(messageOp).toHaveProperty('success');
  expect(typeof messageOp.success).toBe('boolean');
}