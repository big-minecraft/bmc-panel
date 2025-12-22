import SocketListener from '../../../../../shared/model/socket-listener';
import { Enum } from '../../../../../shared/enum/enum';
import { FileUploadProgress } from '../../../../../shared/types/socket/file-upload-progress';

export default class FileUploadProgressListener extends SocketListener<FileUploadProgress> {
    private readonly callback: (data: FileUploadProgress) => void;

    constructor(callback: (data: FileUploadProgress) => void) {
        super(Enum.SocketMessageType.FILE_UPLOAD_PROGRESS);
        this.callback = callback;
    }

    validateMessage(message: unknown): boolean {
        return (
            typeof message === 'object' &&
            message !== null &&
            'sessionId' in message &&
            'fileName' in message &&
            'currentChunk' in message &&
            'totalChunks' in message &&
            'percentComplete' in message
        );
    }

    onMessage(message: FileUploadProgress): void {
        this.callback(message);
    }
}