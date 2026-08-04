# /photo 页面 FREE CANVAS 改造设计

- 日期：2026-08-04
- 状态：已批准
- 参考：https://brand.squarespace.com/photography 页面 02 部分（`photographyImageGrid`）

## 背景

当前 `/photo` 页面的 FREE CANVAS 部分（`photo-grid-section`）已复制了 Squarespace 原版的布局骨架（8 列网格 + `photo_grid_rows.yml` 列位置数据），但缺少原版的核心交互：图片自由拖拽、Reset 重置按钮、提示标签、行交错重叠布局。点击图片后的全屏查看器也与原版 Overlay 结构不同。

本次改造以 Squarespace Photography 02 部分为蓝本，复刻其布局与交互逻辑。

## 目标

1. 布局复刻：桌面 8 列 + 行间 -50% 行高重叠交错；移动端 3 列 + 专用数据
2. 交互复刻：图片可自由拖拽（带惯性、边界约束）、Reset 按钮一键回原位、悬停提示标签
3. 查看器改造：Squarespace Overlay 风格（主图缩放 + 缩略图侧栏 + 分页），保留博客照片信息区
4. 移除现有视差效果（原版无视差）

## 技术决策

- **拖拽实现：原生 JS（Pointer Events）**，不引入拖拽库
- **动画：Web Animations API（WAAPI）**，与现有 `photo.js` 中 `animateImage` 风格一致
- **GSAP 备用方案**：若原生实现手感不佳（惯性、边界表现），切换到 GSAP Draggable + InertiaPlugin（`gsap.draggable()` + `InertiaPlugin`，`throwProps` 处理惯性）。切换点为：拖拽跟手性、惯性衰减曲线、边界回弹。切换时仅替换拖拽模块（`photo-drag.js`），状态机、Reset、查看器逻辑不变。切换成本：HTML 增加 GSAP CDN（`gsap@3` + `gsap-draggable` + `gsap-inertia`），photo 页当前无 GSAP 依赖
- **平滑滚动**：保留现有 Lenis 集成，拖拽期间通过 `smoothScroller.stop()` 暂停
- **提示标签语言**：英文 "Click or drag to explore" / "Tap or drag to explore"（原版视觉）

## 文件变更

| 文件 | 变更 |
|---|---|
| `_layouts/photo.html` | 网格结构改造、移除 parallax 层级、新增 Reset 按钮/提示标签、dialog 改 Overlay 结构 |
| `_data/photo_grid_rows_mobile.yml` | 新增：移动端 3 列数据 `[[1,2],[3],[1,3],[2,3],[1,2],[3],[1,2,3],[2]]` |
| `_sass/_photo.scss` | 行重叠、3 列移动布局、Reset/提示标签样式、Overlay 样式、移除 parallax |
| `assets/js/photo-drag.js` | 新增：Draggable 模块（Pointer Events + 惯性 + 边界） |
| `assets/js/photo.js` | 画布状态机、Reset、提示标签、Overlay 查看器逻辑 |

## 设计细节

### 1. 画布布局（HTML + CSS）

**HTML 结构**：

```html
<section class="photo-grid-section" id="photo-grid">
  <div class="photo-grid-section__head">
    <h2>FREE<br>CANVAS</h2>
  </div>
  <div class="photographyImageGrid__containerInner">
    <div class="photographyImageGrid__rows gridContainer" data-photo-canvas>
      <div class="photographyImageGrid__row">
        <button class="photographyImageGridItem visible" data-photo-card data-index="N"
                style="--photo-column: 2">
          <div class="draggableElement photographyImageGridItem__draggable fill">
            <div class="photographyImageGridItem__inner fill">
              <img class="photographyImageGridItem__image fill" src="..." alt="" loading="lazy" draggable="false">
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
  <button class="photo-canvas__reset" data-photo-reset>↺ Reset</button>
  <div class="photo-canvas-hint" data-photo-hint>Click or drag to explore</div>
</section>
```

- 移除 `.parallax` / `.parallax__inner` 两层（视差删除），图片直接位于 `.photographyImageGridItem__inner`
- `data-photo-canvas` 外层加 `containerInner`（`overflow: hidden`，防止拖拽图产生滚动条）
- 移动端数据切换：**Liquid 同时输出两组 row 容器（桌面 8 列数据 + 移动 3 列数据），CSS 按断点显隐**。避免 JS 重建 DOM 导致首屏闪烁，静态站点重复渲染成本可接受

**CSS 关键规则**：

```scss
.photographyImageGrid__rows {
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 0;
}

.photographyImageGrid__row {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-column-gap: 2rem;
  height: var(--rowHeight);       /* 13rem */
  pointer-events: none;           /* 行不拦截事件 */
  position: relative;
  &:not(:first-child) {
    margin-top: calc(var(--rowHeight) * -0.5);  /* 行重叠 50% */
  }
}

.photographyImageGridItem {
  grid-column: var(--photo-column) / span 1;
  cursor: pointer;
  pointer-events: auto;
  /* 移除 cursor: grab / touch-action: none 的滚动抑制只在拖拽目标上 */
}
```

- 桌面：8 列；移动（≤900px）：3 列 + 移动 row 容器显隐
- `--rowHeight: 13rem`（原版值，替换现有 `19.3rem`）
- item 悬停图片 `scale(1.15)`（`transition: transform .5s cubic-bezier(.215,.61,.355,1)`）

**移动端断点（≤900px）**：
- 3 列网格，移动数据容器显示、桌面容器隐藏
- 行重叠保留（原版移动端同样重叠）
- 无拖拽（Pointer 事件绑定仅桌面）；tap 打开查看器
- 提示标签 `Tap or drag to explore`：sticky 顶部（section 滚动到视口顶部时显示，滚动出画布后隐藏）

### 2. 拖拽逻辑（`photo-drag.js`，原生 JS）

**Draggable 类**（每张图片一个实例）：

```
pointerdown
  - 忽略：移动端、左键以外、已打开 overlay
  - 记录起始坐标、起始 transform、时间戳
  - setPointerCapture，smoothScroller.stop()，加 is-dragging 类
pointermove
  - 位移 = 当前 - 起始，累加到 x/y
  - 边界约束：图片矩形不得完全移出 section 矩形（四周各保留最小可见边距）
  - 位移 > 5px 标记为拖拽（抑制 click）
  - z-index 提升被拖图片
pointerup
  - 释放捕获，smoothScroller.start()
  - 计算末段速度（最近 3 个 move 事件的时间/位移）
  - 惯性：rAF 每帧位置 += velocity，velocity *= 0.92 衰减；
    触边界或 velocity < 0.05 停止
  - 首轮拖拽（interactionEnabled = false）→ 置 true，显示 Reset 按钮
```

- 拖拽期间 `document.documentElement` 加 `photo-dragging` 类（禁滚动、禁图片拖拽原生行为 `draggable=false` 已有）
- click 判定：位移 ≤ 5px 视为点击 → 打开查看器（保留现有 `data-photo-card` 点击逻辑）
- `prefers-reduced-motion: reduce`：禁用惯性，直接落位

**边界计算**：拖拽前计算 `section.getBoundingClientRect()`，图片拖出后保留至少 20% 可见（视觉上允许大幅拖出，容器裁切）

### 3. 状态机与辅助 UI（`photo.js`）

- `interactionEnabled`（首次拖拽 → true）：控制 Reset 按钮显示
- **Reset 按钮**（`[data-photo-reset]`，固定左下角，`mix-blend-mode: difference`）：
  - 点击 → 所有图片 WAAPI 动画回 `(0,0)`（`cubic-bezier(0.22, 1, 0.36, 1)`，1s），完成后隐藏按钮
  - 仅桌面显示（移动无拖拽，不显示）
- **提示标签**（`[data-photo-hint]`）：
  - 桌面：hover 画布区域（`mouseenter`/`mouseleave`）、未打开 overlay、未 hover Reset 时显示；跟随鼠标（`transform: translate(x+12, y+12)`），`mix-blend-mode: difference` 白字
  - 移动：section 滚动到视口内时 sticky 显示，滚动出后隐藏

### 4. 查看器改造（Overlay，`photo.js` + dialog 结构）

保留 `<dialog>` 元素与现有打开/关闭/键盘/Lenis 暂停逻辑，内部结构改为：

```
dialog[data-photo-dialog]
├── Close ×（右上角）
├── 主图区（居中，overflow: hidden）
│   ├── 主图 img（object-fit: contain）
│   └── 缩放角标：( + ) / ( - )（blend-mode: difference，随状态切换）
├── 缩略图侧栏（桌面右侧竖向；移动端底部横向）
│   ├── 全部照片缩略图（thumb 用图片本身，loading=lazy）
│   ├── 当前项 scale(1.5) + aria-pressed
│   ├── hover 项 scale(1.5)
│   ├── 交互：滚轮滚动 / 拖拽滚动（复用 photo-drag.js 的单轴拖拽）/ 点击切换
│   └── 切换后滚动到当前项居中
├── 分页（01 / 56，右上或左下）
├── 左右箭头（左下角）
└── 信息区（左下角，弱化）：标题 / 分类·年份 / 描述（保留博客特色）
```

**主图交互**：
- 点击主图或 `( + )` 角标 → 切换缩放状态（fit ↔ 放大 1.5 倍）
- wheel 在主图区 → 渐进缩放（delta 累积，±20% 步进，范围 1~3）
- 桌面鼠标移动 → 主图轻微视差位移（±14%，保留现有 `--photo-pan-x/y` 逻辑）
- 现有切换动画（`transitionTo`，位移 + 淡入淡出）保留

**缩略图侧栏逻辑**：
- 渲染顺序与网格一致（`site.data.photo` 全部照片）
- 横向（移动）：`flex` 排列 + `overflow-x: auto`；竖向（桌面）：`flex column` + `overflow-y: auto`
- 滚轮滚动阻止页面滚动（`overscroll-behavior: contain`）
- 拖拽滚动：pointer 事件水平/垂直位移直接改 `scrollLeft/scrollTop`

**移动端查看器**：
- 缩略图条在底部横向，主图占上方
- 信息区收起为一行（标题 + 分类·年份），描述隐藏（`max-width` 控制）

### 5. 无障碍与兼容

- 所有图片按钮保留 `aria-label="View image N"`
- 缩略图按钮 `aria-pressed` 表示当前项
- `focus-visible` 轮廓保留现有样式
- `prefers-reduced-motion`：禁用惯性、缩放过渡、hover 缩放（保留即时切换）
- 兼容 Chrome 90+ / Safari 14+：Pointer Events + WAAPI 均可用（`Element.animate` 已有降级分支）

## 测试要点

1. 桌面：拖拽跟手、惯性自然、拖出边界受限、Reset 回原位
2. 点击（无拖动）仍能打开查看器；拖动后不误触点击
3. 查看器：主图缩放、缩略图切换/滚动、分页正确、信息区显示
4. 移动端：3 列布局、无拖拽、tap 打开、底部缩略图条
5. 断点切换 900px 无闪烁、Lenis 滚动正常、无控制台错误
6. `prefers-reduced-motion` 降级正常

## 非目标

- 不改 hero、statement 部分
- 不做图片懒加载优化（保持现有 `loading="lazy"`）
- 不引入任何 JS 库（GSAP 仅作备用方案记录，见技术决策）
