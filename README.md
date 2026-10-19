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

## 关于页面

`/about/` 参考 [Squarespace Foundations](https://brand.squarespace.com/) 的旋转陈列与分区体验，使用 BigPeter 的个人文字、原创 BP 标识、项目图和已有摄影作品；不包含 Campaign。
首屏有五张动态卡片，支持自动旋转、暂停、拖动、滚轮、方向键和点击展开。Index 菜单保留文章、项目、影像、打卡与联系入口。

| 分区 | 地址 | 交互 |
| --- | --- | --- |
| Logo | `/about/logo/` | 符号 / 名字切换、反色、留白参考、SVG 下载、友链弹性悬停 |
| Typography | `/about/typography/` | 编辑样张、字体 / 字号切换、句子切换、字形游乐场 |
| Color | `/about/color/` | 五组配色、三种海报构图、复制色值、全屏配色探索 |
| Photography | `/about/photography/` | 照片换组、可拖拽照片墙、复位、堆叠浏览、全屏缩放与缩略图 |
| Motion | `/about/motion/` | 播放 / 暂停、速度 / 曲线控制、时间轴、五种展开动效、滚动分层 |

五个地址均生成独立静态页面，可直接访问、刷新和使用浏览器前进 / 后退；站内切换使用同一份布局。
详情保持暖纸、墨色与细线，支持独立的深浅主题。GSAP 和 ScrollTrigger 负责展开与滚动动画；离开分区后清理其动画和监听器，屏幕外或后台的循环动画暂停。
系统减少动态效果时关闭自动旋转、循环与大幅过渡。GSAP 加载失败时，卡片导航、编辑、配色和摄影交互仍可使用，Motion 时间轴采用原生动画回退。
分区文字和配色在 `_data/about.json`，个人信息在 `_config.yml`，友链在 `_data/friends.json`，影像在 `_data/photo.yml`。
结构位于 `_layouts/about.html` 与 `_includes/about/`，样式位于 `_sass/_about.scss`，导航和分区交互分别位于 `assets/js/about.js` 与 `assets/js/about-sections.js`。摄影交互复用 `photo-drag.js` 和 `photo-viewer.js`。

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
