# CLAUDE.md - 项目协作指南

本文档为本项目（Jekyll 博客）的协作规则，供 AI 助手（Claude Code）及贡献者参考。

## 项目概述

- **类型**：Jekyll 静态博客
- **技术栈**：Ruby、Jekyll、HTML、CSS（SCSS）、JavaScript、Liquid 模板
- **语言**：中文为主，代码注释可使用英文
- **部署**：GitHub Pages / Cloudflare Pages

## 代码风格

### 通用规则
1. **缩进**：使用 4 个空格（非 Tab）
2. **换行**：Unix 风格（LF）
3. **字符集**：UTF-8
4. **行宽**：建议不超过 120 字符
5. **命名**：
   - 文件/目录：小写字母，单词间用连字符（如 `my-component.html`）
   - CSS 类：小写字母，单词间用连字符（如 `.glass-container`）
   - JavaScript 变量：camelCase
   - Liquid 变量：snake_case

### HTML
- 使用语义化标签
- 属性值使用双引号
- 自闭合标签不加斜杠（如 `<meta>`、`<img>`）
- 为重要图片添加 `alt` 属性

### CSS/SCSS
- 使用 SCSS 语法
- 类名使用 BEM 风格（可选）
- 颜色值使用十六进制或 rgba()
- 媒体查询使用移动优先原则
- 变量定义在 `_sass/_variables.scss`
- **液态玻璃样式系统**：统一定义在 `_sass/_liquid-glass.scss`
  - 使用 `@include liquid-glass-surface()` 调用基础玻璃卡片样式
  - 使用 `@include liquid-glass-hover()` 添加悬停动画效果
  - 核心组件：文章列表 `.post-item`、友链卡片 `.friend-link`、标签 `.tag-list-item` 等
  - **指令响应**：当用户说“用液态玻璃样式”时，自动执行以下操作：
    - 在 SCSS/CSS 中使用 `@include liquid-glass-surface()` 和 `@include liquid-glass-hover()` mixin
    - 确保页面布局包含标准的 JS 文件引用（`theme.js`、`stars.js`、`nav.js`、`prefetch.js`）
    - 遵循现有组件（如 `.post-item`、`.friend-link`）的样式模式
    - 优先复用 `_sass/_liquid-glass.scss` 中的定义，避免重复内联样式

### JavaScript
- 使用现代 ES6+ 语法
- 避免全局变量污染
- 使用 `defer` 或 `async` 加载脚本
- 重要功能添加注释

### Markdown 文章
- 文章放在 `_posts/` 目录，命名格式：`YYYY-MM-DD-slug.md`
- Front Matter 必须包含：`layout`、`title`、`date`
- 可选字段：`author`、`tags`、`categories`
- 使用三级标题为限（`##`、`###`、`####`）
- 代码块标注语言类型

## Git 工作流

### 分支策略
- `main`：生产分支，只接受合并请求
- `feature/*`：新功能分支
- `fix/*`：修复分支
- `docs/*`：文档更新

### 提交消息
- 格式：`类型(范围): 描述`
- 类型：`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`
- 范围：可选，如 `layout`、`css`、`js`、`post`
- 提交信息结尾不添加 Co-Authored-By 署名
- 示例：
  - `feat(layout): 添加响应式导航栏`
  - `fix(js): 修复星空动画性能问题`
  - `docs: 更新 README 部署说明`

### 合并请求
- 标题简洁明确
- 描述变更内容、测试方法、相关 issue
- 确保代码通过基础检查（无语法错误）

## AI 协作指南

### 对 Claude Code 的期望
1. **理解上下文**：先阅读相关文件再修改
2. **保持一致性**：遵循现有代码风格
3. **渐进式改进**：一次只解决一个问题
4. **测试意识**：修改后检查页面渲染
5. **文档更新**：重要变更需更新 README 或注释

### 修改范围
- ✅ 修复 bug、优化性能、改进样式(但是不能更改视觉效果)
- ✅ 添加新功能（需先确认需求）
- ✅ 更新文档、注释
- ✅ 重构代码（保持功能不变）
- ❌ 未经确认删除重要功能
- ❌ 大规模重写核心架构
- ❌ 修改部署配置（需明确授权）

### 特殊注意事项
1. **Jekyll 相关**：
   - 修改 `_config.yml` 后需重启服务
   - 新文章需正确设置 Front Matter
   - 静态资源路径使用 `{{ '/assets/...' | absolute_url }}`

2. **CSS 相关**：
   - 玻璃效果使用 `backdrop-filter: blur()`
   - 移动端需测试触摸交互
   - 动画考虑性能影响

3. **JavaScript 相关**：
   - 兼容现代浏览器（Chrome 90+、Safari 14+）
   - 移动端需测试事件处理
   - 避免阻塞主线程
   - **全局脚本**：所有页面统一加载 `theme.js`、`stars.js`、`nav.js`、`prefetch.js`
     - 提供主题切换、星空动画、导航交互、链接预加载等核心功能

## 本地开发

### 环境要求
- Ruby (>= 2.5)
- Bundler
- Jekyll (4.4.1)

### 常用命令
```bash
# 安装依赖
bundle install

# 启动开发服务器
bundle exec jekyll serve

# 带实时重载
bundle exec jekyll serve --livereload

# 构建静态站点
bundle exec jekyll build
```

### 测试要点
1. 检查控制台错误
2. 响应式布局测试
3. 导航功能正常
4. 文章渲染正确
5. 性能无明显下降

## 问题处理

### 常见问题
1. **CSS 未生效**：检查 SCSS 编译、缓存清除
2. **页面空白**：检查 Liquid 语法、Front Matter
3. **图片未加载**：检查路径、文件是否存在
4. **JavaScript 错误**：检查控制台、语法错误

### 求助途径
- 查看 Jekyll 官方文档
- 检查浏览器开发者工具
- 查看构建日志

---

*本文档会根据项目发展持续更新。最后更新：2026-04-06*