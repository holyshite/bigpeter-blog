# AGENTS.md — OpenCode 项目指南

## 项目概述
- **类型**：Jekyll 静态博客
- **技术栈**：Ruby、Jekyll、HTML、CSS（SCSS）、JavaScript、Liquid 模板
- **语言**：中文为主，代码注释可使用英文
- **部署**：GitHub Pages / Cloudflare Pages

## 项目结构
- **布局**：`_layouts/`（6 个独立 HTML，各含完整 `<head>`）
- **包含**：`_includes/`（`header.html`、`page.html`、`liquid-glass-filter.html`）
- **样式**：`_sass/`（10 个 partial，由 `style.scss` 导入）
- **脚本**：`assets/js/`（7 个 JS 文件）
- **图标**：`assets/icon/`（8 个 SVG）

## 全局脚本（所有页面加载）
`theme.js` `stars.js` `nav.js` `prefetch.js`

功能：主题切换、星空动画、导航栏交互、链接预加载

## 开发命令
| 命令 | 用途 |
|---|---|
| `bundle install` | 安装依赖 |
| `bundle exec jekyll serve` | 启动开发服务器 |
| `bundle exec jekyll serve --livereload` | 热重载 |
| `bundle exec jekyll build` | 构建站点 |

修改 `_config.yml` 后需重启。

## 测试
无自动化测试。手动检查：`jekyll build` 无报错 → `jekyll serve` 渲染正常 → 响应式/导航/控制台无报错。

## 代码规范

### 通用规则
- **缩进**：遵循 `.editorconfig`（Markdown 4 空格，其余 2 空格）
- **换行**：Unix 风格（LF）
- **字符集**：UTF-8
- **行宽**：建议不超过 120 字符
- **命名**：文件/CSS `kebab-case`，JS `camelCase`，Liquid `snake_case`

### HTML
- 使用语义化标签
- 属性值使用双引号
- 自闭合标签不加斜杠（如 `<meta>`、`<img>`）
- 为重要图片添加 `alt` 属性

### CSS/SCSS
- 使用 SCSS 语法，变量定义在 `_sass/_variables.scss`
- 类名使用 BEM 风格（可选）
- 颜色值使用十六进制或 rgba()
- 媒体查询使用移动优先原则
- 玻璃效果使用 `backdrop-filter: blur()`
- 移动端需测试触摸交互，动画考虑性能影响

### JavaScript
- 使用现代 ES6+ 语法
- 避免全局变量污染
- 使用 `defer` 或 `async` 加载脚本
- 兼容现代浏览器（Chrome 90+、Safari 14+）
- 避免阻塞主线程，重要功能添加注释

### Markdown 文章
- 文章放在 `_posts/` 目录，命名格式：`YYYY-MM-DD-slug.md`
- Front Matter 必须包含：`layout`、`title`、`date`
- 可选字段：`author`、`tags`、`categories`
- 使用三级标题为限（`##`、`###`、`####`）
- 代码块标注语言类型

## 样式系统
- **液态玻璃**：`_sass/_liquid-glass.scss`，使用 `liquid-glass-surface()` / `liquid-glass-hover()` mixin
  - 核心组件：`.post-item`、`.friend-link`、`.tag-list-item`、`.nav-indicator`

## 指令约定
- **"用液态玻璃样式"**：使用 mixin → 确保加载标准 JS → 遵循现有组件模式 → 复用 `_liquid-glass.scss`

## Git 工作流

### 分支策略
- `main`：生产分支，只接受合并请求
- `feature/*`：新功能分支
- `fix/*`：修复分支
- `docs/*`：文档更新

### 提交格式
`类型(范围): 描述`
- 类型：`feat`/`fix`/`docs`/`style`/`refactor`/`test`/`chore`
- 范围：可选，如 `layout`、`css`、`js`、`post`
- 结尾添加 `Co-Authored-By: Claude <noreply@anthropic.com>`
- 示例：`feat(layout): 添加响应式导航栏`

### 合并请求
- 标题简洁明确，描述变更内容、测试方法、相关 issue
- 确保代码通过基础检查（无语法错误）

## AI 协作指南

### 期望行为
1. 先阅读相关文件再修改，保持现有代码风格
2. 一次只解决一个问题，渐进式改进
3. 修改后检查页面渲染，重要变更更新文档

### 修改边界
- ✅ 修 bug、优化性能、改进样式（不能更改视觉效果）
- ✅ 加功能（确认需求）、更新文档、重构代码
- ❌ 删功能、重写架构、改部署配置（需明确授权）

### 特殊注意事项
- Jekyll：静态资源路径使用 `{{ '/assets/...' | absolute_url }}`
- Jekyll：新文章需正确设置 Front Matter
- CSS：`.nav-indicator` 等组件需遵循液态玻璃样式系统
- JS：移动端需测试事件处理

## 常见问题
1. **CSS 未生效**：检查 SCSS 编译、缓存清除
2. **页面空白**：检查 Liquid 语法、Front Matter
3. **图片未加载**：检查路径、文件是否存在
4. **JavaScript 错误**：检查控制台、语法错误

## 环境要求
- Ruby (>= 2.5)
- Bundler
- Jekyll (4.4.1)
