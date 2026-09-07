import {
  _decorator,
  assetManager,
  CCInteger,
  director,
  Director,
  Enum,
  NodeEventType,
  SpriteAtlas,
  SpriteFrame,
  UITransform,
  UIRenderer,
  Vec2,
} from "cc";
import { EDITOR, JSB } from "cc/env";
enum SizeMode {
  CUSTOM,
  TRIMMED,
  RAW,
}
const { ccclass, property } = _decorator;
@ccclass("Corner")
class Corner {
  @property({ displayName: "↙ 左下" })
  leftBottom: boolean = true;
  @property({ displayName: "↘ 右下" })
  rightBottom: boolean = true;
  @property({ displayName: "↖ 左上" })
  leftTop: boolean = true;
  @property({ displayName: "↗ 右上" })
  rightTop: boolean = true;
  visible: boolean[] = null;
}
@ccclass
class RoundBox extends UIRenderer {
  @property({
    displayName: "图集",
    type: SpriteAtlas,
    readonly: true,
    editorOnly: true,
    serializable: false,
  })
  private atlas: SpriteAtlas = null;
  @property
  private _spriteFrame: SpriteFrame = null;
  @property({ displayName: "纹理/图集帧", type: SpriteFrame })
  private get spriteFrame() {
    return this._spriteFrame;
  }
  private set spriteFrame(val) {
    this._spriteFrame = val;
    this.updateSpriteFrame();
    this.updateUv();
    this.markForUpdateRenderData();
  }
  @property
  private _sizeMode: SizeMode = SizeMode.TRIMMED;
  @property({ displayName: "尺寸模式", type: Enum(SizeMode) })
  private get sizeMode() {
    return this._sizeMode;
  }
  private set sizeMode(val) {
    this._sizeMode = val;
    this.updateSizeMode();
  }
  @property({
    displayName: "顶点数 / 三角形数",
    readonly: true,
    editorOnly: true,
    serializable: false,
  })
  private vertexTriangle: Vec2 = new Vec2(0, 0);
  @property
  private _segment: number = 5;
  @property({ displayName: "······线段数量", type: CCInteger })
  private get segment() {
    return this._segment;
  }
  private set segment(val) {
    this._segment = Math.max(val, 1);
    this.createData();
    this.updateLocal();
    this.updateUv();
    this.updateColor();
    this.markForUpdateRenderData();
  }
  @property
  private _radius: number = 100;
  @property({ displayName: "······圆角半径" })
  private get radius() {
    return this._radius;
  }
  private set radius(val) {
    this._radius = Math.max(val, 0);
    this.updateLocal();
    this.updateUv();
    this.markForUpdateRenderData();
  }
  @property
  private _corner: Corner = new Corner();
  @property({ displayName: "······圆角可见性" })
  private get corner() {
    return this._corner;
  }
  private set corner(val) {
    this._corner = val;
    this.updateCorner();
    this.createData();
    this.updateLocal();
    this.updateUv();
    this.updateColor();
    this.markForUpdateRenderData();
  }
  private uiTrans: UITransform = null; //当前节点的UITransform对象
  private left: number = 0; //左边缘本地坐标
  private bottom: number = 0; //下边缘本地坐标
  private locals: number[][] = []; //顶点本地坐标
  __preload(): void {
    super.__preload();
    this._assembler = {
      //定制assembler
      updateColor: this.updateColor.bind(this),
      updateRenderData: this.updateRenderData.bind(this),
      fillBuffers: this.fillBuffer.bind(this),
    };
    this.uiTrans =
      this.node.getComponent(UITransform) ??
      this.node.addComponent(UITransform);
    this["updateMaterial"]();
    this.updateSpriteFrame();
    this.updateCorner();
    this.updateLocal();
  }
  onEnable(): void {
    super.onEnable();
    this.createData();
    this.updateUv();
    JSB
      ? director.once(Director.EVENT_AFTER_DRAW, this.updateColor, this)
      : this.updateColor();
    this.node.on(NodeEventType.SIZE_CHANGED, this.onSizeChanged, this);
    this.node.on(NodeEventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
  }
  onDisable(): void {
    super.onDisable();
    this.node.off(NodeEventType.SIZE_CHANGED, this.onSizeChanged, this);
    this.node.off(NodeEventType.ANCHOR_CHANGED, this.onAnchorChanged, this);
  }
  //修改节点尺寸后，更新顶点数据，并根据sizeMode设置图片宽高
  private onSizeChanged(): void {
    if (!this._spriteFrame) return;
    this.updateLocal();
    this.updateXy();
    const cw = this.uiTrans.width,
      ch = this.uiTrans.height;
    const size = this._spriteFrame["_originalSize"],
      rect = this._spriteFrame["_rect"];
    switch (this._sizeMode) {
      case SizeMode.TRIMMED:
        if (cw === rect.width && ch === rect.height) return;
        break;
      case SizeMode.RAW:
        if (cw === size.width && ch === size.height) return;
        break;
    }
    this._sizeMode = SizeMode.CUSTOM;
  }
  private onAnchorChanged(): void {
    this.updateLocal();
    this.updateXy();
  }
  //可以传入单张图片Texture2D，或Atlas图集帧（支持合批，推荐）
  private updateSpriteFrame(): void {
    const spriteFrame = this._spriteFrame;
    if (!spriteFrame) {
      this.atlas = null;
      return;
    }
    this._renderData && (this._renderData.textureDirty = true);
    this.updateSizeMode();
    if (EDITOR) {
      if (!spriteFrame["_atlasUuid"]) {
        this.atlas = null;
        return;
      }
      assetManager.loadAny(
        spriteFrame["_atlasUuid"],
        (err: Error, asset: SpriteAtlas) => {
          if (err) {
            this.atlas = null;
            return;
          }
          this.atlas = asset;
        }
      );
    }
  }
  private updateCorner(): void {
    const corner = this._corner;
    corner.visible = [
      corner.leftBottom,
      corner.rightBottom,
      corner.rightTop,
      corner.leftTop,
    ];
  }
  //设置顶点数和三角形数
  private createData(): void {
    const renderData = (this._renderData = this.requestRenderData());
    let vertexTriangle = [4, 2];
    let cornerCnt = 0;
    for (
      let i = 0, visible = this._corner.visible;
      i < 4;
      visible[i++] && ++cornerCnt
    );
    vertexTriangle = [
      12 + (this._segment - 1) * cornerCnt,
      6 + this._segment * cornerCnt,
    ];
    renderData.dataLength = vertexTriangle[0];
    renderData.resize(vertexTriangle[0], 3 * vertexTriangle[1]);
    EDITOR && ([this.vertexTriangle.x, this.vertexTriangle.y] = vertexTriangle);
    this.updateIndices();
  }
  //计算顶点索引
  updateIndices(): void {
    const renderData = this._renderData;
    const indices = new Uint16Array(renderData.chunk.indexCount);
    const ROUND_IB = [0, 9, 11, 0, 11, 1, 2, 8, 10, 2, 4, 8, 3, 5, 7, 3, 7, 6];
    for (let i = ROUND_IB.length - 1; i > -1; indices[i] = ROUND_IB[i--]);
    for (
      let i = 0,
        offset = ROUND_IB.length,
        id = 36,
        visible = this._corner.visible;
      i < 4;
      ++i
    ) {
      if (!visible[i]) continue;
      const o = 3 * i;
      let a = o + 1;
      let b = id / 3;
      for (let j = 0, len = this._segment - 1; j < len; ++j) {
        indices[offset++] = o;
        indices[offset++] = a;
        indices[offset++] = b;
        a = b++;
        id += 3;
      }
      indices[offset++] = o;
      indices[offset++] = a;
      indices[offset++] = o + 2;
    }
    JSB
      ? renderData.chunk.setIndexBuffer(indices)
      : (renderData.indices = indices);
  }
  //计算本地坐标
  updateLocal(): void {
    const ut = this.uiTrans,
      cw = ut.width,
      ch = ut.height,
      ax = ut.anchorX,
      ay = ut.anchorY;
    const l = (this.left = -cw * ax),
      b = (this.bottom = -ch * ay),
      r = cw * (1 - ax),
      t = ch * (1 - ay);
    const locals = (this.locals = []);
    const radius = Math.min(this._radius, Math.min(cw, ch) / 2);
    const lo = l + radius,
      bo = b + radius,
      ro = r - radius,
      to = t - radius;
    const corner = this._corner;
    locals[0] = [lo, corner.leftBottom ? bo : b];
    locals[1] = [l, locals[0][1]];
    locals[2] = [lo, b];
    locals[3] = [ro, corner.rightBottom ? bo : b];
    locals[4] = [ro, b];
    locals[5] = [r, locals[3][1]];
    locals[6] = [ro, corner.rightTop ? to : t];
    locals[7] = [r, locals[6][1]];
    locals[8] = [ro, t];
    locals[9] = [lo, corner.leftTop ? to : t];
    locals[10] = [lo, t];
    locals[11] = [l, locals[9][1]];
    const radian = Math.PI / (this._segment << 1);
    const sin = Math.sin(radian),
      cos = Math.cos(radian);
    for (let i = 0, offset = 12, visible = corner.visible; i < 4; ++i) {
      if (!visible[i]) continue;
      const id = i * 3;
      const ox = locals[id][0],
        oy = locals[id][1];
      let deltX = locals[id + 1][0] - ox,
        deltY = locals[id + 1][1] - oy;
      for (let j = 0, len = this._segment - 1; j < len; ++j) {
        locals[offset] = [
          ox + deltX * cos - deltY * sin,
          oy + deltY * cos + deltX * sin,
        ];
        deltX = locals[offset][0] - ox;
        deltY = locals[offset][1] - oy;
        ++offset;
      }
    }
  }
  //根据本地坐标，计算XY坐标
  updateXy(): void {
    const renderData = this._renderData,
      data = renderData.data,
      locals = this.locals;
    for (let i = locals.length - 1; i > -1; --i) {
      const local = this.locals[i];
      data[i].x = local[0];
      data[i].y = local[1];
    }
    !JSB && (renderData.vertDirty = true);
  }
  updateUv(): void {
    const spriteFrame = this._spriteFrame;
    if (!spriteFrame) return;
    const renderData = this._renderData,
      vb = renderData.chunk.vb,
      locals = this.locals;
    const ut = this.uiTrans,
      cw = ut.width,
      ch = ut.height,
      l = this.left,
      b = this.bottom;
    for (
      let i = 3, len = vb.length, step = renderData.floatStride, id = 0;
      i < len;
      i += step, ++id
    ) {
      const local = locals[id];
      vb[i] = (local[0] - l) / cw;
      vb[i + 1] = (local[1] - b) / ch;
    }
    const uv = spriteFrame.uv;
    if (spriteFrame["_rotated"]) {
      const uvL = uv[0],
        uvB = uv[1],
        uvW = uv[4] - uvL,
        uvH = uv[3] - uvB;
      for (
        let i = 3, len = vb.length, step = renderData.floatStride;
        i < len;
        i += step
      ) {
        const tmp = vb[i];
        vb[i] = uvL + vb[i + 1] * uvW;
        vb[i + 1] = uvB + tmp * uvH;
      }
    } else {
      const uvL = uv[0],
        uvB = uv[1],
        uvW = uv[2] - uvL,
        uvH = uv[5] - uvB;
      for (
        let i = 3, len = vb.length, step = renderData.floatStride;
        i < len;
        i += step
      ) {
        vb[i] = uvL + vb[i] * uvW;
        vb[i + 1] = uvB + vb[i + 1] * uvH;
      }
    }
  }
  //计算顶点颜色
  updateColor(): void {
    const renderData = this._renderData,
      vb = renderData.chunk.vb,
      color = this._color;
    const r = color.r / 255,
      g = color.g / 255,
      b = color.b / 255,
      a = color.a / 255;
    for (
      let i = 5, len = vb.length, step = renderData.floatStride;
      i < len;
      i += step
    ) {
      vb[i] = r;
      vb[i + 1] = g;
      vb[i + 2] = b;
      vb[i + 3] = a;
    }
  }
  //根据尺寸模式，修改节点尺寸
  updateSizeMode(): void {
    if (!this._spriteFrame) return;
    switch (this._sizeMode) {
      case SizeMode.TRIMMED:
        this.uiTrans.setContentSize(this._spriteFrame["_rect"].size);
        break;
      case SizeMode.RAW:
        this.uiTrans.setContentSize(this._spriteFrame["_originalSize"]);
        break;
    }
  }
  //调用markForUpdateRenderData后该函数会被动触发
  updateRenderData(): void {
    if (!this._renderData || !this._spriteFrame?.texture) return;
    this.updateXy();
    this._renderData.updateRenderData(this, this._spriteFrame);
  }
  protected _render(render: any): void {
    render.commitComp(
      this,
      this._renderData,
      this._spriteFrame,
      this._assembler,
      null
    );
  }
  protected _canRender(): boolean {
    return super._canRender() && !!this._spriteFrame?.texture;
  }
  //Web平台，将renderData的数据提交给GPU渲染
  //原生平台并不会执行该函数，引擎另外实现了渲染函数
  fillBuffer(): void {
    const renderData = this._renderData;
    if (!renderData) return;
    const chunk = renderData.chunk;
    if (this.node.hasChangedFlags || renderData.vertDirty) {
      const data = renderData.data,
        vb = renderData.chunk.vb,
        m = this.node.worldMatrix;
      for (
        let step = renderData.floatStride, len = vb.length, i = 0, id = 0;
        i < len;
        i += step, ++id
      ) {
        const x = data[id].x,
          y = data[id].y;
        let
          rhw = m.m03 * x + m.m07 * y + m.m15;
        rhw = rhw ? 1 / rhw : 1;
        vb[i] = (m.m00 * x + m.m04 * y + m.m12) * rhw;
        vb[i + 1] = (m.m01 * x + m.m05 * y + m.m13) * rhw;
      }
      renderData.vertDirty = false;
    }
    const vid = chunk.vertexOffset;
    const meshBuffer = chunk.meshBuffer;
    const iData = meshBuffer.iData;
    let indexOffset = meshBuffer.indexOffset;
    const indices = renderData.indices;
    for (
      let i = 0;
      i < indices.length;
      iData[indexOffset++] = vid + indices[i++]
    );
    meshBuffer.indexOffset += indices.length;
  }
}
declare global {
  namespace gi {
    class RoundBox extends UIRenderer {
      static SizeMode: typeof SizeMode;
      spriteFrame: SpriteFrame;
      sizeMode: SizeMode;
      roundSegment: number;
      roundRadius: number;
      roundCorner: Corner;
    }
  }
}
((globalThis as any).gi ||= {}).RoundBox ||= Object.assign(RoundBox, {
  SizeMode: SizeMode,
});
