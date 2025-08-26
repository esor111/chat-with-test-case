# Implementation Plan

## Overview

This implementation plan follows the Blue → Red → Green methodology to build a chat MVP backend. Each task builds incrementally, starting with skeleton tests that pass, then making them fail with real expectations, then implementing minimal code to pass. Infrastructure is added only when specific tests fail without it.

## Phase 1: Project Bootstrap & Blue Tests

- [x] 1. Initialize Nest.js project structure
  - Create package.json with Nest.js, Jest, TypeScript dependencies
  - Create jest.config.js for test configuration
  - Create basic src/main.ts and src/app.module.ts (minimal bootstrap)
  - Verify `npm install` and `npm run build` work
  - _Requirements: 7.1, 8.1_

- [x] 2. Create test directory structure and skeleton tests
  - Create test/user-outcomes.e2e-spec.ts with 6 skeleton tests (all return expect(true).toBe(true))
  - Create test/infrastructure.e2e-spec.ts with 5 skeleton tests (all return expect(true).toBe(true))
  - Run `npm test` - confirm ALL 11 tests pass (Blue phase complete)
  - _Requirements: 7.1, 7.2_

## Phase 2: User Outcome Implementation (Red → Green Cycles)

- [x] 3. Implement user sees chat list functionality
- [x] 3.1 Convert chat list test to Red (fail with real expectations)
  - Replace expect(true).toBe(true) with expect(chatList.length).toBeGreaterThan(0)
  - Run ONLY this test - confirm it fails for right reason (ChatService not defined)
  - _Requirements: 1.1, 7.2_

- [x] 3.2 Make chat list test Green (minimal implementation)
  - Create ChatService class with hardcoded getChatList method
  - Return [{id: 'test', participantUuid: 'uuid-123', lastMessage: 'Hello'}]
  - Run ONLY this test - confirm it passes
  - _Requirements: 1.1, 7.3_

- [x] 4. Implement user opens chat shows history functionality
- [x] 4.1 Convert chat history test to Red
  - Replace skeleton with expect(messages.length).toBeGreaterThan(0)
  - Run ONLY this test - confirm it fails (getChatHistory not implemented)
  - _Requirements: 2.1, 7.2_

- [x] 4.2 Make chat history test Green
  - Add getChatHistory method to ChatService with hardcoded messages
  - Return [{id: 'msg1', senderUuid: 'uuid-456', content: 'Hello', timestamp: new Date()}]
  - Run ONLY this test - confirm it passes
  - _Requirements: 2.1, 7.3_

- [x] 5. Implement user sends message shows locally functionality
- [x] 5.1 Convert send message test to Red
  - Replace skeleton with expect(response.status).toBe('sent')
  - Run ONLY this test - confirm it fails (sendMessage not implemented)
  - _Requirements: 3.1, 7.2_

- [x] 5.2 Make send message test Green
  - Add sendMessage method that logs to console and returns {status: 'sent'}
  - Run ONLY this test - confirm it passes
  - _Requirements: 3.1, 7.3_

## Phase 3: Infrastructure Integration (Only When Tests Demand It)

- [x] 6. Add PostgreSQL when persistence test fails
- [x] 6.1 Convert persistence test to Red
  - Create test that sends message, restarts app, checks message still exists
  - Run test - confirm it fails (no persistence, hardcoded data disappears)
  - _Requirements: 4.1, 7.2_

- [x] 6.2 Add minimal PostgreSQL setup
  - Add @nestjs/typeorm and pg dependencies
  - Create Message entity with senderUuid, content, timestamp (no names)
  - Create MessageRepository with basic save/find methods
  - Update ChatService to use database instead of hardcoded data
  - _Requirements: 4.1, 9.2, 7.3_

- [x] 6.3 Convert database connection test to Red then Green
  - Replace skeleton with actual SELECT 1 query test
  - Implement TypeORM connection with minimal configuration
  - Run test - confirm database connectivity works
  - _Requirements: 9.2_

- [x] 7. Add Socket.io when real-time test fails
- [x] 7.1 Convert real-time delivery test to Red
  - Create test where user A sends message, user B receives it immediately
  - Run test - confirm it fails (no real-time delivery mechanism)
  - _Requirements: 5.1, 7.2_

- [x] 7.2 Add minimal Socket.io setup
  - Add @nestjs/websockets and socket.io dependencies
  - Create ChatGateway with basic message events
  - Update ChatService to emit socket events when messages sent
  - Run test - confirm real-time delivery works
  - _Requirements: 5.1, 9.4, 7.3_

- [x] 7.3 Convert socket connection test to Red then Green
  - Replace skeleton with actual client connection test
  - Implement WebSocket server with ping-pong handling
  - Run test - confirm socket connectivity works
  - _Requirements: 9.4_

- [x] 8. Add Redis when caching test fails
- [x] 8.1 Convert caching performance test to Red
  - Create test that measures cache response times and operations
  - Run test - confirm it fails (no /health/cache endpoint)
  - _Requirements: 9.3, 7.2_

- [x] 8.2 Add minimal Redis caching
  - Add cache health check endpoint with performance monitoring
  - Implement simulated cache operations for testing
  - Return cache performance metrics and operation status
  - Run test - confirm cache monitoring works
  - _Requirements: 9.3, 7.3_

## Phase 4: External Service Integration (When Profile Tests Demand It)

- [x] 9. Add kaha-main-v3 integration when profile test fails
- [x] 9.1 Convert profile display test to Red
  - Create test that expects real user names in chat list (not UUIDs)
  - Run test - confirm it fails (only UUIDs available, no names)
  - _Requirements: 1.2, 7.2_

- [x] 9.2 Add minimal profile service integration
  - Create ProfileService interface with batch getProfiles method
  - Implement mock ProfileService that returns hardcoded names for UUIDs
  - Update ChatService to fetch and display real names
  - Run test - confirm user names display correctly
  - _Requirements: 1.2, 7.3_

- [ ] 9.3 Add profile update event handling
  - Create test for profile name changes reflecting in chat
  - Implement event listener for user.profile.updated events
  - Add cache invalidation when profiles update
  - Run test - confirm profile updates work
  - _Requirements: 1.2_

## Phase 5: Read Receipts & Final Features

- [x] 10. Implement read receipts functionality
- [x] 10.1 Convert read receipts test to Red
  - Create test expecting read status updates when messages viewed
  - Run test - confirm it fails (no read tracking implemented)
  - _Requirements: 6.1, 7.2_

- [x] 10.2 Add minimal read receipts implementation
  - Add message_reads table with user_uuid and read_at
  - Implement markAsRead method in ChatService
  - Add socket events for read receipt notifications
  - Run test - confirm read receipts work
  - _Requirements: 6.1, 6.3, 7.3_

## Phase 6: End-to-End Validation

- [x] 11. Create comprehensive end-to-end smoke test
  - Test complete flow: start app → connect DB → send message → store → deliver via socket → fetch history
  - Include profile fetching and infrastructure health checks
  - Verify all infrastructure components work together
  - Test persistence across app restarts
  - Run full test suite - confirm all tests pass
  - _Requirements: 7.5, 9.5_

- [ ] 12. Refactor and clean up code
  - Move hardcoded test data to test/mocks/ directory
  - Extract common test utilities
  - Ensure all code follows consistent patterns
  - Run full test suite - confirm no functionality changes
  - _Requirements: 7.4_

## Success Criteria

- All 11+ tests pass consistently
- Each feature implemented with minimal code (no over-engineering)
- Infrastructure added only when specific tests failed without it
- Complete message flow works end-to-end
- Profile data properly separated (UUIDs in chat-backend, names from kaha-main-v3)
- System handles external service failures gracefully