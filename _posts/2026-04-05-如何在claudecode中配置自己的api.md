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

将以下配置添加到 `~/.bashrc` 或 `~/.zshrc` 文件中：

```bash
cat >> ~/.bashrc << 'EOF'

# ==================== DeepSeek 配置 (Anthropic 兼容 - 默认) ====================
export ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="sk-7ac379faf113443182dcc02f18b54eca"

# DeepSeek 模型
export ANTHROPIC_MODEL="deepseek-reasoner"                    # 默认主力模型
export ANTHROPIC_DEFAULT_HAIKU_MODEL="deepseek-chat"
export ANTHROPIC_DEFAULT_SONNET_MODEL="deepseek-chat"
export ANTHROPIC_DEFAULT_OPUS_MODEL="deepseek-reasoner"   # 复杂任务用 reasoner

export ANTHROPIC_API_KEY=""

# 通用优化参数
export API_TIMEOUT_MS=600000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# =====================================================================

EOF

source ~/.bashrc
```

## 配置详解

**API基础配置**

- `ANTHROPIC_BASE_URL`：API端点地址，这里设置为DeepSeek的Anthropic兼容接口
- `ANTHROPIC_AUTH_TOKEN`：你的API密钥（示例为我的测试密钥，请替换为自己的）
- `ANTHROPIC_API_KEY`：留空，因为DeepSeek使用`AUTH_TOKEN`而非`API_KEY`

**模型配置策略**

- `ANTHROPIC_MODEL`：默认使用的模型，设置为`deepseek-reasoner`处理日常任务
- **分级模型配置**：
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`：轻量任务用`deepseek-chat`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`：中等任务用`deepseek-chat`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`：复杂任务用`deepseek-reasoner`

> **模型选择策略**：`deepseek-reasoner`推理能力更强，适合代码生成、复杂问题解决；`deepseek-chat`响应更快，适合日常对话、简单查询。

**性能优化参数**

- `API_TIMEOUT_MS`：API请求超时时间（10分钟），防止长时间任务被中断
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`：禁用非必要网络流量，提高响应速度

## 配置步骤

1. **编辑配置文件**
   ```bash
   nano ~/.bashrc
   # 或
   vim ~/.bashrc
   ```

2. **添加配置内容**
   将上面的配置块粘贴到文件末尾

3. **立即生效**
   ```bash
   source ~/.bashrc
   ```

4. **验证配置**
   ```bash
   echo $ANTHROPIC_MODEL
   # 应该输出: deepseek-reasoner
   ```

## 使用效果对比

配置前后对比：

| 项目     | 默认配置       | 自定义DeepSeek配置       |
| -------- | -------------- | ------------------------ |
| 响应速度 | 中等           | **快**（国内服务器）     |
| 推理能力 | 强             | **更强**（reasoner模型） |
| 成本     | 免费（有限额） | 按量付费（价格实惠）     |
| 稳定性   | 偶尔限流       | **稳定**（自有API密钥）  |

## 常见问题

### Q1: 如何获取DeepSeek API密钥？
1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 在控制台创建API密钥
4. 替换配置中的`ANTHROPIC_AUTH_TOKEN`值

### Q2: 配置后ClaudeCode无法启动？
检查以下项目：
- API密钥是否正确
- `ANTHROPIC_BASE_URL`是否可访问
- 网络连接是否正常

### Q3: 想切换回默认配置怎么办？
```bash
# 临时恢复
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_AUTH_TOKEN

# 或注释掉.bashrc中的配置行
```

### Q4: 支持其他API提供商吗？
支持任何兼容Anthropic API格式的服务，配置方式类似：
```bash
export ANTHROPIC_BASE_URL="https://api.provider.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="your-api-key-here"
```


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

*本文配置已在WSL2 + Ubuntu 22.04环境下测试通过，ClaudeCode版本为最新稳定版。*