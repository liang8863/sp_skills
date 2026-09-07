import * as i18n from './LanguageData';

import { _decorator, Component } from 'cc';
import { sp } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('LocalizedSpineItem')
class LocalizedSpineItem {
    @property
    language: string = 'en';
    @property({
        type: sp.SkeletonData,
    })
    skeletonData: sp.SkeletonData | null = null;
}

@ccclass('LocalizedSpine')
@executeInEditMode
export class LocalizedSpine extends Component {
    skeleton: sp.Skeleton | null = null;

    @property({
        type: [LocalizedSpineItem],
    })
    spineList: LocalizedSpineItem[] = [];

    onLoad() {
        if (!i18n.ready) {
            i18n.init('en');
        }
        this.fetchRender();
    }

    fetchRender() {
        if (this.skeleton === null) {
            const skeleton = this.getComponent(sp.Skeleton);
            if (skeleton) {
                this.skeleton = skeleton;
                this.updateSpine();
                return;
            }
        }
    }

    updateSpine() {
        if (this.skeleton === null) {
            this.fetchRender();
            return;
        }

        for (let i = 0; i < this.spineList.length; i++) {
            const item = this.spineList[i];
            if (item.language === i18n._language) {
                if (item.skeletonData) {
                    this.skeleton.skeletonData = item.skeletonData;
                }
                break;
            }
        }
    }
}
