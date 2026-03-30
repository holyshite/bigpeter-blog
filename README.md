# 🌐 个人博客（Jekyll）

一个基于 **Jekyll** 构建的静态博客项目，支持现代化 UI（玻璃效果）、响应式布局与便捷部署（GitHub Pages / Cloudflare Pages）。

---

## ✨ 特性

* ⚡ 基于 Jekyll 构建，轻量高效
* 🎨 自定义主题（支持 SCSS）
* 💧 玻璃效果（backdrop-filter + 多层叠加）
* 🌌 星空动态背景
* 📱 响应式设计（适配移动端）
* 📝 Markdown 写作支持
* 🚀 可部署至 GitHub Pages / Cloudflare Pages

---

## 📂 项目结构

```bash
.
├── _posts/          # 博客文章
├── _layouts/        # 页面模板
├── _includes/       # 组件（header、footer等）
├── _sass/           # SCSS 样式
├── assets/          # 静态资源（CSS / JS / 图片）
├── _config.yml      # 全局配置
├── index.md       # 首页
└── README.md
```

---

## 🚀 本地运行

### 1️⃣ 安装环境

请确保已安装：

* Ruby
* Bundler
* Jekyll

👉 可通过以下命令检查：

```bash
ruby -v
bundle -v
jekyll -v
```

---

### 2️⃣ 安装依赖

在项目根目录执行：

```bash
bundle install
```

---

### 3️⃣ 启动服务

```bash
bundle exec jekyll serve
```

---

### 4️⃣ 访问网站

打开浏览器：

```
http://localhost:4000
```

---

## 🛠 常用命令

```bash
# 自动打开浏览器
bundle exec jekyll serve --open-url

# 显示草稿文章
bundle exec jekyll serve --drafts

# 指定端口
bundle exec jekyll serve --port 4001

# 启用实时刷新
bundle exec jekyll serve --livereload
```

---

## 🎨 液态玻璃效果说明

本项目实现了玻璃视觉效果，核心技术：

* `backdrop-filter: blur()`
* 半透明渐变遮罩（tint）
* 高光层（shine）
* 多层叠加（glass + overlay）

### 示例

```css
.glass {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

> ⚠️ 注意：部分浏览器需开启硬件加速或支持 backdrop-filter

---

## 🌌 星空背景

通过 Canvas / CSS 动画实现动态背景：

* 支持自定义星星数量
* 支持性能优化（移动端降级）
* 可在 `_sass/stars.scss` 中修改样式

---

## ✍️ 写文章

在 `_posts/` 目录下新建 Markdown 文件：

```bash
2026-03-30-hello-world.md
```

示例：

```md
---
layout: post
title: Hello World
---

这是我的第一篇文章！
```

---

## 🚀 部署

### ✅ GitHub Pages

1. 推送代码到 GitHub
2. 在仓库设置中开启 Pages
3. 选择分支（如 `main`）

---

### ✅ Cloudflare Pages（推荐）

1. 导入 GitHub 仓库
2. 构建命令：

```bash
bundle exec jekyll build
```

3. 输出目录：

```bash
_site
```

---

## ⚠️ 常见问题

### ❌ CSS 无法加载（MIME type 错误）

原因：

* 路径错误或文件未正确生成

解决：

* 检查 `_config.yml` 中的 `baseurl`
* 确认 `assets` 路径正确

---

### ❌ 页面无法滚动（移动端）

可能原因：

* `overflow: hidden`
* `position: fixed` 使用不当

---

### ❌ backdrop-filter 无效

原因：

* 浏览器不支持

解决：

* 使用 Chrome / Safari 最新版

---

## 📌 后续优化方向

* [ ] Dark Mode
* [ ] 文章搜索功能
* [ ] 标签 / 分类系统
* [ ] 评论系统（Giscus / Utterances）
* [ ] 动画性能优化

---

## 📄 License

MIT License

---

## 🙌 致谢

* Jekyll 社区
* 开源 UI 灵感项目：https://github.com/lucasromerodb/liquid-glass-effect-macos

---

## ⭐ 如果你觉得这个项目不错

欢迎 Star ⭐ 支持一下！
