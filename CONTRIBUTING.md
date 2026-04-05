# 贡献指南

欢迎为 bigpeter 博客项目贡献代码！请花时间阅读本指南，以确保贡献过程顺利。

## 行为准则

本项目遵循 [贡献者公约](https://www.contributor-covenant.org/zh-cn/version/2/1/code_of_conduct/)。
请尊重他人，保持友好、包容的交流环境。

## 如何贡献

### 报告问题
1. 在 [Issues](https://github.com/your-repo/issues) 页面搜索是否已有相同问题
2. 如无重复，创建新 issue
3. 清晰描述问题，包括：
   - 问题描述
   - 重现步骤
   - 期望行为
   - 实际行为
   - 环境信息（系统、浏览器、Jekyll 版本）
4. 如有相关截图或日志，请一并提供

### 功能请求
1. 说明功能用途和预期效果
2. 描述实现思路（可选）
3. 讨论可行性后再开始编码

### 提交代码
1. **Fork 仓库**：点击 Fork 按钮创建个人副本
2. **创建分支**：基于 `main` 创建功能分支
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **实现功能**：遵循[代码风格](#代码风格)
4. **测试验证**：确保修改不影响现有功能
5. **提交代码**：使用规范的提交消息
6. **推送分支**：推送到你的 Fork
7. **创建 PR**：向原仓库的 `main` 分支发起 Pull Request

## 开发环境

### 环境配置
```bash
# 1. 安装 Ruby（版本 >= 2.5）
ruby -v

# 2. 安装 Bundler
gem install bundler

# 3. 克隆仓库
git clone https://github.com/your-repo/bigpeter-blog.git
cd bigpeter-blog

# 4. 安装依赖
bundle install

# 5. 启动开发服务器
bundle exec jekyll serve
```

### 项目结构
```
├── _posts/          # 博客文章（Markdown）
├── _layouts/        # 页面模板（HTML + Liquid）
├── _includes/       # 可重用组件
├── _sass/           # SCSS 样式文件
├── assets/          # 静态资源（CSS、JS、图片）
├── _config.yml      # Jekyll 配置
└── README.md        # 项目说明
```

## 代码风格

### 通用规则
- **缩进**：4 个空格（非 Tab）
- **编码**：UTF-8
- **行尾**：LF（Unix 风格）
- **行宽**：建议不超过 120 字符

### 文件命名
- 使用小写字母
- 单词间用连字符分隔
- 示例：`my-component.html`、`glass-effect.scss`

### HTML/Liquid
```html
<!-- 正确 -->
<div class="glass-container">
  <h2>{{ page.title }}</h2>
</div>

<!-- 避免 -->
<DIV CLASS="glassContainer">
  <h2>{{page.title}}</h2>
</DIV>
```

### CSS/SCSS
```scss
// 使用 SCSS 变量
$glass-bg: rgba(255, 255, 255, 0.1);

.glass-container {
  backdrop-filter: blur(20px);
  background: $glass-bg;
  
  // 移动端适配
  @media (max-width: 768px) {
    padding: 1rem;
  }
}
```

### JavaScript
```javascript
// 使用现代 ES6+ 语法
const initStars = () => {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  
  // 代码逻辑
};

// 使用 defer 加载
document.addEventListener('DOMContentLoaded', initStars);
```

### Markdown 文章
```markdown
---
layout: post
title: 文章标题
date: 2026-03-22
author: 作者名
tags: [标签1, 标签2]
---

## 二级标题

正文内容。

```js
// 代码示例
function example() {
  console.log('Hello');
}
```

## Git 提交

### 提交消息格式
```
类型(范围): 描述

详细说明（可选）
```

### 类型说明
- `feat`：新功能
- `fix`：bug 修复
- `docs`：文档更新
- `style`：代码格式（不影响功能）
- `refactor`：重构（非功能变更）
- `test`：测试相关
- `chore`：构建过程或工具变更

### 范围示例
- `layout`：布局相关
- `css`：样式相关
- `js`：JavaScript 相关
- `post`：文章内容
- `config`：配置文件

### 提交示例
```bash
# 新功能
git commit -m "feat(layout): 添加响应式导航栏"

# bug 修复
git commit -m "fix(js): 修复星空动画内存泄漏"

# 文档更新
git commit -m "docs: 更新贡献指南"
```

## Pull Request 流程

### PR 要求
1. **标题清晰**：说明变更内容
2. **描述详细**：
   - 解决了什么问题
   - 如何测试验证
   - 相关 issue 编号
3. **代码质量**：
   - 遵循代码风格
   - 添加适当注释
   - 无语法错误
4. **测试验证**：
   - 本地运行正常
   - 不影响现有功能

### 审查流程
1. 维护者会审查代码
2. 可能需要修改或讨论
3. 通过后合并到 `main`
4. 自动部署到生产环境

## 测试指南

### 基础测试
```bash
# 构建检查
bundle exec jekyll build

# 启动本地服务器
bundle exec jekyll serve

# 访问 http://localhost:4000 验证
```

### 测试要点
1. **功能测试**：新增功能按预期工作
2. **兼容性**：主流浏览器正常显示
3. **响应式**：移动端布局正常
4. **性能**：无明显性能下降
5. **可访问性**：键盘导航、屏幕阅读器支持

## 文档维护

### 需要更新的文档
- `README.md`：项目概述、使用说明
- `CLAUDE.md`：AI 协作指南
- `CONTRIBUTING.md`：本文件
- 代码注释：重要函数、复杂逻辑

### 文档标准
- 使用中文撰写
- 结构清晰、易于阅读
- 包含示例代码
- 及时更新过时信息

## 获取帮助

- **文档**：先查阅 README 和 CLAUDE.md
- **Issue**：搜索已有问题
- **讨论**：在 PR 或 issue 中提问
- **社区**：Jekyll 官方论坛、Stack Overflow

---

感谢你的贡献！🎉

*最后更新：2026-04-05*