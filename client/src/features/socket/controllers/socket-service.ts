import ClientSocket from '../controllers/client-socket';

class SocketService {
    private static socket: ClientSocket | null = null;

    public static init(): void {
        if (!this.socket && typeof window !== 'undefined') {
            console.log('initializing socket service')
            SocketService.socket = new ClientSocket(window.location.origin);
            SocketService.socket.connect();
        }
    }

    public static disconnect(): void {
        if (SocketService.socket) {
            SocketService.socket.disconnect();
            SocketService.socket = null;
        }
    }

    public static getSocket(): ClientSocket | null {
        return SocketService.socket;
    }
}

export default SocketService;