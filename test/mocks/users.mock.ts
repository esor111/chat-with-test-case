export interface TestUser {
  uuid: string;
  name: string;
}

export const TEST_USERS = {
  ALICE: { uuid: 'uuid-123', name: 'Alice Johnson' },
  BOB: { uuid: 'uuid-456', name: 'Bob Smith' },
  CHARLIE: { uuid: 'uuid-sender', name: 'Charlie Brown' },
  DIANA: { uuid: 'uuid-recipient', name: 'Diana Prince' },
  EVE: { uuid: 'uuid-persistence-test', name: 'Eve Wilson' }
} as const;

export const TEST_USER_LIST = Object.values(TEST_USERS);

export function getUserByUuid(uuid: string): TestUser | undefined {
  return TEST_USER_LIST.find(user => user.uuid === uuid);
}

export function getUserName(uuid: string): string {
  const user = getUserByUuid(uuid);
  return user ? user.name : `User ${uuid.slice(-3)}`;
}