# 文章页返回按钮功能实现

## 功能描述

在文章详情页，左上角的"回到顶部"按钮会自动变为"返回文章列表"按钮：
1. **初始状态**：向左箭头，点击返回文章列表页
2. **滚动后**：箭头旋转为向上，功能变为"回到顶部"
3. **平滑过渡**：箭头旋转动画，体验流畅

## 修改的文件

### 1. `_includes/header.html`
- 为文章页的按钮添加 `post-back-btn` 类
- 添加 `data-back-url` 属性存储返回链接
- 动态设置 `aria-label` 属性

### 2. `assets/js/nav.js`
- 修改 `bindTopBtnScroll()` 函数，检测文章页状态
- 修改 `bindTopBtnClick()` 函数，根据滚动状态切换功能
- 添加滚动阈值检测和状态切换逻辑

### 3. `_sass/_header.scss`
- 添加 `.post-back-btn` 样式类
- 实现箭头旋转动画（-90度 → 0度）
- 保持与现有样式系统的一致性

### 4. `assets/icon/back.svg`
- 创建左箭头图标文件（实际使用旋转实现）

## 技术实现

### CSS 动画
```css
.post-back-btn .top-btn__icon {
    transform: rotate(-90deg);  /* 向左箭头 */
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.post-back-btn.top-btn--scrolled .top-btn__icon {
    transform: rotate(0deg);  /* 向上箭头 */
}
```

### JavaScript 逻辑
```javascript
// 检测文章页
const isPostPage = topBtn.classList.contains('post-back-btn');

// 滚动状态检测
const isScrolled = window.scrollY > SCROLL_THRESHOLD;

// 功能切换
if (isPostPage && !isScrolled) {
    // 返回文章列表
    window.location.href = backUrl;
} else {
    // 回到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

## 使用说明

### 在文章页
1. 页面加载后，左上角显示向左箭头
2. 点击箭头返回文章列表页
3. 向下滚动超过 300px 后，箭头旋转为向上
4. 点击箭头回到页面顶部

### 在其他页面
- 行为与原来完全一致，无变化

## 响应式设计
- 移动端：按钮尺寸自动调整
- 平板端：正常显示
- 桌面端：正常显示

## 主题适配
- 暗色主题：使用白色图标
- 亮色主题：自动适配

## 注意事项
1. 滚动阈值为 300px，可在 `SCROLL_THRESHOLD` 常量中调整
2. 动画时间为 0.3s，使用 cubic-bezier 缓动函数
3. 按钮始终在文章页显示，无需滚动触发
4. 返回链接通过 `data-back-url` 属性配置