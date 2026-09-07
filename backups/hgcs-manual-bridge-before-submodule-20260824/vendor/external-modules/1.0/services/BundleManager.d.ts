import { IBundleManager, IBundleConfig, IBundle } from "./IBundleManager";
import { ILogger } from "../core/Logger/ILogger";
import { IEventSystem } from "../core/EventSystem/IEventSystem";
export declare class Bundle implements IBundle {
    bundleName: string;
    asset: any;
    constructor(bundleName: string, asset: any);
}
export declare class BundleManager implements IBundleManager {
    private logger;
    private events;
    constructor(logger: ILogger, events: IEventSystem);
    loadBundle(bundleConfigs: IBundleConfig[]): Promise<IBundle[] | null>;
}
//# sourceMappingURL=BundleManager.d.ts.map