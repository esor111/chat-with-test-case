import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async getChatList() {
    // Hardcoded user ID for now - minimal implementation
    return await this.chatService.getChatList('user-123');
  }
}