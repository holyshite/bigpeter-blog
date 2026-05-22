# bigpeter 博客

基于 **Jekyll** 构建的个人静态博客，支持液态玻璃 UI、暗色/亮色主题、响应式布局。部署于 Cloudflare Pages。

## 特性

- Jekyll 静态站点，轻量高效
- 液态玻璃视觉效果（backdrop-filter + 多层叠加）
- 暗色 / 亮色双主题切换
- 响应式设计，适配移动端
- Markdown 写作支持
- **每日打卡功能** — GitHub OAuth 登录，Cloudflare Workers + D1 后端
- 贡献日历热力图

## 项目结构

```
.
├── _posts/              # 博客文章
├── _layouts/            # 页面模板
├── _includes/           # 组件（header、footer 等）
├── _sass/               # SCSS 样式
│   ├── _liquid-glass.scss  # 液态玻璃 mixin
│   ├── _checkin.scss       # 打卡页面样式
│   └── ...
├── assets/              # 静态资源
│   ├── css/
│   ├── js/
│   │   ├── checkin.js     # 打卡功能核心逻辑
│   │   ├── theme.js       # 主题切换
│   │   ├── nav.js         # 导航交互
│   │   └── prefetch.js    # 链接预加载
│   └── icon/
├── checkin.markdown     # 打卡页面
├── _config.yml          # Jekyll 全局配置
└── README.md
```

## 打卡功能

打卡系统基于 **Cloudflare Workers + D1 数据库**，用户通过 GitHub OAuth 一键登录即可打卡。

- 前端：Jekyll 静态页面 + 原生 JavaScript
- 后端：Cloudflare Workers（`github-checkin-api.751802108.workers.dev`）
- 数据库：Cloudflare D1（`users`、`checkins`、`sessions`）
- 认证：GitHub OAuth（仅请求 `read:user` 权限）
- 后端项目：`~/projects/bigpeter-blog-backend`

打卡页面：`/checkin/`

## 本地运行

### 环境要求

- Ruby (>= 2.5)
- Bundler
- Jekyll (4.4.1)

### 启动

```bash
bundle install
bundle exec jekyll serve
```

访问 `http://localhost:4000`

### 常用命令

```bash
# 实时刷新
bundle exec jekyll serve --livereload

# 构建
bundle exec jekyll build

# 停止服务
pkill -f "jekyll serve"
```

## 部署

### Cloudflare Pages（推荐）

1. 推送代码到 GitHub
2. Cloudflare Pages 导入仓库
3. 构建命令：`bundle exec jekyll build`
4. 输出目录：`_site`

## License

MIT License
