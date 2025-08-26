import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ChatService } from './chat.service';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
    // Set up the circular reference
    this.chatService.setChatGateway(this);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Method to emit messages to all connected clients
  emitMessage(message: any) {
    this.server.emit('message', message);
  }

  // Method to emit read receipts to all connected clients
  emitReadReceipt(readReceipt: any) {
    this.server.emit('read-receipt', readReceipt);
  }

  // Method to get WebSocket server health information
  getServerHealth() {
    try {
      if (!this.server || !this.server.engine) {
        return {
          isRunning: false,
          activeConnections: 0,
          error: 'Server not initialized'
        };
      }

      const activeConnections = this.server.engine.clientsCount || 0;
      
      return {
        isRunning: true,
        activeConnections: activeConnections,
        error: null
      };
    } catch (error) {
      return {
        isRunning: false,
        activeConnections: 0,
        error: error.message
      };
    }
  }
}