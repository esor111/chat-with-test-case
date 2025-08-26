import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
    TEST_USERS,
    TEST_CONVERSATIONS,
    TEST_CONVERSATION_PARTICIPANTS
} from './mocks';
import {
    createTestApp,
    expectValidConversation,
    expectValidConversationList,
    createDirectConversation,
    createGroupConversation,
    validateConversationCreation,
    expectConversationCreationError,
    expectDirectConversationRules,
    expectGroupConversationRules,
    addParticipantToConversation,
    removeParticipantFromConversation,
    canUserJoinConversation,
    canUserLeaveConversation
} from './utils';

// Mock Conversation Service for foundation testing
class MockConversationService {
    private conversations: Map<string, any> = new Map();
    private participants: Map<string, any[]> = new Map();

    async createConversation(type: 'direct' | 'group' | 'business', participantUuids: string[], options: any = {}): Promise<any> {
        // Validate conversation creation
        const validation = validateConversationCreation(type, participantUuids);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Create conversation based on type
        let conversation;
        if (type === 'direct') {
            conversation = createDirectConversation(participantUuids[0], participantUuids[1], options);
        } else if (type === 'group') {
            conversation = createGroupConversation(participantUuids, options.name, options);
        } else {
            throw new Error('Business conversations not implemented in this test');
        }

        // Store conversation and participants
        this.conversations.set(conversation.id, conversation);
        this.participants.set(conversation.id, participantUuids.map(uuid => ({
            conversationId: conversation.id,
            userUuid: uuid,
            joinedAt: new Date(),
            role: 'member',
            unreadCount: 0
        })));

        return conversation;
    }

    async addParticipant(conversationId: string, userUuid: string): Promise<any> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const joinCheck = canUserJoinConversation(conversation, userUuid);
        if (!joinCheck.canJoin) {
            throw new Error(joinCheck.reason);
        }

        const updatedConversation = addParticipantToConversation(conversation, userUuid);
        this.conversations.set(conversationId, updatedConversation);

        // Add participant record
        const currentParticipants = this.participants.get(conversationId) || [];
        currentParticipants.push({
            conversationId,
            userUuid,
            joinedAt: new Date(),
            role: 'member',
            unreadCount: 0
        });
        this.participants.set(conversationId, currentParticipants);

        return updatedConversation;
    }

    async removeParticipant(conversationId: string, userUuid: string): Promise<any> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        const leaveCheck = canUserLeaveConversation(conversation, userUuid);
        if (!leaveCheck.canLeave) {
            throw new Error(leaveCheck.reason);
        }

        const updatedConversation = removeParticipantFromConversation(conversation, userUuid);
        this.conversations.set(conversationId, updatedConversation);

        // Remove participant record
        const currentParticipants = this.participants.get(conversationId) || [];
        const filteredParticipants = currentParticipants.filter(p => p.userUuid !== userUuid);
        this.participants.set(conversationId, filteredParticipants);

        return updatedConversation;
    }

    async getConversation(conversationId: string): Promise<any> {
        return this.conversations.get(conversationId) || null;
    }

    async getParticipants(conversationId: string): Promise<any[]> {
        return this.participants.get(conversationId) || [];
    }

    // Permission validation methods
    async validateUserAccess(conversationId: string, userUuid: string): Promise<boolean> {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return false;
        }
        return conversation.participants.includes(userUuid);
    }

    async getConversationWithAccessControl(conversationId: string, userUuid: string): Promise<any> {
        const hasAccess = await this.validateUserAccess(conversationId, userUuid);
        if (!hasAccess) {
            throw new Error('Access denied: User is not a participant in this conversation');
        }
        return this.getConversation(conversationId);
    }

    async getConversationsForUser(userUuid: string): Promise<any[]> {
        const userConversations: any[] = [];
        for (const [conversationId, conversation] of this.conversations.entries()) {
            if (conversation.participants.includes(userUuid)) {
                userConversations.push(conversation);
            }
        }
        return userConversations;
    }

    async archiveConversation(conversationId: string, userUuid: string): Promise<any> {
        const hasAccess = await this.validateUserAccess(conversationId, userUuid);
        if (!hasAccess) {
            throw new Error('Access denied: User cannot archive conversation they do not participate in');
        }

        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Archive the conversation
        const archivedConversation = {
            ...conversation,
            archived: true,
            archivedAt: new Date(),
            archivedBy: userUuid
        };

        this.conversations.set(conversationId, archivedConversation);
        return archivedConversation;
    }

    async getArchivedConversation(conversationId: string, userUuid: string): Promise<any> {
        const conversation = await this.getConversationWithAccessControl(conversationId, userUuid);

        if (!conversation.archived) {
            throw new Error('Conversation is not archived');
        }

        return conversation;
    }

    async sendMessageWithAccessControl(conversationId: string, senderUuid: string, content: string): Promise<any> {
        const hasAccess = await this.validateUserAccess(conversationId, senderUuid);
        if (!hasAccess) {
            throw new Error('Access denied: User cannot send message to conversation they do not participate in');
        }

        const conversation = this.conversations.get(conversationId);
        if (conversation.archived) {
            throw new Error('Cannot send message to archived conversation');
        }

        // Mock message sending
        return {
            id: `msg-${Date.now()}`,
            conversationId,
            senderUuid,
            content,
            timestamp: new Date(),
            status: 'sent'
        };
    }
}

describe('Conversation Management Foundation', () => {
    let app: INestApplication;
    let mockConversationService: MockConversationService;

    beforeEach(async () => {
        app = await createTestApp(3004);
        mockConversationService = new MockConversationService();
    });

    afterEach(async () => {
        await app.close();
    });

    describe('Conversation Creation', () => {
        it('creates direct conversation with exactly 2 participants', async () => {
            // Test creating a valid direct conversation
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];

            const conversation = await mockConversationService.createConversation('direct', participants);

            // Validate conversation structure
            expectValidConversation(conversation);
            expectDirectConversationRules(conversation);

            // Verify participants
            expect(conversation.participants).toHaveLength(2);
            expect(conversation.participants).toContain(TEST_USERS.ALICE.uuid);
            expect(conversation.participants).toContain(TEST_USERS.BOB.uuid);

            // Verify conversation can be retrieved
            const retrieved = await mockConversationService.getConversation(conversation.id);
            expect(retrieved).toBeDefined();
            expect(retrieved.id).toBe(conversation.id);
        });

        it('creates group conversation with 2-8 participants', async () => {
            // Test minimum group size (2 participants)
            const minParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const minGroupConv = await mockConversationService.createConversation('group', minParticipants, { name: 'Min Group' });

            expectValidConversation(minGroupConv);
            expectGroupConversationRules(minGroupConv);
            expect(minGroupConv.participants).toHaveLength(2);
            expect(minGroupConv.name).toBe('Min Group');

            // Test maximum group size (8 participants)
            const maxParticipants = [
                TEST_USERS.ALICE.uuid,
                TEST_USERS.BOB.uuid,
                TEST_USERS.CHARLIE.uuid,
                TEST_USERS.DIANA.uuid,
                'uuid-user-5',
                'uuid-user-6',
                'uuid-user-7',
                'uuid-user-8'
            ];
            const maxGroupConv = await mockConversationService.createConversation('group', maxParticipants, { name: 'Max Group' });

            expectValidConversation(maxGroupConv);
            expectGroupConversationRules(maxGroupConv);
            expect(maxGroupConv.participants).toHaveLength(8);
            expect(maxGroupConv.name).toBe('Max Group');

            // Test mid-range group size (4 participants)
            const midParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid];
            const midGroupConv = await mockConversationService.createConversation('group', midParticipants, { name: 'Mid Group' });

            expectValidConversation(midGroupConv);
            expectGroupConversationRules(midGroupConv);
            expect(midGroupConv.participants).toHaveLength(4);
        });

        it('rejects group conversation with >8 participants', async () => {
            // Test with 9 participants (over limit)
            const tooManyParticipants = [
                TEST_USERS.ALICE.uuid,
                TEST_USERS.BOB.uuid,
                TEST_USERS.CHARLIE.uuid,
                TEST_USERS.DIANA.uuid,
                'uuid-user-5',
                'uuid-user-6',
                'uuid-user-7',
                'uuid-user-8',
                'uuid-user-9' // 9th participant - should be rejected
            ];

            await expect(
                mockConversationService.createConversation('group', tooManyParticipants, { name: 'Oversized Group' })
            ).rejects.toThrow('Group conversations cannot have more than 8 participants');

            // Verify validation function also catches this
            expectConversationCreationError('group', tooManyParticipants, 'more than 8 participants');
        });

        it('rejects direct conversation with ≠2 participants', async () => {
            // Test with 1 participant (too few)
            const tooFewParticipants = [TEST_USERS.ALICE.uuid];

            await expect(
                mockConversationService.createConversation('direct', tooFewParticipants)
            ).rejects.toThrow('Direct conversations must have exactly 2 participants');

            // Test with 3 participants (too many)
            const tooManyParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid];

            await expect(
                mockConversationService.createConversation('direct', tooManyParticipants)
            ).rejects.toThrow('Direct conversations must have exactly 2 participants');

            // Verify validation function catches both cases
            expectConversationCreationError('direct', tooFewParticipants, 'exactly 2 participants');
            expectConversationCreationError('direct', tooManyParticipants, 'exactly 2 participants');
        });
    });

    describe('Participant Management', () => {
        it('allows user to join existing group conversation', async () => {
            // Create initial group conversation with 3 participants
            const initialParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid];
            const conversation = await mockConversationService.createConversation('group', initialParticipants, { name: 'Test Group' });

            // Add a new participant
            const updatedConversation = await mockConversationService.addParticipant(conversation.id, TEST_USERS.DIANA.uuid);

            // Verify participant was added
            expect(updatedConversation.participants).toHaveLength(4);
            expect(updatedConversation.participants).toContain(TEST_USERS.DIANA.uuid);

            // Verify participant record was created
            const participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(4);

            const dianaParticipant = participants.find(p => p.userUuid === TEST_USERS.DIANA.uuid);
            expect(dianaParticipant).toBeDefined();
            expect(dianaParticipant.role).toBe('member');
            expect(dianaParticipant.unreadCount).toBe(0);
        });

        it('allows user to leave group conversation', async () => {
            // Create group conversation with 4 participants
            const initialParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid];
            const conversation = await mockConversationService.createConversation('group', initialParticipants, { name: 'Test Group' });

            // Remove a participant
            const updatedConversation = await mockConversationService.removeParticipant(conversation.id, TEST_USERS.DIANA.uuid);

            // Verify participant was removed
            expect(updatedConversation.participants).toHaveLength(3);
            expect(updatedConversation.participants).not.toContain(TEST_USERS.DIANA.uuid);

            // Verify participant record was removed
            const participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(3);

            const dianaParticipant = participants.find(p => p.userUuid === TEST_USERS.DIANA.uuid);
            expect(dianaParticipant).toBeUndefined();
        });

        it('prevents user from joining conversation twice', async () => {
            // Create group conversation
            const initialParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid];
            const conversation = await mockConversationService.createConversation('group', initialParticipants, { name: 'Test Group' });

            // Try to add existing participant
            await expect(
                mockConversationService.addParticipant(conversation.id, TEST_USERS.ALICE.uuid)
            ).rejects.toThrow('User is already a participant');

            // Verify conversation unchanged
            const unchangedConversation = await mockConversationService.getConversation(conversation.id);
            expect(unchangedConversation.participants).toHaveLength(3);
            expect(unchangedConversation.participants.filter(p => p === TEST_USERS.ALICE.uuid)).toHaveLength(1);
        });

        it('prevents adding participants to direct conversations', async () => {
            // Create direct conversation
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('direct', participants);

            // Try to add participant to direct conversation
            await expect(
                mockConversationService.addParticipant(conversation.id, TEST_USERS.CHARLIE.uuid)
            ).rejects.toThrow('Cannot join direct conversations');
        });

        it('prevents removing participants from direct conversations', async () => {
            // Create direct conversation
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('direct', participants);

            // Try to remove participant from direct conversation
            await expect(
                mockConversationService.removeParticipant(conversation.id, TEST_USERS.ALICE.uuid)
            ).rejects.toThrow('Cannot leave direct conversations');
        });

        it('prevents adding participants when group is at maximum capacity', async () => {
            // Create group conversation with maximum participants (8)
            const maxParticipants = [
                TEST_USERS.ALICE.uuid,
                TEST_USERS.BOB.uuid,
                TEST_USERS.CHARLIE.uuid,
                TEST_USERS.DIANA.uuid,
                'uuid-user-5',
                'uuid-user-6',
                'uuid-user-7',
                'uuid-user-8'
            ];
            const conversation = await mockConversationService.createConversation('group', maxParticipants, { name: 'Full Group' });

            // Try to add one more participant
            await expect(
                mockConversationService.addParticipant(conversation.id, 'uuid-user-9')
            ).rejects.toThrow('Group conversation is at maximum capacity');
        });

        it('manages conversation participant list correctly', async () => {
            // Create initial group conversation
            const initialParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('group', initialParticipants, { name: 'Participant List Test' });

            // Verify initial participant list
            let participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(2);
            expect(participants.map(p => p.userUuid)).toEqual(expect.arrayContaining([TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid]));

            // Add participants one by one and verify list updates
            await mockConversationService.addParticipant(conversation.id, TEST_USERS.CHARLIE.uuid);
            participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(3);
            expect(participants.map(p => p.userUuid)).toContain(TEST_USERS.CHARLIE.uuid);

            await mockConversationService.addParticipant(conversation.id, TEST_USERS.DIANA.uuid);
            participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(4);
            expect(participants.map(p => p.userUuid)).toContain(TEST_USERS.DIANA.uuid);

            // Verify participant metadata
            const charlieParticipant = participants.find(p => p.userUuid === TEST_USERS.CHARLIE.uuid);
            expect(charlieParticipant).toBeDefined();
            expect(charlieParticipant.role).toBe('member');
            expect(charlieParticipant.unreadCount).toBe(0);
            expect(charlieParticipant.joinedAt).toBeInstanceOf(Date);

            // Remove participants and verify list updates
            await mockConversationService.removeParticipant(conversation.id, TEST_USERS.CHARLIE.uuid);
            participants = await mockConversationService.getParticipants(conversation.id);
            expect(participants).toHaveLength(3);
            expect(participants.map(p => p.userUuid)).not.toContain(TEST_USERS.CHARLIE.uuid);

            // Verify conversation participant list is updated
            const updatedConversation = await mockConversationService.getConversation(conversation.id);
            expect(updatedConversation.participants).toHaveLength(3);
            expect(updatedConversation.participants).not.toContain(TEST_USERS.CHARLIE.uuid);
            expect(updatedConversation.participants).toContain(TEST_USERS.DIANA.uuid);
        });

        it('handles participant role management', async () => {
            // Create group conversation
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid];
            const conversation = await mockConversationService.createConversation('group', participants, { name: 'Role Test Group' });

            // Verify all participants have default 'member' role
            const participantList = await mockConversationService.getParticipants(conversation.id);
            expect(participantList).toHaveLength(3);

            participantList.forEach(participant => {
                expect(participant.role).toBe('member');
                expect(participant.unreadCount).toBe(0);
                expect(participant.conversationId).toBe(conversation.id);
                expect(participant.joinedAt).toBeInstanceOf(Date);
            });

            // Verify participant UUIDs are correct
            const participantUuids = participantList.map(p => p.userUuid);
            expect(participantUuids).toEqual(expect.arrayContaining([
                TEST_USERS.ALICE.uuid,
                TEST_USERS.BOB.uuid,
                TEST_USERS.CHARLIE.uuid
            ]));
        });

        it('maintains participant list consistency across operations', async () => {
            // Create conversation with multiple participants
            const initialParticipants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid];
            const conversation = await mockConversationService.createConversation('group', initialParticipants, { name: 'Consistency Test' });

            // Perform multiple add/remove operations
            await mockConversationService.addParticipant(conversation.id, 'uuid-user-5');
            await mockConversationService.removeParticipant(conversation.id, TEST_USERS.BOB.uuid);
            await mockConversationService.addParticipant(conversation.id, 'uuid-user-6');
            await mockConversationService.removeParticipant(conversation.id, TEST_USERS.DIANA.uuid);

            // Verify final state consistency
            const finalConversation = await mockConversationService.getConversation(conversation.id);
            const finalParticipants = await mockConversationService.getParticipants(conversation.id);

            // Both conversation.participants and participant list should match
            expect(finalConversation.participants).toHaveLength(finalParticipants.length);
            expect(finalConversation.participants).toEqual(expect.arrayContaining(
                finalParticipants.map(p => p.userUuid)
            ));

            // Verify expected final participants
            expect(finalConversation.participants).toEqual(expect.arrayContaining([
                TEST_USERS.ALICE.uuid,
                TEST_USERS.CHARLIE.uuid,
                'uuid-user-5',
                'uuid-user-6'
            ]));
            expect(finalConversation.participants).not.toContain(TEST_USERS.BOB.uuid);
            expect(finalConversation.participants).not.toContain(TEST_USERS.DIANA.uuid);
        });
    });

    describe('Access Control and Permissions', () => {
        it('validates user can only access conversations they participate in', async () => {
            // Create conversation with Alice and Bob
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('direct', participants);

            // Alice should have access
            const aliceAccess = await mockConversationService.validateUserAccess(conversation.id, TEST_USERS.ALICE.uuid);
            expect(aliceAccess).toBe(true);

            // Bob should have access
            const bobAccess = await mockConversationService.validateUserAccess(conversation.id, TEST_USERS.BOB.uuid);
            expect(bobAccess).toBe(true);

            // Charlie should NOT have access
            const charlieAccess = await mockConversationService.validateUserAccess(conversation.id, TEST_USERS.CHARLIE.uuid);
            expect(charlieAccess).toBe(false);

            // Alice can retrieve conversation
            const aliceConversation = await mockConversationService.getConversationWithAccessControl(conversation.id, TEST_USERS.ALICE.uuid);
            expect(aliceConversation).toBeDefined();
            expect(aliceConversation.id).toBe(conversation.id);

            // Charlie cannot retrieve conversation
            await expect(
                mockConversationService.getConversationWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid)
            ).rejects.toThrow('Access denied: User is not a participant in this conversation');
        });

        it('provides proper error responses for access control violations', async () => {
            // Create conversation with Alice and Bob
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('group', participants, { name: 'Private Group' });

            // Test conversation access denial
            await expect(
                mockConversationService.getConversationWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid)
            ).rejects.toThrow('Access denied: User is not a participant in this conversation');

            // Test message sending denial
            await expect(
                mockConversationService.sendMessageWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid, 'Unauthorized message')
            ).rejects.toThrow('Access denied: User cannot send message to conversation they do not participate in');

            // Test archiving denial
            await expect(
                mockConversationService.archiveConversation(conversation.id, TEST_USERS.CHARLIE.uuid)
            ).rejects.toThrow('Access denied: User cannot archive conversation they do not participate in');

            // Test non-existent conversation access
            await expect(
                mockConversationService.getConversationWithAccessControl('non-existent-id', TEST_USERS.ALICE.uuid)
            ).rejects.toThrow('Access denied: User is not a participant in this conversation');
        });

        it('handles conversation archiving and access restrictions', async () => {
            // Create conversation with Alice, Bob, and Charlie
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid];
            const conversation = await mockConversationService.createConversation('group', participants, { name: 'Archive Test Group' });

            // Alice can send message before archiving
            const message1 = await mockConversationService.sendMessageWithAccessControl(conversation.id, TEST_USERS.ALICE.uuid, 'Message before archive');
            expect(message1.status).toBe('sent');

            // Alice archives the conversation
            const archivedConversation = await mockConversationService.archiveConversation(conversation.id, TEST_USERS.ALICE.uuid);
            expect(archivedConversation.archived).toBe(true);
            expect(archivedConversation.archivedAt).toBeInstanceOf(Date);
            expect(archivedConversation.archivedBy).toBe(TEST_USERS.ALICE.uuid);

            // Cannot send messages to archived conversation
            await expect(
                mockConversationService.sendMessageWithAccessControl(conversation.id, TEST_USERS.BOB.uuid, 'Message after archive')
            ).rejects.toThrow('Cannot send message to archived conversation');

            // Can still access archived conversation if participant
            const retrievedArchived = await mockConversationService.getArchivedConversation(conversation.id, TEST_USERS.BOB.uuid);
            expect(retrievedArchived.archived).toBe(true);

            // Cannot access archived conversation if not participant
            await expect(
                mockConversationService.getArchivedConversation(conversation.id, TEST_USERS.DIANA.uuid)
            ).rejects.toThrow('Access denied: User is not a participant in this conversation');

            // Cannot access non-archived conversation as archived
            const activeConversation = await mockConversationService.createConversation('direct', [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid]);
            await expect(
                mockConversationService.getArchivedConversation(activeConversation.id, TEST_USERS.ALICE.uuid)
            ).rejects.toThrow('Conversation is not archived');
        });

        it('filters conversations correctly for user access', async () => {
            // Create multiple conversations with different participants
            const conv1 = await mockConversationService.createConversation('direct', [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid]);
            const conv2 = await mockConversationService.createConversation('group', [TEST_USERS.ALICE.uuid, TEST_USERS.CHARLIE.uuid], { name: 'Alice-Charlie Group' });
            const conv3 = await mockConversationService.createConversation('group', [TEST_USERS.BOB.uuid, TEST_USERS.CHARLIE.uuid, TEST_USERS.DIANA.uuid], { name: 'Bob-Charlie-Diana Group' });
            const conv4 = await mockConversationService.createConversation('direct', [TEST_USERS.ALICE.uuid, TEST_USERS.DIANA.uuid]);

            // Get conversations for Alice
            const aliceConversations = await mockConversationService.getConversationsForUser(TEST_USERS.ALICE.uuid);
            expect(aliceConversations).toHaveLength(3); // conv1, conv2, conv4
            const aliceConvIds = aliceConversations.map(c => c.id);
            expect(aliceConvIds).toContain(conv1.id);
            expect(aliceConvIds).toContain(conv2.id);
            expect(aliceConvIds).toContain(conv4.id);
            expect(aliceConvIds).not.toContain(conv3.id);

            // Get conversations for Bob
            const bobConversations = await mockConversationService.getConversationsForUser(TEST_USERS.BOB.uuid);
            expect(bobConversations).toHaveLength(2); // conv1, conv3
            const bobConvIds = bobConversations.map(c => c.id);
            expect(bobConvIds).toContain(conv1.id);
            expect(bobConvIds).toContain(conv3.id);
            expect(bobConvIds).not.toContain(conv2.id);
            expect(bobConvIds).not.toContain(conv4.id);

            // Get conversations for Charlie
            const charlieConversations = await mockConversationService.getConversationsForUser(TEST_USERS.CHARLIE.uuid);
            expect(charlieConversations).toHaveLength(2); // conv2, conv3
            const charlieConvIds = charlieConversations.map(c => c.id);
            expect(charlieConvIds).toContain(conv2.id);
            expect(charlieConvIds).toContain(conv3.id);
            expect(charlieConvIds).not.toContain(conv1.id);
            expect(charlieConvIds).not.toContain(conv4.id);

            // Get conversations for Diana
            const dianaConversations = await mockConversationService.getConversationsForUser(TEST_USERS.DIANA.uuid);
            expect(dianaConversations).toHaveLength(2); // conv3, conv4
            const dianaConvIds = dianaConversations.map(c => c.id);
            expect(dianaConvIds).toContain(conv3.id);
            expect(dianaConvIds).toContain(conv4.id);
            expect(dianaConvIds).not.toContain(conv1.id);
            expect(dianaConvIds).not.toContain(conv2.id);
        });

        it('validates access control for participant management operations', async () => {
            // Create conversation with Alice and Bob
            const participants = [TEST_USERS.ALICE.uuid, TEST_USERS.BOB.uuid];
            const conversation = await mockConversationService.createConversation('group', participants, { name: 'Access Control Test' });

            // Participants can add other users (this is allowed in our current implementation)
            await mockConversationService.addParticipant(conversation.id, TEST_USERS.CHARLIE.uuid);

            // Verify Charlie was added and now has access
            const charlieAccess = await mockConversationService.validateUserAccess(conversation.id, TEST_USERS.CHARLIE.uuid);
            expect(charlieAccess).toBe(true);

            // Charlie can now access the conversation
            const charlieConversation = await mockConversationService.getConversationWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid);
            expect(charlieConversation).toBeDefined();

            // Charlie can send messages
            const charlieMessage = await mockConversationService.sendMessageWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid, 'Hello from Charlie');
            expect(charlieMessage.senderUuid).toBe(TEST_USERS.CHARLIE.uuid);

            // Remove Charlie from conversation
            await mockConversationService.removeParticipant(conversation.id, TEST_USERS.CHARLIE.uuid);

            // Charlie no longer has access
            const charlieAccessAfterRemoval = await mockConversationService.validateUserAccess(conversation.id, TEST_USERS.CHARLIE.uuid);
            expect(charlieAccessAfterRemoval).toBe(false);

            // Charlie cannot access conversation after removal
            await expect(
                mockConversationService.getConversationWithAccessControl(conversation.id, TEST_USERS.CHARLIE.uuid)
            ).rejects.toThrow('Access denied: User is not a participant in this conversation');
        });
    });
});