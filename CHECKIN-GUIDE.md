# 打卡功能使用指南

本文档介绍如何在bigpeter博客中使用打卡功能。

## 功能概述

打卡功能允许你记录每日打卡，支持以下特性：
- 每日打卡记录
- 多设备同步（通过GitHub Issues）
- 打卡统计（总天数、连续打卡、最长连续、本月打卡）
- 打卡历史查看

## 配置步骤

### 1. 创建GitHub Issue作为数据存储

打卡功能使用GitHub Issues的评论来存储打卡记录。你需要先创建一个Issue：

1. 访问你的GitHub仓库：`https://github.com/holyshite/bigpeter-blog`
2. 点击"Issues"标签页
3. 点击"New issue"按钮
4. 标题输入：`打卡记录存储`
5. 内容输入：`此Issue用于存储每日打卡记录，请不要关闭或删除。`
6. 创建Issue
7. 记住Issue编号（URL中的数字，例如：`https://github.com/holyshite/bigpeter-blog/issues/1`）

### 2. 获取GitHub个人访问令牌

打卡功能需要访问GitHub API，你需要创建一个个人访问令牌：

1. 访问GitHub设置：`https://github.com/settings/tokens`
2. 点击"Generate new token" → "Generate new token (classic)"
3. 输入令牌描述：`博客打卡功能`
4. 选择权限：
   - `repo`（完全控制仓库，包括issues）
   - 或者至少选择`public_repo`（如果仓库是公开的）
5. 点击"Generate token"
6. **重要**：立即复制生成的令牌，关闭页面后将无法再次查看

### 3. 配置打卡功能

在浏览器中配置打卡功能：

1. 访问博客的打卡页面：`https://bigpeter.top/checkin.html`
2. 打开浏览器开发者工具（F12）
3. 在控制台(Console)中输入：
   ```javascript
   localStorage.setItem('github_token', '你的令牌');
   ```
4. 刷新打卡页面

### 4. 更新仓库配置（可选）

如果你使用不同的GitHub仓库或Issue编号，可以在`assets/js/checkin.js`中修改配置：

```javascript
const CONFIG = {
    repoOwner: '你的GitHub用户名',
    repoName: '你的仓库名',
    issueNumber: 你的Issue编号,
    // ... 其他配置
};
```

## 使用方法

### 打卡
1. 访问打卡页面
2. 点击"立即打卡"按钮
3. 等待打卡成功提示

### 查看统计
- **总打卡天数**：累计打卡的总天数
- **连续打卡**：当前连续打卡的天数
- **最长连续**：历史上最长的连续打卡记录
- **本月打卡**：本月内打卡的天数

### 查看历史
打卡历史按时间倒序显示，包含日期、星期和备注信息。

## 技术原理

### 数据存储
- 每个打卡记录作为JSON对象存储在GitHub Issue的评论中
- 数据格式：`{"type": "checkin", "date": "YYYY-MM-DD", "timestamp": 毫秒时间戳（实际打卡时间）, "note": "备注", "userId": "GitHub用户名（可选）"}`
- **多用户支持**：系统会自动添加`userId`字段标识打卡用户。当多个用户共享同一个Issue时，每个用户只能看到自己的打卡记录。
- **建议**：为获得最佳体验，每个用户应配置自己的GitHub Issue来存储数据。
- 本地缓存：打卡记录缓存在浏览器的localStorage中（按用户过滤）

### 同步机制
1. 每次访问打卡页面时从GitHub加载最新记录
2. 打卡时立即同步到GitHub
3. 网络不可用时使用本地缓存

## 故障排除

### 常见问题

#### 1. "需要配置GitHub访问"提示一直显示
- 检查是否已执行`localStorage.setItem('github_token', '你的令牌')`
- 检查令牌是否有效（未过期）
- 检查令牌是否具有必要的权限

#### 2. 打卡失败
- 检查网络连接
- 检查GitHub API限制（每小时60次请求）
- 检查Issue是否被关闭或删除

#### 3. 统计信息不正确
- 尝试清除本地缓存：
  ```javascript
  localStorage.removeItem('checkin_history_cache');
  localStorage.removeItem('last_checkin_date');
  ```
- 刷新页面重新从GitHub加载数据

#### 4. 看到其他用户的打卡记录
- **原因**：多个用户共享同一个GitHub Issue，且旧数据没有用户标识符
- **解决方案**：
  1. 每个用户配置自己的GitHub Issue（推荐）
  2. 在配置页面设置不同的仓库或Issue编号
  3. 系统会自动为新打卡记录添加用户标识符，旧数据对所有用户可见

#### 5. 不同设备数据不同步
- 确保所有设备使用相同的GitHub令牌
- 刷新页面强制同步最新数据

### 浏览器兼容性
- 需要现代浏览器支持ES6+、localStorage、Fetch API
- 推荐：Chrome 60+、Firefox 55+、Safari 11+、Edge 79+

## 隐私与安全

### 数据存储
- 打卡记录存储在GitHub Issues中，对仓库有访问权限的人可见
- 本地缓存仅存储在用户浏览器中

### 令牌安全
- GitHub令牌具有仓库访问权限，请妥善保管
- 不要在公共电脑上配置令牌
- 定期更新/撤销令牌

### 数据删除
要删除所有打卡记录：
1. 删除GitHub Issue中的所有评论
2. 清除浏览器localStorage：
   ```javascript
   localStorage.removeItem('github_token');
   localStorage.removeItem('last_checkin_date');
   localStorage.removeItem('checkin_history_cache');
   ```

## 更新日志

### v1.1.0 (2026-04-06)
- 修复黑夜模式下按钮悬浮样式异常问题
- 修复配置页面与底部按钮组重叠的布局问题
- 调整管理按钮布局为水平排列
- 在配置表单中添加"取消"按钮
- 改进时间记录精度：时间戳记录实际打卡时间（精确到毫秒）
- 历史记录列表同时显示日期和具体时间
- **多用户支持**：系统根据GitHub令牌自动区分用户数据
  - 打卡记录添加用户标识符 (`userId` 字段)
  - 每个用户只能看到自己的打卡记录（共享Issue中的旧数据对所有用户可见）
  - 页面初始化时自动加载用户特定的仓库配置

### v1.0.0 (2026-04-06)
- 初始版本发布
- 支持每日打卡
- 支持多设备同步
- 基础统计功能

---

如有问题或建议，请在GitHub仓库中提交Issue。