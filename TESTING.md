# Testing Guide - Chat MVP Backend

## 🧪 Complete Testing Reference

### Quick Test Commands

```bash
# Run all tests (should show 11 passing)
npm test

# Run with detailed output
npm test -- --verbose

# Run specific test file
npm test test/user-outcomes.e2e-spec.ts
npm test test/infrastructure.e2e-spec.ts

# Run single test by name
npm test -- --testNamePattern="user sees chat list"

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:cov
```

## 📊 Understanding Test Output

### Successful Test Run
```bash
$ npm test

 PASS  test/infrastructure.e2e-spec.ts (11.905 s)
 PASS  test/user-outcomes.e2e-spec.ts (12.185 s)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        13.649 s
```

### Failed Test Example
```bash
$ npm test -- --testNamePattern="user sees chat list"

 FAIL  test/user-outcomes.e2e-spec.ts
  ● User Outcomes › user sees chat list

    expected 200 "OK", got 404 "Not Found"

      24 |     const response = await request(app.getHttpServer())
      25 |       .get('/chats')
    > 26 |       .expect(200);
         |        ^
```

## 🎯 Test Categories Explained

### 1. User Outcome Tests (`test/user-outcomes.e2e-spec.ts`)
**Purpose**: Test what users actually see and do

| Test | What It Validates | Current Status |
|------|------------------|----------------|
| `user sees chat list` | GET /chats returns chat array | ✅ **IMPLEMENTED** |
| `user opens chat shows history` | GET /chats/:id/messages works | 🔵 Skeleton |
| `user sends message shows locally` | POST /chats/:id/messages works | 🔵 Skeleton |
| `message persists across sessions` | Data survives app restart | 🔵 Skeleton |
| `recipient receives in real time` | WebSocket message delivery | 🔵 Skeleton |
| `read receipts update correctly` | Read status tracking | 🔵 Skeleton |

### 2. Infrastructure Tests (`test/infrastructure.e2e-spec.ts`)
**Purpose**: Test system components work

| Test | What It Validates | Current Status |
|------|------------------|----------------|
| `nest app boots` | Application starts successfully | 🔵 Skeleton |
| `postgres connection works` | Database connectivity | 🔵 Skeleton |
| `redis ping pong` | Cache connectivity | 🔵 Skeleton |
| `socket client connects` | WebSocket connectivity | 🔵 Skeleton |
| `end to end message flow` | Complete system integration | 🔵 Skeleton |

## 🔄 Test Development Workflow

### Phase 1: Blue (Skeleton) ✅ COMPLETE
All tests return `expect(true).toBe(true)` and pass.

### Phase 2: Red → Green (Current)
Convert tests one by one:

#### Step 1: Make Test Red (Fail)
```typescript
// BEFORE (Blue)
it('user opens chat shows history', () => {
  expect(true).toBe(true);
});

// AFTER (Red) - This should FAIL
it('user opens chat shows history', async () => {
  const response = await request(app.getHttpServer())
    .get('/chats/test-chat-1/messages')
    .expect(200);
  
  const messages = response.body;
  expect(messages.length).toBeGreaterThan(0);
});
```

#### Step 2: Make Test Green (Pass)
Implement minimal code to pass the test:
```typescript
// Add to ChatController
@Get(':chatId/messages')
async getChatHistory(@Param('chatId') chatId: string) {
  return [
    {
      id: 'msg-1',
      senderUuid: 'uuid-456',
      content: 'Hello!',
      timestamp: new Date()
    }
  ];
}
```

## 🔍 Debugging Tests

### Common Issues and Solutions

#### Issue: Test Timeout
```bash
Timeout - Async callback was not invoked within the 5000 ms timeout
```
**Solution**: Increase timeout or check for hanging promises
```typescript
it('test name', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

#### Issue: Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill existing processes or use different port
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in test
app.listen(3001);
```

#### Issue: Module Not Found
```bash
Cannot resolve dependency ChatService
```
**Solution**: Add service to AppModule providers
```typescript
@Module({
  providers: [AppService, ChatService], // Add here
})
```

## 📈 Test Metrics

### Current Status
- **Total Tests**: 11
- **Passing**: 11 (100%)
- **Real Tests**: 1 (`user sees chat list`)
- **Skeleton Tests**: 10
- **Coverage**: Minimal (only chat list endpoint)

### Success Criteria
- ✅ All tests pass consistently
- ✅ No test exists without corresponding implementation
- ✅ No implementation exists without a failing test that demanded it

## 🚀 Running Tests in Different Environments

### Local Development
```bash
npm test
```

### CI/CD Pipeline
```bash
npm ci
npm run build
npm test
```

### Docker (Future)
```bash
docker build -t chat-mvp .
docker run chat-mvp npm test
```

## 🎯 Next Test to Implement

### Target: `user opens chat shows history`

#### 1. Convert to Red (should fail)
```typescript
it('user opens chat shows history', async () => {
  const response = await request(app.getHttpServer())
    .get('/chats/test-chat-1/messages')
    .expect(200);
  
  const messages = response.body;
  expect(messages.length).toBeGreaterThan(0);
  expect(messages[0]).toHaveProperty('id');
  expect(messages[0]).toHaveProperty('senderUuid');
  expect(messages[0]).toHaveProperty('content');
});
```

#### 2. Run Test (should fail with 404)
```bash
npm test -- --testNamePattern="user opens chat shows history"
```

#### 3. Implement Green (minimal code)
Add endpoint to ChatController with hardcoded response.

## 💡 Pro Tips

### Efficient Test Development
```bash
# Work on single test at a time
npm test -- --testNamePattern="specific test name"

# Use watch mode for rapid feedback
npm run test:watch

# Check coverage to ensure no dead code
npm run test:cov
```

### Test Naming Convention
- Use descriptive names that match user actions
- Start with what the user does: "user sees...", "user sends..."
- Avoid technical jargon in test names

### Debugging Strategy
1. Run single test in isolation
2. Add console.log statements in test
3. Check network requests with supertest
4. Verify module imports and providers

---

**Remember**: We only implement what failing tests demand. No infrastructure until a test screams for it! 🎯