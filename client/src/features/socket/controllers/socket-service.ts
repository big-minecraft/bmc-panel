import ClientSocket from '../controllers/client-socket';
import HandshakeListener from '../listeners/handshake-listener';
import FileSyncListener from "../listeners/file-sync-listener";

class SocketService {
    private static socket: ClientSocket | null = null;

    public static init(): void {
        if (!this.socket && typeof window !== 'undefined') {
            console.log('initializing socket service')
            SocketService.socket = new ClientSocket(window.location.origin);
            SocketService.registerListeners();
            SocketService.socket.connect();
        }
    }

    private static registerListeners(): void {
        if (this.socket) {
            console.log('registering socket listeners');
            this.socket.registerCustomListener(new HandshakeListener());
            this.socket.registerCustomListener(new FileSyncListener());
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