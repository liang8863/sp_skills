import { Asset, Constructor } from "cc";
export interface IContentConfig {
    name: string;
    assetType?: Constructor<Asset>;
}
export type ContentEntry = IContentConfig;
export interface IBundleConfig {
    bundleName: string;
    contentNames: ContentEntry[];
}
export interface IBundle {
    bundleName: string;
    asset: any;
}
export interface IBundleManager {
    loadBundle(bundleConfigs: IBundleConfig[]): Promise<IBundle[] | null>;
}
//# sourceMappingURL=IBundleManager.d.ts.map