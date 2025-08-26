export interface WebSocketTestClient {
  socket: any;
  receivedMessages: any[];
  receivedReadReceipts: any[];
  connect(): Promise<void>;
  disconnect(): void;
  waitForMessage(timeout?: number): Promise<any>;
  waitForReadReceipt(timeout?: number): Promise<any>;
}

export function createWebSocketClient(port: number): WebSocketTestClient {
  const io = require('socket.io-client');
  
  const client: WebSocketTestClient = {
    socket: null,
    receivedMessages: [],
    receivedReadReceipts: [],
    
    async connect(): Promise<void> {
      this.socket = io(`http://localhost:${port}`, {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('message', (message: any) => {
        this.receivedMessages.push(message);
      });

      this.socket.on('read-receipt', (receipt: any) => {
        this.receivedReadReceipts.push(receipt);
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        this.socket.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    },

    disconnect(): void {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },

    async waitForMessage(timeout: number = 1000): Promise<any> {
      return new Promise((resolve) => {
        const checkMessage = () => {
          if (this.receivedMessages.length > 0) {
            resolve(this.receivedMessages[this.receivedMessages.length - 1]);
          } else {
            setTimeout(checkMessage, 100);
          }
        };
        setTimeout(() => resolve(null), timeout);
        checkMessage();
      });
    },

    async waitForReadReceipt(timeout: number = 1000): Promise<any> {
      return new Promise((resolve) => {
        const checkReceipt = () => {
          if (this.receivedReadReceipts.length > 0) {
            resolve(this.receivedReadReceipts[this.receivedReadReceipts.length - 1]);
          } else {
            setTimeout(checkReceipt, 100);
          }
        };
        setTimeout(() => resolve(null), timeout);
        checkReceipt();
      });
    }
  };

  return client;
}