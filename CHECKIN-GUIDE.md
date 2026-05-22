# 打卡功能使用指南

本文档介绍如何在bigpeter博客中使用打卡功能。

## 功能概述

打卡功能允许你记录每日打卡，支持以下特性：
- 每日打卡记录
- GitHub OAuth 一键登录，无需手动配置 Token
- 多设备同步（通过 Cloudflare Workers 后端 + D1 数据库）
- 打卡统计（总天数、连续打卡、最长连续、本月打卡）
- 贡献日历热力图

## 使用方法

### 登录

1. 访问打卡页面：`https://bigpeter.top/checkin/`
2. 点击"GitHub 登录"按钮
3. 在 GitHub 授权页面点击"Authorize"
4. 授权成功后自动跳转回打卡页面，即可开始打卡

### 打卡

1. 登录后，页面显示"今日尚未打卡"
2. 点击"立即打卡"按钮
3. 打卡成功后状态更新为"今日已打卡"
4. 同一天只能打卡一次，后端会自动防重

### 查看统计

- **总打卡天数**：累计打卡的总天数
- **连续打卡**：当前连续打卡的天数
- **最长连续**：历史上最长的连续打卡记录
- **本月打卡**：本月内打卡的天数

### 查看历史

打卡历史以 GitHub 贡献图风格的日历热力图展示，支持切换年份查看。

### 退出登录

点击用户栏右侧的"退出"按钮即可退出。

## 技术架构

### 前端
- Jekyll 静态页面 + 原生 JavaScript
- Session 存储在浏览器 localStorage 中（key: `checkin_session`）
- 无框架依赖，兼容现代浏览器

### 后端
- Cloudflare Workers + D1 数据库
- API 地址：`https://github-checkin-api.751802108.workers.dev`
- GitHub OAuth 认证（`read:user` 权限，仅获取公开信息）

### 数据存储
- 数据库表：`users`（用户）、`checkins`（打卡记录）、`sessions`（会话）
- 打卡记录包含：日期、时间戳、备注
- Session 有效期 24 小时

## 本地开发

### 环境要求
- Jekyll 开发服务器默认运行在 `http://localhost:4000`
- 后端 CORS 已允许 `localhost:4000`
- OAuth 回调会自动识别本地开发环境

### 测试流程
1. 启动 Jekyll：`bundle exec jekyll serve`
2. 访问 `http://localhost:4000/checkin/`
3. 点击 GitHub 登录，完成 OAuth 流程
4. 授权后自动重定向回本地打卡页面

## 故障排除

### 常见问题

#### 1. 登录后页面没有反应
- 检查浏览器控制台是否有 CORS 错误
- 确认后端 API 是否正常运行
- 清除 localStorage 中的 `checkin_session` 后重试

#### 2. 打卡失败
- 检查网络连接
- 检查是否今天已经打过卡（"Already checked in today"）
- Session 可能已过期，退出后重新登录

#### 3. 统计数据不正确
- 尝试清除本地缓存：
  ```javascript
  localStorage.removeItem('checkin_history_cache');
  ```
- 刷新页面重新从后端加载数据

### 浏览器兼容性
- 需要现代浏览器支持 ES6+、localStorage、Fetch API
- 推荐：Chrome 60+、Firefox 55+、Safari 11+、Edge 79+

## 隐私与安全

- GitHub OAuth 仅请求 `read:user` 权限（读取公开用户信息）
- Session 令牌存储在浏览器 localStorage 中，24 小时后自动过期
- 打卡记录存储在后端 D1 数据库中，按用户隔离
- 退出登录会清除服务端 Session 和本地存储

---

如有问题或建议，请在GitHub仓库中提交Issue。
