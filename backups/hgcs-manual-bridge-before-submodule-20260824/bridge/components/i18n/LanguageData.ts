import { director } from 'cc';

export let _language = 'en';

export let ready: boolean = false;

/**
 * 初始化
 * @param language
 */
export function init(language: string) {
    ready = true;
    _language = language;
}

/**
 * 翻译数据
 * @param key
 */
export function t(key: string) {
    const win: any = window;

    if (!win.languages) {
        return key;
    }
    const searcher = key.split('.');

    let data = win.languages[_language];
    for (let i = 0; i < searcher.length; i++) {
        data = data[searcher[i]];
        if (!data) {
            return '';
        }
    }
    return data || '';
}

export function updateSceneRenderers() {
    const rootNodes = director.getScene()!.children;
    // walk all nodes with localize label and update
    const allLocalizedLabels: any[] = [];
    for (let i = 0; i < rootNodes.length; ++i) {
        const labels = rootNodes[i].getComponentsInChildren('LocalizedLabel');
        Array.prototype.push.apply(allLocalizedLabels, labels);
    }
    for (let i = 0; i < allLocalizedLabels.length; ++i) {
        const label = allLocalizedLabels[i];
        if(!label.node.active)continue;
        label.updateLabel();
    }
    // walk all nodes with localize sprite and update
    const allLocalizedSprites: any[] = [];
    for (let i = 0; i < rootNodes.length; ++i) {
        const sprites = rootNodes[i].getComponentsInChildren('LocalizedSprite');
        Array.prototype.push.apply(allLocalizedSprites, sprites);
    }
    for (let i = 0; i < allLocalizedSprites.length; ++i) {
        const sprite = allLocalizedSprites[i];
        if(!sprite.node.active)continue;
        sprite.updateSprite();
    }
    // walk all nodes with localize spine and update
    const allLocalizedSpines: any[] = [];
    for (let i = 0; i < rootNodes.length; ++i) {
        const spines = rootNodes[i].getComponentsInChildren('LocalizedSpine');
        Array.prototype.push.apply(allLocalizedSpines, spines);
    }
    for (let i = 0; i < allLocalizedSpines.length; ++i) {
        const spine = allLocalizedSpines[i];
        if(!spine.node.active)continue;
        spine.updateSpine();
    }
}

// 供插件查询当前语言使用
const win = window as any;
win._languageData = {
    get language() {
        return _language;
    },
    init(lang: string) {
        init(lang);
    },
    updateSceneRenderers() {
        updateSceneRenderers();
    },
};
