# AGENTS.md - OpenCode 项目指南

## 项目概述
- Jekyll 静态博客，使用 Ruby、HTML、SCSS、JavaScript、Liquid 模板
- 主要语言为中文，代码注释可使用英文
- 部署到 GitHub Pages / Cloudflare Pages

## 开发命令
- **安装依赖**：`bundle install`
- **开发服务器**：`bundle exec jekyll serve`
- **实时重载**：`bundle exec jekyll serve --livereload`
- **构建站点**：`bundle exec jekyll build`

**重要**：修改 `_config.yml` 后需重启开发服务器。

## 测试验证
项目无自动化测试套件。修改后必须：
1. 运行 `bundle exec jekyll build` 确保构建成功
2. 启动开发服务器检查页面渲染
3. 测试响应式布局、导航功能、控制台错误

## Jekyll 注意事项
- 文章放在 `_posts/`，命名格式：`YYYY-MM-DD-slug.md`
- Front Matter 必须包含：`layout`、`title`、`date`
- 静态资源路径使用：`{{ '/assets/...' | absolute_url }}`
- 排除目录：`_site/`、`.jekyll-cache/`、`.bundle/`、`vendor/`

## 代码风格
- **缩进**：遵循 `.editorconfig`（Markdown 4空格，YAML/JSON/JS/CSS/HTML/Ruby/Liquid 2空格）
- **文件/目录命名**：小写字母，单词间用连字符（如 `my-component.html`）
- **CSS 类名**：小写字母，单词间用连字符（如 `.glass-container`）
- **JavaScript 变量**：camelCase
- **Liquid 变量**：snake_case
- **SCSS 变量**：定义在 `_sass/_variables.scss`
- **媒体查询**：移动优先原则

## Git 工作流
- **提交消息格式**：`类型(范围): 描述`
  - 类型：`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`
  - 范围：可选，如 `layout`、`css`、`js`、`post`
  - 示例：`feat(layout): 添加响应式导航栏`

## AI 协作指南
1. **理解上下文**：先阅读相关文件再修改
2. **保持一致性**：遵循现有代码风格和模式
3. **渐进式改进**：一次只解决一个问题
4. **测试意识**：修改后检查页面渲染和功能
5. **文档更新**：重要变更需更新 README 或相关注释

## 修改范围
- ✅ 修复 bug、优化性能、改进样式（不改变视觉效果）
- ✅ 添加新功能（需先确认需求）
- ✅ 更新文档、注释
- ✅ 重构代码（保持功能不变）
- ❌ 未经确认删除重要功能
- ❌ 大规模重写核心架构
- ❌ 修改部署配置（需明确授权）

## 浏览器兼容性
- 目标现代浏览器（Chrome 90+、Safari 14+）
- 玻璃效果使用 `backdrop-filter: blur()`，部分浏览器需测试降级方案
- 移动端需测试触摸交互和事件处理