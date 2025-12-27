import SocketListener from '../../../../../shared/model/socket-listener';
import { Enum } from '../../../../../shared/enum/enum';
import { InstanceMetricsUpdate } from '../../../../../shared/types/socket/instance-metrics-update';

export default class InstanceMetricsListener extends SocketListener<InstanceMetricsUpdate> {
    private readonly callback: (data: InstanceMetricsUpdate) => void;

    constructor(callback: (data: InstanceMetricsUpdate) => void) {
        super(Enum.SocketMessageType.INSTANCE_METRICS_UPDATE);
        this.callback = callback;
    }

    validateMessage(message: unknown): boolean {
        return (
            typeof message === 'object' &&
            message !== null &&
            'podName' in message &&
            'deployment' in message &&
            'metrics' in message &&
            typeof (message as any).metrics === 'object' &&
            'cpu' in (message as any).metrics &&
            'memory' in (message as any).metrics &&
            'uptime' in (message as any).metrics &&
            'players' in (message as any).metrics
        );
    }

    onMessage(message: InstanceMetricsUpdate): void {
        this.callback(message);
    }
}
