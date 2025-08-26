# Chat MVP Backend - Test-Driven Development

A chat system backend built using the Blue → Red → Green test-driven methodology with Nest.js, following the principle: **"Build ONLY what makes tests pass"**.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm

### Installation
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```
**Expected Output**: All 11 tests should pass (1 real + 10 skeleton tests)

### Run Specific Test Suites
```bash
# Run only user outcome tests
npm test test/user-outcomes.e2e-spec.ts

# Run only infrastructure tests  
npm test test/infrastructure.e2e-spec.ts
```

### Run Individual Tests
```bash
# Run specific test by name
npm test -- --testNamePattern="user sees chat list"

# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

## 📊 Current Test Status

### ✅ User Outcome Tests (6 total)
| Test Name | Status | Implementation |
|-----------|--------|----------------|
| `user sees chat list` | ✅ **REAL** | Hardcoded chat array via `GET /chats` |
| `user opens chat shows history` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `user sends message shows locally` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `message persists across sessions` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `recipient receives in real time` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `read receipts update correctly` | 🔵 **SKELETON** | `expect(true).toBe(true)` |

### 🔵 Infrastructure Tests (5 total)
| Test Name | Status | Implementation |
|-----------|--------|----------------|
| `nest app boots` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `postgres connection works` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `redis ping pong` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `socket client connects` | 🔵 **SKELETON** | `expect(true).toBe(true)` |
| `end to end message flow` | 🔵 **SKELETON** | `expect(true).toBe(true)` |

## 🎯 Test-Driven Development Process

### Blue → Red → Green Methodology

#### 🔵 **Blue Phase** (Skeleton Tests)
- All tests return `expect(true).toBe(true)`
- Purpose: Validate test structure works
- **Status**: ✅ Complete (11/11 tests pass)

#### ❌ **Red Phase** (Make Tests Fail)
- Replace skeleton with real expectations
- Tests should fail for the RIGHT reason
- Example: `expect(chatList.length).toBeGreaterThan(0)`

#### ✅ **Green Phase** (Minimal Implementation)
- Write dumbest possible code to make test pass
- No over-engineering, no "just in case" features
- Example: Return hardcoded data

## 🔍 Test Examples

### Example 1: Chat List Test (REAL)
```typescript
it('user sees chat list', async () => {
  const response = await request(app.getHttpServer())
    .get('/chats')
    .expect(200);
  
  const chatList = response.body;
  expect(chatList.length).toBeGreaterThan(0);
  expect(chatList[0]).toHaveProperty('id');
  expect(chatList[0]).toHaveProperty('participantUuid');
  expect(chatList[0]).toHaveProperty('lastMessage');
});
```

### Example 2: Skeleton Test (BLUE)
```typescript
it('user opens chat shows history', () => {
  // Blue phase: skeleton test that passes
  expect(true).toBe(true);
});
```

## 🛠️ Development Commands

### Testing Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm test test/user-outcomes.e2e-spec.ts

# Run specific test by name
npm test -- --testNamePattern="user sees chat list"

# Debug tests
npm run test:debug
```

### Development Commands
```bash
# Start development server
npm run start:dev

# Build project
npm run build

# Start production server
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format
```

## 🏗️ Current Architecture

### API Endpoints
- `GET /` - Health check (returns "Hello World!")
- `GET /health` - Health status (returns `{"status": "ok"}`)
- `GET /chats` - **IMPLEMENTED** - Returns hardcoded chat list

### File Structure
```
src/
├── app.controller.ts    # Main app controller
├── app.service.ts       # Main app service  
├── app.module.ts        # Root module
├── chat.controller.ts   # Chat endpoints
├── chat.service.ts      # Chat business logic
└── main.ts             # Application bootstrap

test/
├── user-outcomes.e2e-spec.ts      # User-facing feature tests
├── infrastructure.e2e-spec.ts     # Infrastructure connection tests
└── jest-e2e.json                  # E2E test configuration
```

## 🎯 Next Steps

### Immediate Next Test (Red → Green)
Convert `user opens chat shows history` from skeleton to real test:

1. **Red Phase**: Replace `expect(true).toBe(true)` with real expectations
2. **Green Phase**: Implement minimal `GET /chats/:id/messages` endpoint
3. **Verify**: Ensure test passes with hardcoded message data

### Infrastructure Integration (Later)
Infrastructure will be added ONLY when tests fail without it:
- **PostgreSQL**: When `message persists across sessions` test fails
- **Socket.io**: When `recipient receives in real time` test fails  
- **Redis**: When performance tests fail

## 🚫 What We DON'T Have Yet (By Design)
- ❌ Database connections (PostgreSQL)
- ❌ Real-time messaging (Socket.io)
- ❌ Caching layer (Redis)
- ❌ Authentication/Authorization
- ❌ Input validation
- ❌ Error handling

**Why?** Because no test has failed demanding these features yet!

## 📈 Success Metrics
- ✅ All tests pass consistently
- ✅ Each feature has minimal implementation
- ✅ No code exists without a failing test that demanded it
- ✅ Infrastructure added only when specific tests fail

---

**Philosophy**: *"Never build infrastructure before a test fails because it's missing. Always ask: 'Which test would break if I didn't add this?'"*