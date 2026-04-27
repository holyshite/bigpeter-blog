# AGENTS.md — OpenCode 项目指南

## 项目结构
- **Jekyll 博客**：Ruby/HTML/SCSS/JS/Liquid，中文为主
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
- **缩进**：遵循 `.editorconfig`（Markdown 4 空格，其余 2 空格）
- **命名**：文件/CSS `kebab-case`，JS `camelCase`，Liquid `snake_case`
- **SCSS 变量**：`_sass/_variables.scss`
- **媒体查询**：移动优先

## 样式系统
- **液态玻璃**：`_sass/_liquid-glass.scss`，使用 `liquid-glass-surface()` / `liquid-glass-hover()` mixin
  - 核心组件：`.post-item`、`.friend-link`、`.tag-list-item`、`.nav-indicator`

## 指令约定
- **"用液态玻璃样式"**：使用 mixin → 确保加载标准 JS → 遵循现有组件模式 → 复用 `_liquid-glass.scss`

## Git 提交格式
`类型(范围): 描述` — 类型：`feat`/`fix`/`docs`/`style`/`refactor`/`chore`

## 修改边界
- ✅ 修 bug、优化样式、加功能（确认需求）
- ❌ 删功能、重写架构、改部署配置（需明确授权）
