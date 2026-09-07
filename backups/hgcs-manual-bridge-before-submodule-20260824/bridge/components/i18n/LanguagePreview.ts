import * as i18n from './LanguageData';

import { _decorator, Component, Enum } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/**
 * 支援的语言列表
 */
const LanguageEnum = Enum({
    en: 0,
    zh: 1,
});

/**
 * 语言预览组件
 *
 * 用于在编辑器中切换语言预览。
 * 将此组件拖到场景中任一节点，即可在属性面板切换语言。
 *
 * 使用方式：
 * 1. 在场景中建立一个空节点（如 LanguageManager）
 * 2. 将此组件挂载到该节点
 * 3. 在属性面板的 Language 下拉选单切换语言
 */
@ccclass('LanguagePreview')
@executeInEditMode
export class LanguagePreview extends Component {

    @property({ visible: false })
    private _languageIndex: number = 0;

    @property({
        type: LanguageEnum,
        displayName: 'Language',
        tooltip: '选择预览语言 / Select preview language',
    })
    get language(): number {
        return this._languageIndex;
    }
    set language(value: number) {
        this._languageIndex = value;
        const langCode = this.getLanguageCode(value);
        i18n.init(langCode);
        i18n.updateSceneRenderers();
    }

    private getLanguageCode(index: number): string {
        switch (index) {
            case LanguageEnum.en:
                return 'en';
            case LanguageEnum.zh:
                return 'zh';
            default:
                return 'en';
        }
    }

    onLoad() {
        // 确保 i18n 已初始化
        if (!i18n.ready) {
            const langCode = this.getLanguageCode(this._languageIndex);
            i18n.init(langCode);
        }
    }
}
