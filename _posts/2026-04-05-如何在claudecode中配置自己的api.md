---
layout: post
title: 如何在ClaudeCode中配置自己的API
date: 2026-04-05
author: BigPeter
tags: [ClaudeCode, API, 配置]
---

在Claude Code中，如果没有充值官方API或者订阅，那么Claude Code就无法使用了？要是能够使用自己购买的第三方API就好了。于是研究了一下如何配置自己的API密钥，使用DeepSeek等第三方模型的兼容接口。本文将详细介绍配置过程，分享我的配置方案。

## 为什么需要自定义API配置？

ClaudeCode默认使用Anthropic的官方API，但我们可以通过环境变量配置第三方兼容接口，比如：
- **DeepSeek API**：价格更实惠，性能优秀
- **其他Anthropic兼容API**：如OpenRouter、Together等
- **自定义模型**：根据任务需求切换不同模型

## 完整配置方案

根据操作系统不同，有两种配置方式：

### 方式一：WSL2 / Linux（环境变量）

在 WSL2 或 Linux 下，将以下配置添加到 `~/.bashrc` 或 `~/.zshrc` 文件中：

```bash
cat >> ~/.bashrc << 'EOF'

# ==================== DeepSeek 配置 (Anthropic 兼容 - 默认) ====================
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="<你的 DeepSeek API Key>"

# DeepSeek 模型
export ANTHROPIC_MODEL="deepseek-v4-pro[1m]"                    # 默认主力模型
export ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-v4-flash"
export ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-v4-pro[1m]"
export ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-v4-pro[1m]"   # 复杂任务用 pro[1m]

export CLAUDE_CODE_SUBAGENT_MODEL="deepseek-v4-flash"
export CLAUDE_CODE_EFFORT_LEVEL="max"

# 通用优化参数
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# =====================================================================

EOF

source ~/.bashrc
```

### 方式二：Windows（直接使用 Claude Code）

在 Windows 原生环境下（非 WSL2），Claude Code 无法读取 `~/.bashrc` 中的环境变量。需要直接在 Claude Code 的项目配置文件中设置。在项目根目录（或全局 `%USERPROFILE%\.claude\`）的 `settings.json` 中添加：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "你的 DeepSeek API Key",
    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max"
  }
}
```

> **配置位置选择**：放在项目 `.claude/settings.json` 中仅对该项目生效；放在 `%USERPROFILE%\.claude\settings.json`（全局配置）则对所有项目生效。

## 配置详解

**API基础配置**

- `ANTHROPIC_BASE_URL`：API端点地址，这里设置为DeepSeek的Anthropic兼容接口
- `ANTHROPIC_AUTH_TOKEN`：你的API密钥（示例为我的测试密钥，请替换为自己的）

**模型配置策略**

- `ANTHROPIC_MODEL`：默认使用的模型，设置为`deepseek-v4-pro[1m]`处理日常任务
- **分级模型配置**：
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`：轻量任务用`deepseek-v4-flash`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`：中等任务用`deepseek-v4-pro[1m]`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`：复杂任务用`deepseek-v4-pro[1m]`

> **模型选择策略**：`deepseek-v4-pro[1m]`推理能力更强，适合代码生成、复杂问题解决；`deepseek-v4-flash`响应更快，适合日常对话、简单查询。

**性能优化参数**

- `API_TIMEOUT_MS`：API请求超时时间（10分钟），防止长时间任务被中断
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`：禁用非必要网络流量，提高响应速度
- `CLAUDE_CODE_SUBAGENT_MODEL`：子代理（Explore、Plan等）使用的模型，设为`deepseek-v4-flash`节省成本
- `CLAUDE_CODE_EFFORT_LEVEL`：推理努力级别，设为`max`让模型在复杂任务上花费更多推理时间

## 配置步骤

### WSL2 / Linux 用户

1. **编辑配置文件**
   ```bash
   nano ~/.bashrc
   # 或
   vim ~/.bashrc
   ```

2. **添加配置内容**
   将上面的环境变量配置块粘贴到文件末尾

3. **立即生效**
   ```bash
   source ~/.bashrc
   ```

4. **验证配置**
   ```bash
   echo $ANTHROPIC_MODEL
   # 应该输出: deepseek-v4-pro[1m]
   ```

### Windows 用户

1. **找到配置文件**
   - 全局配置：`%USERPROFILE%\.claude\settings.json`
   - 项目配置：在项目根目录创建 `.claude\settings.json`

2. **添加配置内容**
   将上面的 JSON 配置块粘贴到文件中（注意 JSON 格式，确保逗号正确）

3. **验证配置**
   重启 Claude Code，在对话中输入 `/config` 查看当前环境变量是否生效

## 使用效果对比

配置前后对比：

| 项目     | 默认配置       | 自定义DeepSeek配置       |
| -------- | -------------- | ------------------------ |
| 响应速度 | 中等           | **快**（国内服务器）     |
| 推理能力 | 强             | **更强**（pro[1m] 模型）|
| 成本     | 免费（有限额） | 按量付费（价格实惠）     |
| 稳定性   | 偶尔限流       | **稳定**（自有API密钥）  |

## 常见问题

### Q1: 如何获取DeepSeek API密钥？
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在控制台创建API密钥
4. 替换配置中的`ANTHROPIC_AUTH_TOKEN`值

### Q2: 配置后 Claude Code 无法启动？
检查以下项目：
- API密钥是否正确
- `ANTHROPIC_BASE_URL`是否可访问
- 网络连接是否正常
- **Windows 用户**：检查 `settings.json` 是否为合法 JSON（注意逗号、引号）
- **WSL2 用户**：检查环境变量是否已 `source` 生效

### Q3: 想切换回默认配置怎么办？

**WSL2 / Linux 用户**：
```bash
# 临时恢复
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_AUTH_TOKEN

# 或注释掉.bashrc中的配置行
```

**Windows 用户**：
- 直接删除 `settings.json` 中的 `"env"` 块，或删除对应的行
- 若使用的是项目级配置，删除项目下的 `.claude/settings.json` 即可

### Q4: 支持其他API提供商吗？
支持任何兼容 Anthropic API 格式的服务，配置方式类似：

**WSL2 / Linux**：
```bash
export ANTHROPIC_BASE_URL="https://api.provider.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"
```

**Windows**：
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.provider.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here"
  }
}
```

### Q5: Windows 下能否用环境变量替代 settings.json？
Windows 下也可以设置系统环境变量 `ANTHROPIC_BASE_URL` 等，但推荐使用 `settings.json` 方式，原因如下：
- 环境变量需重启终端/Claude Code 才能生效
- `settings.json` 配置更灵活，可按项目隔离配置
- 避免污染系统级环境变量，切换更方便


## 总结

通过自定义API配置，我们可以：
- 获得更快的响应速度（使用国内服务器）
- 使用更强大的推理模型
- 灵活控制成本和使用量
- 保持与ClaudeCode的完全兼容

**重要提醒**：
- 保管好API密钥，不要提交到公开仓库
- 注意API使用费用，设置用量提醒
- 定期测试配置有效性

建议先从免费额度开始测试，确认稳定性和效果后再投入实际使用。

---

*本文配置已在 WSL2 (Ubuntu 22.04) 和 Windows 11 环境下测试通过，Claude Code 版本为最新稳定版。*