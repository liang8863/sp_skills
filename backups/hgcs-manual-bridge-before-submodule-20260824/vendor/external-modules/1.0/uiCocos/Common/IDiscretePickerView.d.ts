import type { Label, Node } from "cc";
/**
 * DiscretePicker View 接口
 *
 * 職責:提供離散選擇器 UI 元素訪問器
 */
export interface IDiscretePickerView {
    /**
     * 獲取根節點
     */
    getNode(): Node;
    /**
     * 獲取所有選項 Labels (包含上下的 "-" 佔位符)
     */
    getItemLabels(): Label[];
    /**
     * 獲取選項容器節點 (用於拖曳和定位)
     */
    getItemsContainer(): Node;
    /**
     * 獲取模板 Label 節點（用於動態複製）
     * 如果返回 null，則不支持動態創建
     */
    getTemplateLabelNode(): Node | null;
}
//# sourceMappingURL=IDiscretePickerView.d.ts.map