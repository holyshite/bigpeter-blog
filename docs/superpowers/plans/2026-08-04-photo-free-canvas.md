# FREE CANVAS 画布改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 /photo 页面 FREE CANVAS 部分改造为 Squarespace Photography 02 风格：行交错布局 + 图片自由拖拽 + Reset 重置 + 提示标签 + Overlay 查看器（缩略图侧栏 + 缩放）。

**Architecture:** 静态站点 + 原生 JS（零新依赖）。Liquid 双容器输出桌面（8 列）与移动（3 列）网格，CSS 断点显隐；`photo-drag.js` 提供通用拖拽模块（Pointer Events + 惯性 + 边界），`photo-viewer.js` 自包含 Overlay 查看器（数据从缩略图按钮 data 属性读取），`photo.js` 负责画布状态机、Reset、提示标签、Lenis 与 statement 背景（保留）。

**Tech Stack:** Jekyll 4.4.1、Liquid、SCSS、原生 ES5 风格 JS（项目现状）、Lenis（已有）、Playwright（仅验证用，/tmp 下临时脚本）。

**验证方式：** 项目无测试框架。每个任务用 `bundle exec jekyll build` 验证编译；Task 9 用 Playwright 做完整交互验证（jekyll serve + 浏览器断言）。

**Spec 偏差说明（相对 `docs/superpowers/specs/2026-08-04-photo-free-canvas-design.md`）：**
1. 查看器信息区位置：右下角（spec 写左下角）——避免与左下角箭头/分页冲突，且与现有视觉一致
2. 新增 `assets/js/photo-viewer.js`（查看器独立模块，spec 文件表未列）

---

### Task 1: 移动端网格数据文件

**Files:**
- Create: `_data/photo_grid_rows_mobile.yml`

- [ ] **Step 1: 创建移动端数据文件**

```yaml
- [1, 2]
- [3]
- [1, 3]
- [2, 3]
- [1, 2]
- [3]
- [1, 2, 3]
- [2]
```

（Squarespace 移动端 3 列模式，8 行共 14 个槽位；Liquid 循环复用直到 49 张照片分配完）

- [ ] **Step 2: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功，无错误。

- [ ] **Step 3: 提交**

```bash
git add _data/photo_grid_rows_mobile.yml
git commit -m "feat(photo): 新增移动端画布网格数据"
```

---

### Task 2: photo.html 网格结构改造

**Files:**
- Modify: `_layouts/photo.html:65-117`（photo-grid-section 部分）

- [ ] **Step 1: 读取当前文件确认行号**

```bash
sed -n '65,117p' /home/peter/projects/bigpeter-blog/_layouts/photo.html
```

- [ ] **Step 2: 替换 photo-grid-section 内部结构**

将 `photo.html` 中 `<section class="photo-grid-section" ...>` 到 `</section>`（第 65-117 行）整体替换为以下内容（双容器 + containerInner + Reset 按钮 + 提示标签，移除 `.parallax` 层级）：

```liquid
    <section class="photo-grid-section" id="photo-grid" aria-labelledby="photo-grid-title">
      <div class="photo-grid-section__head">
        <h2 id="photo-grid-title">FREE<br>CANVAS</h2>
      </div>

      {% assign photo_total = site.data.photo | size %}
      <div class="photographyImageGrid__containerInner">
        <!-- 桌面 8 列容器 -->
        <div class="photographyImageGrid__rows photographyImageGrid__rows--desktop" data-photo-canvas aria-label="可拖动作品画布">
          {% assign photo_cursor = 0 %}
          {% for photo_row in site.data.photo_grid_rows %}
          {% if photo_cursor < photo_total %}
          <div class="photographyImageGrid__row">
            {% for photo_slot in photo_row %}
            {% if photo_cursor < photo_total %}
            {% assign item = site.data.photo[photo_cursor] %}
            <button
              class="photographyImageGridItem visible"
              type="button"
              data-photo-card
              data-index="{{ photo_cursor }}"
              style="--photo-column: {{ photo_slot }};"
            >
              <div class="draggableElement photographyImageGridItem__draggable fill">
                <div class="photographyImageGridItem__inner fill">
                  <img
                    class="photographyImageGridItem__image fill"
                    src="{{ item.src | relative_url }}"
                    alt=""
                    loading="lazy"
                    draggable="false"
                    width="1206"
                    height="1500"
                  >
                </div>
              </div>
            </button>
            {% endif %}
            {% assign photo_cursor = photo_cursor | plus: 1 %}
            {% endfor %}
          </div>
          {% endif %}
          {% endfor %}
        </div>

        <!-- 移动 3 列容器（≤900px 显示） -->
        <div class="photographyImageGrid__rows photographyImageGrid__rows--mobile" data-photo-canvas-mobile aria-hidden="true">
          {% assign mobile_cursor = 0 %}
          {% assign mobile_row_count = site.data.photo_grid_rows_mobile | size %}
          {% assign mobile_row_idx = 0 %}
          {% for mobile_cycle in (1..photo_total) %}
          {% if mobile_cursor >= photo_total %}{% break %}{% endif %}
          {% assign mobile_row = site.data.photo_grid_rows_mobile[mobile_row_idx] %}
          <div class="photographyImageGrid__row">
            {% for mobile_col in mobile_row %}
            {% if mobile_cursor < photo_total %}
            {% assign mobile_item = site.data.photo[mobile_cursor] %}
            <button
              class="photographyImageGridItem visible"
              type="button"
              data-photo-card
              data-index="{{ mobile_cursor }}"
              style="--photo-column: {{ mobile_col }};"
            >
              <div class="draggableElement photographyImageGridItem__draggable fill">
                <div class="photographyImageGridItem__inner fill">
                  <img
                    class="photographyImageGridItem__image fill"
                    src="{{ mobile_item.src | relative_url }}"
                    alt=""
                    loading="lazy"
                    draggable="false"
                    width="1206"
                    height="1500"
                  >
                </div>
              </div>
            </button>
            {% endif %}
            {% assign mobile_cursor = mobile_cursor | plus: 1 %}
            {% endfor %}
          </div>
          {% assign mobile_row_idx = mobile_row_idx | plus: 1 %}
          {% if mobile_row_idx >= mobile_row_count %}{% assign mobile_row_idx = 0 %}{% endif %}
          {% endfor %}
        </div>
      </div>

      <button class="photo-canvas__reset" type="button" data-photo-reset aria-label="重置画布">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
          <path fill="none" stroke="currentColor" stroke-width="1.6" d="M3 12a9 9 0 1 1 2.6 6.4M3 12V6m0 6h6"></path>
        </svg>
        <span>Reset</span>
      </button>
      <div class="photo-canvas-hint" data-photo-hint role="status">
        <span class="photo-canvas-hint__desktop">Click or drag to explore</span>
        <span class="photo-canvas-hint__mobile">Tap or drag to explore</span>
      </div>
    </section>
```

注意：
- 桌面与移动容器中的卡片删除了原 `data-photo-title/category/description/src` 属性（查看器数据改从缩略图按钮读取，见 Task 6），只保留 `data-index` 与 `--photo-column`
- 移动容器初始 `aria-hidden="true"`，由 JS 断点切换时同步（Task 5）

- [ ] **Step 3: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功。若报 `for` 循环或 `break` 语法错误，检查 `{% for mobile_cycle in (1..photo_total) %}` 语法（Jekyll 4 支持 `(1..N)` 区间与 `{% break %}`）。

- [ ] **Step 4: 提交**

```bash
git add _layouts/photo.html
git commit -m "feat(photo): 画布改双容器结构并移除视差层级"
```

---

### Task 3: 画布 SCSS 布局改造

**Files:**
- Modify: `_sass/_photo.scss`

- [ ] **Step 1: 替换网格布局样式**

将 `_sass/_photo.scss` 中 `.photo-grid-section` 之后的网格相关规则（从 `.photographyImageGrid__rows` 到 `.photographyImageGridItem__image`，约第 383-463 行）替换为：

```scss
.photographyImageGrid__rows {
  --rowHeight: 13rem;
  display: none;
  flex-direction: column;
  position: relative;
  z-index: 0;
}

.photographyImageGrid__rows--desktop {
  display: flex;
}

.photographyImageGrid__row {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  grid-column-gap: 2rem;
  height: var(--rowHeight);
  pointer-events: none;
  position: relative;
}

.photographyImageGrid__row:not(:first-child) {
  margin-top: calc(var(--rowHeight) * -0.5);
}

.photographyImageGridItem {
  background: #0d0d0d;
  border: 0;
  cursor: pointer;
  display: block;
  grid-column: var(--photo-column) / span 1;
  height: 100%;
  overflow: visible;
  padding: 0;
  pointer-events: auto;
  position: relative;
  width: 100%;
}

.photographyImageGridItem:focus-visible,
.photo-dialog button:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 4px;
}

.photographyImageGridItem.visible {
  opacity: 1;
}

.fill {
  height: 100%;
  width: 100%;
}

.draggableElement {
  cursor: pointer;
  overflow: hidden;
  transform: translate3d(0, 0, 0);
  user-select: none;
  will-change: transform;
}

.draggableElement.is-dragging {
  cursor: grabbing;
}

.photographyImageGridItem__inner {
  height: 100%;
  opacity: 0;
  overflow: hidden;
  transition: opacity 0.8s ease;
  will-change: transform, opacity;
  width: 100%;
}

.photographyImageGridItem.visible .photographyImageGridItem__inner {
  opacity: 1;
}

.photographyImageGridItem__image {
  -webkit-user-drag: none;
  display: block;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1);
  user-select: none;
  width: 100%;
}

.photographyImageGridItem:hover .photographyImageGridItem__image {
  transform: scale(1.15);
}

@media (prefers-reduced-motion: reduce) {
  .photographyImageGridItem__image {
    transition: none;
  }
}
```

同时删除原有 `.photographyImageGrid__rows`（grid 版）、`.gridContainer`、`.photographyImageGrid__row`（grid 版）、`.photographyImageGridItem`（grab 版）、`.photographyImageGridItem__draggable`、`.parallax`、`.parallax__inner`、`.photographyImageGridItem__image` 旧规则。

- [ ] **Step 2: 修改 `--rowHeight` 与 `--columns` 变量**

`.photo-grid-section` 规则（约第 348-364 行）中：
- 将 `--rowHeight: 19.3rem;` 改为 `--rowHeight: 13rem;`
- 删除 `--columns: 8;`（列数由 `.photographyImageGrid__row` 的 `repeat(8, ...)` 固定，不再用变量）

- [ ] **Step 3: 新增 Reset 按钮与提示标签样式**

在 `.photo-grid-section` 规则块内部末尾追加：

```scss
.photo-canvas__reset {
  align-items: center;
  background: transparent;
  border: 0;
  bottom: 3.2rem;
  color: #fff;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 11px;
  gap: 0.8rem;
  left: var(--sideMargin);
  margin: 0;
  mix-blend-mode: difference;
  opacity: 0;
  padding: 0.4rem 0.6rem;
  pointer-events: none;
  position: fixed;
  transition: opacity 300ms ease;
  z-index: 5;
}

.photo-canvas__reset.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.photo-canvas-hint {
  color: #fff;
  font-size: 11px;
  left: 0;
  letter-spacing: 0;
  mix-blend-mode: difference;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  top: 0;
  transition: opacity 200ms ease;
  white-space: nowrap;
  z-index: 6;
}

.photo-canvas-hint.is-visible {
  opacity: 1;
}

.photo-canvas-hint__mobile {
  display: none;
}
```

- [ ] **Step 4: 修改 720px 断点内的网格规则**

`@media (max-width: 720px)` 块（约第 611-818 行）中：
- 删除 `.photographyImageGridItem { grid-column: auto; }` 与 `.photographyImageGrid__row { grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); }` 两条（约第 765-771 行）
- 删除 `.photographyImageGrid__rows { gap: 0; }`（约第 773-775 行，新布局 rows 无 gap）
- 删除 `.photo-grid-section { --columns: 4; }` 中的 `--columns` 与 `--columnGap`（约第 750-755 行），只保留 `--sideMargin: 1.6rem; --rowHeight: 13rem;`
- `.photo-grid-section { --columnGap: 1.2rem; }` 中删除 `--columnGap`（行内 gap 已由 `.photographyImageGrid__row` 的 `grid-column-gap: 2rem` 固定）

- [ ] **Step 5: 新增 900px 断点（移动端容器切换 + 3 列）**

在文件末尾、`@media (prefers-reduced-motion: reduce)` 之前追加：

```scss
@media (max-width: 900px) {
  .photographyImageGrid__rows--desktop {
    display: none;
  }

  .photographyImageGrid__rows--mobile {
    display: flex;
  }

  .photographyImageGrid__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-column-gap: 1.2rem;
  }

  .photo-canvas__reset {
    display: none;
  }

  .photo-canvas-hint {
    left: var(--sideMargin, 1.6rem);
    position: absolute;
    top: 0;
  }

  .photo-canvas-hint__desktop {
    display: none;
  }

  .photo-canvas-hint__mobile {
    display: inline;
  }
}
```

（移动端 hint 改为 absolute 定位在画布容器内，由 JS 控制显隐，见 Task 5）

- [ ] **Step 6: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功（SCSS 编译无错）。若有未删除的旧类引用（如 `.gridContainer` 被移除后 Liquid 里不再使用，确认 Task 2 的 HTML 已无 `gridContainer` 类）。

- [ ] **Step 7: 提交**

```bash
git add _sass/_photo.scss
git commit -m "feat(photo): 画布行交错布局、移动端 3 列与 Reset/提示样式"
```

---

### Task 4: 拖拽模块 photo-drag.js

**Files:**
- Create: `assets/js/photo-drag.js`

- [ ] **Step 1: 创建拖拽模块**

```js
(function () {
  'use strict';

  var RAF = window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 16); };
  var CAF = window.cancelAnimationFrame || function (id) { window.clearTimeout(id); };
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createDraggable(element, options) {
    options = options || {};
    var bounds = options.bounds || null;
    var onDragStart = options.onDragStart || function () {};
    var onDrag = options.onDrag || function () {};
    var onDragEnd = options.onDragEnd || function () {};

    var x = 0;
    var y = 0;
    var baseX = 0;
    var baseY = 0;
    var startClientX = 0;
    var startClientY = 0;
    var pointerId = null;
    var dragging = false;
    var moved = false;
    var velocityX = 0;
    var velocityY = 0;
    var history = [];
    var inertiaFrame = 0;
    var suppressClick = false;
    var destroyed = false;

    function currentOffset() {
      var matrix = new DOMMatrixReadOnly(window.getComputedStyle(element).transform);
      return { x: matrix.m41 || 0, y: matrix.m42 || 0 };
    }

    function apply() {
      element.style.transform = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
      onDrag();
    }

    function clamp() {
      if (!bounds) return;
      var canvasRect = bounds.getBoundingClientRect();
      var rect = element.getBoundingClientRect();
      var minVisible = Math.min(rect.width, rect.height) * 0.2;
      var minX = canvasRect.left - rect.right + minVisible;
      var maxX = canvasRect.right - rect.left - minVisible;
      var minY = canvasRect.top - rect.bottom + minVisible;
      var maxY = canvasRect.bottom - rect.top - minVisible;
      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);
    }

    function stopInertia() {
      if (inertiaFrame) { CAF(inertiaFrame); inertiaFrame = 0; }
      velocityX = 0;
      velocityY = 0;
    }

    function startInertia() {
      var len = history.length;
      if (len < 2) return;
      var last = history[len - 1];
      var prev = history[len - 2];
      var dt = (last.t - prev.t) / 1000;
      if (dt <= 0 || dt > 0.1) return;
      var maxV = 5000;
      velocityX = Math.max(-maxV, Math.min(maxV, (last.x - prev.x) / dt));
      velocityY = Math.max(-maxV, Math.min(maxV, (last.y - prev.y) / dt));

      var step = function () {
        velocityX *= 0.92;
        velocityY *= 0.92;
        x += velocityX * 0.016;
        y += velocityY * 0.016;
        var prevX = x;
        var prevY = y;
        clamp();
        apply();
        var hitEdge = bounds && (x !== prevX || y !== prevY);
        if (hitEdge || (Math.abs(velocityX) < 1 && Math.abs(velocityY) < 1)) {
          inertiaFrame = 0;
          onDragEnd();
          return;
        }
        inertiaFrame = RAF(step);
      };
      inertiaFrame = RAF(step);
    }

    function onPointerDown(event) {
      if (destroyed || pointerId !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      var offset = currentOffset();
      baseX = offset.x;
      baseY = offset.y;
      startClientX = event.clientX;
      startClientY = event.clientY;
      x = baseX;
      y = baseY;
      moved = false;
      dragging = true;
      history = [];
      stopInertia();
      try { element.setPointerCapture(pointerId); } catch (err) {}
      element.classList.add('is-dragging');
      onDragStart();
    }

    function onPointerMove(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      x = baseX + (event.clientX - startClientX);
      y = baseY + (event.clientY - startClientY);
      if (!moved && (Math.abs(event.clientX - startClientX) > 5 || Math.abs(event.clientY - startClientY) > 5)) {
        moved = true;
      }
      clamp();
      apply();
      history.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (history.length > 6) history.shift();
    }

    function onPointerEnd(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      element.classList.remove('is-dragging');
      if (moved) {
        suppressClick = true;
        window.setTimeout(function () { suppressClick = false; }, 0);
        if (REDUCED_MOTION) {
          onDragEnd();
        } else {
          startInertia();
        }
      } else {
        onDragEnd();
      }
    }

    function onCaptureClick(event) {
      if (suppressClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function reset() {
      stopInertia();
      dragging = false;
      pointerId = null;
      element.classList.remove('is-dragging');
      var from = 'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, 0)';
      var animation = element.animate([
        { transform: from },
        { transform: 'translate3d(0px, 0px, 0px)' }
      ], {
        duration: 1000,
        easing: EASE,
        fill: 'forwards'
      });
      animation.finished.catch(function () {}).then(function () {
        x = 0;
        y = 0;
        apply();
      });
    }

    function destroy() {
      destroyed = true;
      stopInertia();
      dragging = false;
      pointerId = null;
      element.classList.remove('is-dragging');
      element.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      element.removeEventListener('click', onCaptureClick, true);
    }

    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    element.addEventListener('click', onCaptureClick, true);

    return { reset: reset, destroy: destroy, isMoved: function () { return moved; } };
  }

  window.PhotoDrag = { create: createDraggable };
})();
```

- [ ] **Step 2: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功（JS 文件复制到 `_site/assets/js/photo-drag.js`）。

- [ ] **Step 3: 提交**

```bash
git add assets/js/photo-drag.js
git commit -m "feat(photo): 新增拖拽模块（Pointer Events + 惯性 + 边界）"
```

---

### Task 5: photo.js 画布状态机改造

**Files:**
- Modify: `assets/js/photo.js`（整体重写）

- [ ] **Step 1: 重写 photo.js**

将 `assets/js/photo.js` 整体替换为：

```js
(function () {
  function initPhotoGallery() {
    var dialog = document.querySelector('[data-photo-dialog]');
    var desktopCanvas = document.querySelector('[data-photo-canvas]');
    var mobileCanvas = document.querySelector('[data-photo-canvas-mobile]');
    if (!desktopCanvas || !dialog) return;

    var isMobileQuery = window.matchMedia('(max-width: 900px)');
    var activeCanvas = isMobileQuery.matches ? mobileCanvas : desktopCanvas;
    var cards = [];
    var dragInstances = [];
    var interactionEnabled = false;
    var hintHovering = false;
    var hintOnReset = false;
    var resetButton = document.querySelector('[data-photo-reset]');
    var hint = document.querySelector('[data-photo-hint]');
    var gridSection = document.querySelector('.photo-grid-section');
    var statementBackground = document.querySelector('[data-photo-statement-background]');
    var statementSection = statementBackground ? statementBackground.closest('.photo-statement') : null;
    var statementImages = statementBackground ? Array.from(statementBackground.querySelectorAll('.photo-statement__background-image')) : [];
    var floatingLayers = statementBackground ? Array.from(statementBackground.querySelectorAll('[data-photo-floating-layer]')) : [];
    var backgroundFrame = 0;
    var statementBackgroundIndex = -1;
    var smoothScroller = null;
    var hintMoveFrame = 0;

    function getActiveCanvas() {
      return isMobileQuery.matches ? mobileCanvas : desktopCanvas;
    }

    function isMobile() {
      return isMobileQuery.matches;
    }

    function openViewer(index) {
      if (window.PhotoViewer && typeof window.PhotoViewer.open === 'function') {
        window.PhotoViewer.open(index);
      }
    }

    function bindCanvas() {
      activeCanvas = getActiveCanvas();
      cards = Array.from(activeCanvas.querySelectorAll('[data-photo-card]'));
      var otherCanvas = activeCanvas === desktopCanvas ? mobileCanvas : desktopCanvas;
      if (otherCanvas) otherCanvas.setAttribute('aria-hidden', 'true');
      activeCanvas.setAttribute('aria-hidden', 'false');

      activeCanvas.addEventListener('click', onCanvasClick);
      cards.forEach(function (card) {
        card.addEventListener('dragstart', preventDrag);
        if (isMobile() || !window.PhotoDrag) return;
        var draggableEl = card.querySelector('.photographyImageGridItem__draggable');
        if (!draggableEl) return;
        dragInstances.push(window.PhotoDrag.create(draggableEl, {
          bounds: gridSection,
          onDragStart: function () {
            if (smoothScroller) smoothScroller.stop();
            document.documentElement.classList.add('photo-dragging');
            if (!interactionEnabled) {
              interactionEnabled = true;
              if (resetButton) resetButton.classList.add('is-visible');
            }
          },
          onDragEnd: function () {
            if (smoothScroller) smoothScroller.start();
            document.documentElement.classList.remove('photo-dragging');
          }
        }));
      });
    }

    function unbindCanvas() {
      if (!activeCanvas) return;
      activeCanvas.removeEventListener('click', onCanvasClick);
      cards.forEach(function (card) {
        card.removeEventListener('dragstart', preventDrag);
      });
      dragInstances.forEach(function (instance) { instance.destroy(); });
      dragInstances = [];
      cards = [];
    }

    function preventDrag(event) {
      event.preventDefault();
    }

    function onCanvasClick(event) {
      var card = event.target.closest('[data-photo-card]');
      if (!card) return;
      var index = parseInt(card.dataset.index, 10);
      if (!isNaN(index)) openViewer(index);
    }

    function switchCanvas() {
      unbindCanvas();
      bindCanvas();
      hintHovering = false;
      updateHint();
    }

    function updateScrollBackground() {
      if (!statementSection || !statementBackground) return;

      var rect = statementSection.getBoundingClientRect();
      var travel = Math.max(1, rect.height - window.innerHeight);
      var progress = Math.max(0, Math.min(1, -rect.top / travel));
      var scaledProgress = progress * Math.max(1, statementImages.length - 1);
      var nextIndex = Math.min(statementImages.length - 1, Math.floor(scaledProgress));
      var reveal = nextIndex >= statementImages.length - 1 ? 1 : scaledProgress - nextIndex;
      if (nextIndex !== statementBackgroundIndex) {
        statementBackgroundIndex = nextIndex;
        statementBackground.dataset.activeIndex = String(nextIndex);
      }
      statementBackground.style.setProperty('--photo-statement-progress', progress.toFixed(3));
      statementBackground.style.setProperty('--photo-reveal', reveal.toFixed(3));
      statementBackground.style.setProperty('--photo-bg-parallax', (progress * -100).toFixed(2) + 'px');
      var stageHeight = statementBackground.clientHeight;
      floatingLayers.forEach(function (layer, index) {
        var layerSpeed = 0.75;
        var layerOffset = (index - scaledProgress * layerSpeed) * stageHeight;
        var visibilityBuffer = stageHeight * 1.3;
        var isVisible = layerOffset > -visibilityBuffer && layerOffset < visibilityBuffer;
        layer.style.visibility = isVisible ? 'visible' : 'hidden';
        layer.style.transform = 'translate3d(0, ' + layerOffset.toFixed(2) + 'px, 0)';
      });
      statementImages.forEach(function (item, index) {
        var clipPath = 'inset(100% 0 0 0)';
        if (index <= nextIndex) clipPath = 'inset(0 0 0 0)';
        if (index === nextIndex + 1) {
          var top = (1 - reveal) * 100;
          clipPath = 'polygon(0 ' + top + '%, 100% ' + top + '%, 100% 100%, 0 100%)';
        }
        item.style.clipPath = clipPath;
        item.style.webkitClipPath = clipPath;
      });
      statementBackground.dataset.scrollProgress = progress.toFixed(3);
    }

    function scheduleScrollBackground() {
      if (backgroundFrame) return;
      backgroundFrame = window.requestAnimationFrame(function () {
        backgroundFrame = 0;
        updateScrollBackground();
      });
    }

    function initSmoothScroll() {
      if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      smoothScroller = new window.Lenis({
        autoRaf: true,
        duration: 0.8,
        easing: function (progress) {
          return Math.min(1, 1.001 - Math.pow(2, -10 * progress));
        },
        smoothWheel: true,
        wheelMultiplier: 1
      });
      smoothScroller.on('scroll', scheduleScrollBackground);
    }

    function isGridInViewport() {
      if (!gridSection) return false;
      var rect = gridSection.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    }

    function updateHint() {
      if (!hint) return;
      var visible = false;
      if (isMobile()) {
        visible = isGridInViewport() && !dialog.open;
      } else {
        visible = hintHovering && !dialog.open && !hintOnReset;
      }
      hint.classList.toggle('is-visible', visible);
    }

    function scheduleHintMove(event) {
      if (!hint || isMobile() || !hint.classList.contains('is-visible')) return;
      if (hintMoveFrame) return;
      hintMoveFrame = window.requestAnimationFrame(function () {
        hintMoveFrame = 0;
        hint.style.transform = 'translate3d(' + (event.clientX + 14) + 'px, ' + (event.clientY + 14) + 'px, 0)';
      });
    }

    dialog.addEventListener('open', function () {
      if (smoothScroller) smoothScroller.stop();
      document.documentElement.classList.add('photo-dialog-open');
      updateHint();
    });

    dialog.addEventListener('close', function () {
      if (smoothScroller) smoothScroller.start();
      document.documentElement.classList.remove('photo-dialog-open');
      updateHint();
    });

    if (gridSection) {
      gridSection.addEventListener('mouseenter', function () {
        hintHovering = true;
        updateHint();
      });
      gridSection.addEventListener('mouseleave', function () {
        hintHovering = false;
        updateHint();
      });
    }

    if (resetButton) {
      resetButton.addEventListener('click', function () {
        interactionEnabled = false;
        resetButton.classList.remove('is-visible');
        dragInstances.forEach(function (instance) { instance.reset(); });
      });
      resetButton.addEventListener('mouseenter', function () {
        hintOnReset = true;
        updateHint();
      });
      resetButton.addEventListener('mouseleave', function () {
        hintOnReset = false;
        updateHint();
      });
    }

    if (hint) {
      window.addEventListener('pointermove', scheduleHintMove, { passive: true });
    }

    window.addEventListener('scroll', function () {
      updateHint();
      scheduleScrollBackground();
    }, { passive: true });

    initSmoothScroll();
    updateScrollBackground();
    bindCanvas();

    if (typeof isMobileQuery.addEventListener === 'function') {
      isMobileQuery.addEventListener('change', switchCanvas);
    } else {
      isMobileQuery.addListener(switchCanvas);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhotoGallery, { once: true });
  } else {
    initPhotoGallery();
  }
})();
```

- [ ] **Step 2: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add assets/js/photo.js
git commit -m "feat(photo): 画布状态机、Reset 与提示标签逻辑"
```

---

### Task 6: 查看器 HTML 结构改造

**Files:**
- Modify: `_layouts/photo.html:125-150`（dialog 部分）

- [ ] **Step 1: 替换 dialog 结构**

将 `photo.html` 中 `<dialog class="photo-dialog" ...>` 到 `</dialog>`（约第 125-150 行）整体替换为：

```html
  <dialog class="photo-dialog" data-photo-dialog aria-labelledby="photo-dialog-title">
    <button class="photo-dialog__close" type="button" data-photo-close aria-label="关闭作品查看器">×</button>
    <div class="photo-dialog__content">
      <div class="photo-dialog__main">
        <div class="photo-dialog__image-wrap">
          <img
            class="photo-dialog__image"
            data-photo-dialog-image
            src=""
            alt=""
            role="button"
            tabindex="0"
            draggable="false"
          >
          <span class="photo-dialog__zoom-indicator" data-photo-zoom-indicator aria-hidden="true">( + )</span>
        </div>
        <div class="photo-dialog__info">
          <p data-photo-dialog-count>01 / {{ photo_count }}</p>
          <h2 id="photo-dialog-title" data-photo-dialog-title></h2>
          <p data-photo-dialog-category></p>
          <p data-photo-dialog-description></p>
        </div>
        <div class="photo-dialog__controls">
          <button type="button" data-photo-previous aria-label="查看上一件作品">←</button>
          <button type="button" data-photo-next aria-label="查看下一件作品">→</button>
        </div>
      </div>
      <div class="photo-dialog__thumbs" data-photo-thumbs aria-label="作品缩略图列表">
        {% for item in site.data.photo %}
        <button
          type="button"
          class="photo-dialog__thumb"
          data-photo-thumb="{{ forloop.index0 }}"
          data-photo-src="{{ item.src | relative_url }}"
          data-photo-title="{{ item.title }}"
          data-photo-category="{{ item.category }} {{ item.year }}"
          data-photo-description="{{ item.description }}"
          aria-label="缩略图 {{ forloop.index }}"
          aria-pressed="false"
        >
          <img src="{{ item.src | relative_url }}" alt="" loading="lazy" draggable="false" width="200" height="250">
        </button>
        {% endfor %}
      </div>
    </div>
  </dialog>
```

（缩略图按钮承载全部照片数据，查看器 JS 从这里读取，见 Task 8）

- [ ] **Step 2: 更新脚本引用**

`photo.html` 底部脚本区（约第 152-156 行）在 `photo.js` 之前加入：

```html
  <script src="{{ '/assets/js/photo-drag.js' | relative_url }}" defer></script>
  <script src="{{ '/assets/js/photo-viewer.js' | relative_url }}" defer></script>
```

最终脚本顺序：theme.js → nav.js → prefetch.js → lenis → photo-drag.js → photo-viewer.js → photo.js（defer 按序执行）。

- [ ] **Step 3: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功，`_site/photo/index.html` 中包含 `data-photo-thumbs` 且缩略图数量等于 49。

- [ ] **Step 4: 提交**

```bash
git add _layouts/photo.html
git commit -m "feat(photo): 查看器改 Overlay 结构（缩略图侧栏 + 缩放角标）"
```

---

### Task 7: 查看器 SCSS

**Files:**
- Modify: `_sass/_photo.scss`

- [ ] **Step 1: 替换 dialog 样式**

将 `_sass/_photo.scss` 中 `.photo-dialog` 至 `.photo-dialog-open` 的规则（约第 495-608 行）替换为：

```scss
.photo-dialog {
  background: #0d0d0d;
  border: 0;
  color: #f4f2ec;
  height: 100dvh;
  margin: 0;
  max-height: none;
  max-width: none;
  overflow: hidden;
  padding: 0;
  width: 100vw;
}

.photo-dialog::backdrop {
  background: #0d0d0d;
}

.photo-dialog__close,
.photo-dialog__controls button {
  background: transparent;
  border: 0;
  color: #f4f2ec;
  cursor: pointer;
  font: inherit;
}

.photo-dialog__close {
  font-size: 31px;
  line-height: 1;
  padding: 0;
  position: absolute;
  right: 24px;
  top: 18px;
  z-index: 3;
}

.photo-dialog__content {
  display: flex;
  height: 100%;
  position: relative;
  width: 100%;
}

.photo-dialog__main {
  flex: 1 1 auto;
  min-width: 0;
  position: relative;
}

.photo-dialog__image-wrap {
  align-items: center;
  display: flex;
  inset: 48px 24px 62px 68px;
  justify-content: center;
  overflow: hidden;
  position: absolute;
  --photo-pan-x: 0px;
  --photo-pan-y: 0px;
}

.photo-dialog__image {
  -webkit-user-drag: none;
  cursor: zoom-in;
  display: block;
  height: 100%;
  object-fit: contain;
  transform: translate3d(0, 0, 0) scale(1);
  transform-origin: center;
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
  width: 100%;
  will-change: transform;
}

.photo-dialog__zoom-indicator {
  bottom: 14px;
  color: #fff;
  font-size: 13px;
  letter-spacing: 0;
  mix-blend-mode: difference;
  pointer-events: none;
  position: absolute;
  right: 22px;
  z-index: 2;
}

.photo-dialog__info {
  bottom: 17px;
  max-width: 460px;
  pointer-events: none;
  position: absolute;
  right: 24px;
  text-align: right;
  width: 36vw;
  z-index: 2;
}

.photo-dialog__info p {
  color: #a8a59e;
  font-size: 12px;
  line-height: 1.45;
  margin: 0 0 10px;
}

.photo-dialog__info h2 {
  font-size: clamp(22px, 2.3vw, 38px);
  font-weight: 400;
  line-height: 1;
  margin: 0 0 14px;
}

.photo-dialog__controls {
  bottom: 24px;
  display: flex;
  gap: 20px;
  left: 24px;
  position: absolute;
}

.photo-dialog__controls button {
  font-size: 26px;
  padding: 5px;
}

.photo-dialog__thumbs {
  display: flex;
  flex: 0 0 92px;
  flex-direction: column;
  gap: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 76px 14px 24px 0;
  position: relative;
  scrollbar-width: none;
  touch-action: none;
  width: 92px;
}

.photo-dialog__thumbs::-webkit-scrollbar {
  display: none;
}

.photo-dialog__thumb {
  background: transparent;
  border: 0;
  cursor: pointer;
  flex: 0 0 auto;
  opacity: 0.55;
  padding: 0;
  position: relative;
  transition: opacity 250ms ease, transform 300ms cubic-bezier(0.215, 0.61, 0.355, 1);
  transform: scale(1);
  width: 78px;
}

.photo-dialog__thumb img {
  display: block;
  height: auto;
  width: 100%;
}

.photo-dialog__thumb:hover,
.photo-dialog__thumb.is-active {
  opacity: 1;
  transform: scale(1.5);
}

.photo-dialog__thumb.is-active {
  z-index: 1;
}

.photo-dialog__thumb:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 2px;
}

.photo-dialog-open {
  overflow: hidden;
}
```

- [ ] **Step 2: 修改 720px 断点内的 dialog 规则**

`@media (max-width: 720px)` 块内的 dialog 相关规则（约第 781-817 行）替换为：

```scss
  .photo-dialog {
    padding: 0;
  }

  .photo-dialog__close {
    right: 16px;
    top: 12px;
  }

  .photo-dialog__content {
    flex-direction: column;
  }

  .photo-dialog__main {
    flex: 1 1 auto;
    min-height: 0;
  }

  .photo-dialog__image-wrap {
    inset: 48px 16px 12px;
  }

  .photo-dialog__info {
    bottom: auto;
    left: 16px;
    max-width: calc(100% - 32px);
    right: 16px;
    text-align: left;
    top: 48px;
  }

  .photo-dialog__info p {
    margin-bottom: 6px;
  }

  .photo-dialog__info h2 {
    margin-bottom: 8px;
  }

  .photo-dialog__controls {
    bottom: auto;
    left: 16px;
    top: 46px;
  }

  .photo-dialog__thumbs {
    align-items: center;
    flex: 0 0 92px;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 10px 16px;
    width: 100%;
  }

  .photo-dialog__thumb {
    flex: 0 0 auto;
    width: 64px;
  }
```

注意：移动端 info/controls 移到顶部（避免与底部缩略图条冲突）；`photo-dialog__zoom-indicator` 移动端保留右下角默认位置。

- [ ] **Step 3: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功。

- [ ] **Step 4: 提交**

```bash
git add _sass/_photo.scss
git commit -m "feat(photo): 查看器 Overlay 样式（缩略图侧栏 + 缩放角标）"
```

---

### Task 8: 查看器逻辑 photo-viewer.js

**Files:**
- Create: `assets/js/photo-viewer.js`

- [ ] **Step 1: 创建查看器模块**

```js
(function () {
  'use strict';

  function initViewer() {
    var dialog = document.querySelector('[data-photo-dialog]');
    if (!dialog) return;

    var image = dialog.querySelector('[data-photo-dialog-image]');
    var imageWrap = dialog.querySelector('.photo-dialog__image-wrap');
    var title = dialog.querySelector('[data-photo-dialog-title]');
    var category = dialog.querySelector('[data-photo-dialog-category]');
    var description = dialog.querySelector('[data-photo-dialog-description]');
    var count = dialog.querySelector('[data-photo-dialog-count]');
    var zoomIndicator = dialog.querySelector('[data-photo-zoom-indicator]');
    var thumbs = dialog.querySelector('[data-photo-thumbs]');
    var thumbButtons = Array.from(dialog.querySelectorAll('[data-photo-thumb]'));
    var closeButton = dialog.querySelector('[data-photo-close]');
    var prevButton = dialog.querySelector('[data-photo-previous]');
    var nextButton = dialog.querySelector('[data-photo-next]');

    var currentIndex = 0;
    var isTransitioning = false;
    var scale = 1;
    var wheelDelta = 0;
    var wheelResetTimer = 0;
    var thumbDrag = null;
    var total = thumbButtons.length;

    function getWork(index) {
      var thumb = thumbButtons[index];
      if (!thumb) return { src: '', title: '', category: '', description: '' };
      return {
        src: thumb.dataset.photoSrc || '',
        title: thumb.dataset.photoTitle || '',
        category: thumb.dataset.photoCategory || '',
        description: thumb.dataset.photoDescription || ''
      };
    }

    function applyScale() {
      var panX = imageWrap.style.getPropertyValue('--photo-pan-x') || '0px';
      var panY = imageWrap.style.getPropertyValue('--photo-pan-y') || '0px';
      image.style.transform = 'translate3d(' + panX + ', ' + panY + ', 0) scale(' + scale.toFixed(3) + ')';
      var zoomed = scale > 1;
      if (zoomIndicator) zoomIndicator.textContent = zoomed ? '( - )' : '( + )';
      image.setAttribute('aria-label', zoomed ? '缩小当前图片' : '放大当前图片');
    }

    function preloadAdjacentImages() {
      [-1, 1].forEach(function (offset) {
        var preloadIndex = (currentIndex + offset + total) % total;
        var preload = new Image();
        preload.src = getWork(preloadIndex).src;
      });
    }

    function updateThumbs() {
      thumbButtons.forEach(function (thumb, index) {
        var active = index === currentIndex;
        thumb.classList.toggle('is-active', active);
        thumb.setAttribute('aria-pressed', String(active));
      });
      var activeThumb = thumbButtons[currentIndex];
      if (activeThumb) {
        activeThumb.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }

    function render(index) {
      currentIndex = (index + total) % total;
      var work = getWork(currentIndex);
      scale = 1;
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
      applyScale();
      image.src = work.src;
      image.alt = work.title;
      title.textContent = work.title;
      category.textContent = work.category;
      description.textContent = work.description;
      count.textContent = String(currentIndex + 1).padStart(2, '0')
        + ' / '
        + String(total).padStart(2, '0');
      updateThumbs();
      preloadAdjacentImages();
    }

    function waitForCurrentImage() {
      if (image.complete && image.naturalWidth > 0) {
        return typeof image.decode === 'function' ? image.decode().catch(function () { }) : Promise.resolve();
      }

      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }

    function animateImage(keyframes, options) {
      if (typeof image.animate !== 'function') return Promise.resolve();

      var animation = image.animate(keyframes, options);
      return animation.finished.catch(function () { }).then(function () {
        animation.cancel();
      });
    }

    function transitionTo(index, direction) {
      if (isTransitioning || total < 2) return;

      var nextIndex = (index + total) % total;
      var movement = direction > 0 ? -46 : 46;
      isTransitioning = true;

      animateImage([
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        { opacity: 0, transform: 'translate3d(0, ' + movement + 'px, 0) scale(0.985)' }
      ], {
        duration: 420,
        easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
        fill: 'forwards'
      }).then(function () {
        render(nextIndex);
        return waitForCurrentImage();
      }).then(function () {
        return animateImage([
          { opacity: 0, transform: 'translate3d(0, ' + (-movement) + 'px, 0) scale(0.985)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' }
        ], {
          duration: 620,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards'
        });
      }).finally(function () {
        isTransitioning = false;
      });
    }

    function open(index) {
      render(index);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      image.focus({ preventScroll: true });
    }

    function close() {
      dialog.close();
    }

    function toggleZoom() {
      if (isTransitioning) return;
      scale = scale > 1 ? 1 : 1.5;
      applyScale();
    }

    thumbButtons.forEach(function (thumb, index) {
      thumb.addEventListener('click', function () {
        if (thumbDrag && thumbDrag.moved) return;
        var direction = index > currentIndex ? 1 : -1;
        transitionTo(index, direction);
      });
    });

    image.addEventListener('click', toggleZoom);
    image.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleZoom();
    });

    imageWrap.addEventListener('wheel', function (event) {
      event.preventDefault();
      if (isTransitioning) return;
      scale = Math.min(3, Math.max(1, scale - event.deltaY * 0.001));
      applyScale();
    }, { passive: false });

    imageWrap.addEventListener('pointermove', function (event) {
      if (scale <= 1 || event.pointerType === 'touch') return;

      var rect = imageWrap.getBoundingClientRect();
      var normalizedX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      var normalizedY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      imageWrap.style.setProperty('--photo-pan-x', normalizedX * rect.width * 0.14 + 'px');
      imageWrap.style.setProperty('--photo-pan-y', normalizedY * rect.height * 0.14 + 'px');
      applyScale();
    });

    imageWrap.addEventListener('pointerleave', function () {
      if (scale <= 1) return;
      imageWrap.style.setProperty('--photo-pan-x', '0px');
      imageWrap.style.setProperty('--photo-pan-y', '0px');
      applyScale();
    });

    thumbs.addEventListener('wheel', function (event) {
      event.preventDefault();
      var vertical = thumbs.classList.contains('is-horizontal') ? 0 : 1;
      thumbs.scrollTop += event.deltaY * vertical;
      thumbs.scrollLeft += event.deltaX * (1 - vertical) + event.deltaY * (1 - vertical);
    }, { passive: false });

    thumbs.addEventListener('pointerdown', function (event) {
      thumbDrag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        st: thumbs.scrollTop,
        sl: thumbs.scrollLeft,
        moved: false
      };
      try { thumbs.setPointerCapture(event.pointerId); } catch (err) {}
    });

    thumbs.addEventListener('pointermove', function (event) {
      if (!thumbDrag || event.pointerId !== thumbDrag.id) return;
      var dx = event.clientX - thumbDrag.x;
      var dy = event.clientY - thumbDrag.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) thumbDrag.moved = true;
      thumbs.scrollTop = thumbDrag.st - dy;
      thumbs.scrollLeft = thumbDrag.sl - dx;
    });

    thumbs.addEventListener('pointerup', function (event) {
      if (!thumbDrag || event.pointerId !== thumbDrag.id) return;
      if (thumbDrag.moved) {
        thumbs.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
        }, { once: true, capture: true });
      }
      thumbDrag = null;
    });

    thumbs.addEventListener('pointercancel', function () {
      thumbDrag = null;
    });

    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () {
      transitionTo(currentIndex - 1, -1);
    });
    nextButton.addEventListener('click', function () {
      transitionTo(currentIndex + 1, 1);
    });

    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) close();
    });

    dialog.addEventListener('cancel', function () {
      scale = 1;
      applyScale();
    });

    document.addEventListener('keydown', function (event) {
      if (!dialog.open) return;
      if (event.key === 'ArrowLeft') transitionTo(currentIndex - 1, -1);
      if (event.key === 'ArrowRight') transitionTo(currentIndex + 1, 1);
    });

    window.PhotoViewer = { open: open, close: close };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initViewer, { once: true });
  } else {
    initViewer();
  }
})();
```

注意：`thumbs.classList.contains('is-horizontal')` 由 CSS 断点驱动不可行（CSS 类不随断点变化）。改为运行时判断宽度：

```js
    thumbs.addEventListener('wheel', function (event) {
      event.preventDefault();
      var horizontal = thumbs.offsetWidth >= thumbs.offsetHeight * 1.5;
      if (horizontal) {
        thumbs.scrollLeft += event.deltaY;
      } else {
        thumbs.scrollTop += event.deltaY;
      }
    }, { passive: false });
```

**用上面这个版本替换 Step 1 中的 `thumbs.addEventListener('wheel', ...)` 块**（通过容器宽高比判断横向/竖向，避免断点类同步问题）。

- [ ] **Step 2: 验证构建**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll build
```
Expected: 构建成功。

- [ ] **Step 3: 提交**

```bash
git add assets/js/photo-viewer.js
git commit -m "feat(photo): 查看器 Overlay 逻辑（缩略图侧栏 + 缩放 + 分页）"
```

---

### Task 9: 完整交互验证（Playwright）

**Files:**
- Create: `/tmp/ps-render/verify.mjs`（临时验证脚本，不进仓库）

- [ ] **Step 1: 启动本地服务**

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll serve --port 4000 --host 127.0.0.1 > /tmp/jekyll.log 2>&1 &
sleep 12 && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/photo/
```
Expected: `200`。

- [ ] **Step 2: 创建验证脚本**

```js
import { chromium } from 'playwright';

const browser = await chromium.launch({
  executablePath: '/home/peter/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome'
});
const errors = [];

async function assert(condition, message) {
  if (!condition) {
    errors.push('FAIL: ' + message);
    console.log('FAIL: ' + message);
  } else {
    console.log('PASS: ' + message);
  }
}

// ===== 桌面验证 =====
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desktop.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
desktop.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console.error: ' + msg.text());
});
await desktop.goto('http://127.0.0.1:4000/photo/', { waitUntil: 'networkidle' });
await desktop.waitForTimeout(1500);

// 桌面容器可见、移动容器隐藏
const desktopVisible = await desktop.evaluate(() => {
  const d = document.querySelector('[data-photo-canvas]');
  const m = document.querySelector('[data-photo-canvas-mobile]');
  return { d: d && d.offsetParent !== null, m: m && m.offsetParent !== null };
});
await assert(desktopVisible.d, '桌面容器可见');
await assert(!desktopVisible.m, '移动容器隐藏');

// 行重叠验证：第二行顶部 < 第一行底部（负 margin 生效）
const rowOverlap = await desktop.evaluate(() => {
  const rows = document.querySelectorAll('[data-photo-canvas] .photographyImageGrid__row');
  if (rows.length < 2) return false;
  const r1 = rows[0].getBoundingClientRect();
  const r2 = rows[1].getBoundingClientRect();
  return r2.top < r1.bottom;
});
await assert(rowOverlap, '行重叠交错生效');

// 拖拽：pointer 拖动图片，transform 变化
await desktop.evaluate(() => { document.documentElement.scrollTop = 900; });
await desktop.waitForTimeout(800);
const dragResult = await desktop.evaluate(async () => {
  const card = document.querySelector('[data-photo-canvas] [data-photo-card]');
  if (!card) return { error: 'no card' };
  const draggable = card.querySelector('.photographyImageGridItem__draggable');
  const rect = draggable.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const before = getComputedStyle(draggable).transform;
  // 模拟拖拽
  draggable.dispatchEvent(new PointerEvent('pointerdown', {
    pointerId: 1, pointerType: 'mouse', button: 0, clientX: cx, clientY: cy, bubbles: true
  }));
  for (let i = 1; i <= 6; i++) {
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, pointerType: 'mouse', clientX: cx + i * 20, clientY: cy + i * 10, bubbles: true
    }));
    await new Promise(r => setTimeout(r, 16));
  }
  window.dispatchEvent(new PointerEvent('pointerup', {
    pointerId: 1, pointerType: 'mouse', clientX: cx + 120, clientY: cy + 60, bubbles: true
  }));
  await new Promise(r => setTimeout(r, 100));
  const after = getComputedStyle(draggable).transform;
  return { before, after, changed: before !== after };
});
await assert(dragResult.changed === true, '拖拽后 transform 变化（实际: ' + dragResult.before + ' → ' + dragResult.after + '）');

// Reset 按钮出现并点击后图片回原位
const resetVisible = await desktop.evaluate(() =>
  document.querySelector('[data-photo-reset]').classList.contains('is-visible'));
await assert(resetVisible, '首次拖拽后 Reset 按钮可见');

await desktop.evaluate(() => document.querySelector('[data-photo-reset]').click());
await desktop.waitForTimeout(1200);
const resetResult = await desktop.evaluate(() => {
  const draggable = document.querySelector('[data-photo-canvas] .photographyImageGridItem__draggable');
  return getComputedStyle(draggable).transform;
});
await assert(/matrix\(1, 0, 0, 1, 0, 0\)/.test(resetResult), 'Reset 后 transform 回原位（实际: ' + resetResult + '）');

// 点击卡片打开查看器
await desktop.evaluate(() => {
  const card = document.querySelector('[data-photo-canvas] [data-photo-card]');
  card.click();
});
await desktop.waitForTimeout(500);
const dialogOpen = await desktop.evaluate(() => document.querySelector('[data-photo-dialog]').open);
await assert(dialogOpen, '点击卡片打开查看器');

// 缩略图侧栏存在且数量正确
const thumbCount = await desktop.evaluate(() =>
  document.querySelectorAll('[data-photo-thumb]').length);
await assert(thumbCount === 49, '缩略图数量为 49（实际: ' + thumbCount + '）');

// 点击缩略图切换
const switchResult = await desktop.evaluate(() => {
  const thumbs = document.querySelectorAll('[data-photo-thumb]');
  const countEl = document.querySelector('[data-photo-dialog-count]');
  thumbs[2].click();
  return countEl.textContent;
});
await desktop.waitForTimeout(800);
await assert(/03 \/ 49/.test(switchResult), '点击缩略图后分页更新（实际: ' + switchResult + '）');

// 关闭查看器
await desktop.evaluate(() => document.querySelector('[data-photo-close]').click());
await desktop.waitForTimeout(300);

// ===== 移动端验证 =====
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
mobile.on('pageerror', (e) => errors.push('mobile pageerror: ' + e.message));
await mobile.goto('http://127.0.0.1:4000/photo/', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(1500);

const mobileLayout = await mobile.evaluate(() => {
  const d = document.querySelector('[data-photo-canvas]');
  const m = document.querySelector('[data-photo-canvas-mobile]');
  const row = document.querySelector('[data-photo-canvas-mobile] .photographyImageGrid__row');
  const cols = row ? getComputedStyle(row).gridTemplateColumns.split(' ').length : 0;
  return { dVisible: d && d.offsetParent !== null, mVisible: m && m.offsetParent !== null, cols };
});
await assert(!mobileLayout.dVisible, '移动端桌面容器隐藏');
await assert(mobileLayout.mVisible, '移动端移动容器可见');
await assert(mobileLayout.cols === 3, '移动端 3 列网格（实际: ' + mobileLayout.cols + '）');

// 移动端点击打开查看器
await mobile.evaluate(() => {
  const card = document.querySelector('[data-photo-canvas-mobile] [data-photo-card]');
  card.click();
});
await mobile.waitForTimeout(500);
const mobileDialog = await mobile.evaluate(() => document.querySelector('[data-photo-dialog]').open);
await assert(mobileDialog, '移动端点击打开查看器');

await mobile.evaluate(() => document.querySelector('[data-photo-close]').click());
await mobile.waitForTimeout(300);

console.log('\n===== 汇总 =====');
console.log(errors.length ? '有 ' + errors.length + ' 个失败' : '全部通过');
await browser.close();
process.exit(errors.length ? 1 : 0);
```

- [ ] **Step 3: 运行验证**

```bash
cd /tmp/ps-render && node verify.mjs
```
Expected: 所有 `PASS`，汇总 "全部通过"，exit 0。若有 FAIL，先修复对应代码再重跑（修复后重新执行 `bundle exec jekyll build` 并重启 jekyll serve 前先 `pkill -f "jekyll serve"`）。

- [ ] **Step 4: 关闭服务并确认工作区状态**

```bash
pkill -f "jekyll serve"
cd /home/peter/projects/bigpeter-blog && git status --short
```
Expected: 无未提交改动（或仅有预期的未提交文件，审查后决定是否提交）。验证脚本在 /tmp 不进仓库。

---

### Task 10: 收尾与回归检查

**Files:**
- 无新增，仅检查

- [ ] **Step 1: 检查控制台错误与回归**

启动服务并用 Playwright 快速检查 hero/statement 部分无回归（页面滚动无错、statement 背景切换正常）：

```bash
cd /home/peter/projects/bigpeter-blog && bundle exec jekyll serve --port 4000 --host 127.0.0.1 > /tmp/jekyll.log 2>&1 &
sleep 12
cd /tmp/ps-render && cat > regression.mjs << 'EOF'
import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/home/peter/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:4000/photo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
// 滚动整个页面（hero → statement → grid），触发 statement 逻辑
for (let i = 0; i < 20; i++) {
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(150);
}
await page.waitForTimeout(500);
console.log(errors.length ? 'REGRESSION ERRORS: ' + errors.join(' | ') : '无页面错误');
await browser.close();
process.exit(errors.length ? 1 : 0);
EOF
node regression.mjs
```

Expected: "无页面错误"。

- [ ] **Step 2: 验证 reduced-motion 降级**

```bash
cd /tmp/ps-render && cat > reduced-motion.mjs << 'EOF'
import { chromium } from 'playwright';
const browser = await chromium.launch({
  executablePath: '/home/peter/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await page.goto('http://127.0.0.1:4000/photo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// 拖动后无惯性动画（transform 不随时间变化）
const drag = await page.evaluate(async () => {
  const card = document.querySelector('[data-photo-canvas] [data-photo-card]');
  const draggable = card.querySelector('.photographyImageGridItem__draggable');
  const rect = draggable.getBoundingClientRect();
  draggable.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'mouse', button: 0, clientX: rect.left + 50, clientY: rect.top + 50, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: rect.left + 200, clientY: rect.top + 100, bubbles: true }));
  window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'mouse', clientX: rect.left + 200, clientY: rect.top + 100, bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  const t1 = getComputedStyle(draggable).transform;
  await new Promise(r => setTimeout(r, 400));
  const t2 = getComputedStyle(draggable).transform;
  return { t1, t2, settled: t1 === t2 };
});
console.log(drag.settled ? 'PASS: reduced-motion 下无惯性动画' : 'FAIL: 仍有惯性动画 ' + drag.t1);
await browser.close();
process.exit(drag.settled ? 0 : 1);
EOF
node reduced-motion.mjs
```

Expected: `PASS: reduced-motion 下无惯性动画`。（若该环境 reducedMotion 选项不生效，则跳过此项并在汇报中注明。）

- [ ] **Step 3: 关闭服务**

```bash
pkill -f "jekyll serve"
```

- [ ] **Step 4: 确认无遗漏并提交收尾**

```bash
cd /home/peter/projects/bigpeter-blog && git status --short && git log --oneline -8
```
Expected: 工作区干净（或仅剩预期文件），提交历史包含 Task 1-8 的提交。若有未提交改动，审查后单独提交。

---

## Self-Review 记录（执行前检查）

- **Spec 覆盖**：行交错布局（Task 3）、拖拽（Task 4-5）、Reset（Task 5）、提示标签（Task 5）、双容器断点（Task 2-3）、Overlay 查看器（Task 6-8）、移除视差（Task 2-3、5）、GSAP 备用方案（spec 记录，不实现）、Lenis/statement 保留（Task 5）
- **无占位符**：所有代码完整给出
- **类型一致性**：`PhotoDrag.create` 返回 `{reset, destroy, isMoved}`（Task 4）与 Task 5 调用 `instance.reset()`/`instance.destroy()` 一致；`window.PhotoViewer = { open, close }`（Task 8）与 Task 5 `window.PhotoViewer.open(index)` 一致；数据属性 `data-photo-src/title/category/description` 在 Task 6 渲染、Task 8 读取一致
