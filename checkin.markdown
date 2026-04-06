---
layout: checkin
title: 每日打卡
permalink: /checkin/
---

<div class="checkin-container">
    <div class="checkin-status">
        <h2>今日打卡状态</h2>
        <div id="todayStatus" class="status-pending">
            <p>正在检查今日打卡状态...</p>
        </div>
        <button id="checkinBtn" class="checkin-btn" disabled>
            <span class="btn-text">打卡中...</span>
        </button>
    </div>

    <div class="checkin-stats">
        <h2>打卡统计</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalDays">0</div>
                <div class="stat-label">总打卡天数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="currentStreak">0</div>
                <div class="stat-label">连续打卡</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="longestStreak">0</div>
                <div class="stat-label">最长连续</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="thisMonth">0</div>
                <div class="stat-label">本月打卡</div>
            </div>
        </div>
    </div>

    <div class="checkin-history">
        <h2>打卡历史</h2>
        <div id="historyList" class="history-list">
            <p>正在加载打卡历史...</p>
        </div>
    </div>
</div>

<!-- GitHub配置区域 -->
<div class="github-config-section glass-card" id="configSection" style="display: none;">
    <h3>GitHub配置</h3>

    <div id="configHint" class="config-hint">
        <p>打卡功能需要访问GitHub Issues API。请按照以下步骤配置：</p>
        <ol>
            <li>在GitHub上创建一个个人访问令牌（Token）</li>
            <li>将令牌粘贴到下方输入框</li>
            <li>点击"保存并验证"按钮</li>
        </ol>
        <p><strong>注意：</strong>令牌需要<code>repo</code>或<code>public_repo</code>权限（用于访问issues）。详情可查看文章<a href="/2026/04/06/bigpeter博客打卡功能完整指南.html">《bigpeter博客打卡功能完整指南》</a></p>
    </div>

    <div id="configForm" class="config-form">
        <div class="form-group">
            <label for="githubTokenInput">GitHub个人访问令牌：</label>
            <div class="token-input-wrapper">
                <input type="password" id="githubTokenInput" class="token-input" placeholder="输入你的GitHub令牌" autocomplete="off">
                <button type="button" id="toggleTokenVisibility" class="toggle-visibility-btn" title="显示/隐藏令牌">
                    👁️
                </button>
            </div>
            <small class="form-hint">令牌将存储在浏览器的localStorage中，仅用于访问你的GitHub仓库。</small>
        </div>

        <div class="form-group repo-info-group">
            <div class="repo-field">
                <label for="repoOwnerInput">仓库所有者：</label>
                <input type="text" id="repoOwnerInput" class="repo-input" value="holyshite" placeholder="GitHub用户名">
            </div>
            <div class="repo-field">
                <label for="repoNameInput">仓库名称：</label>
                <input type="text" id="repoNameInput" class="repo-input" value="bigpeter-blog" placeholder="仓库名">
            </div>
            <div class="repo-field">
                <label for="issueNumberInput">Issue编号：</label>
                <input type="number" id="issueNumberInput" class="issue-input" value="2" placeholder="Issue编号" min="1">
            </div>
        </div>

        <div class="form-actions">
            <button type="button" id="saveConfigBtn" class="config-btn save-btn">
                <span class="btn-text">保存并验证</span>
                <span class="loading-spinner" style="display: none;"></span>
            </button>
            <button type="button" id="clearConfigBtn" class="config-btn clear-btn">
                清除配置
            </button>
            <button type="button" id="testConfigBtn" class="config-btn test-btn">
                测试连接
            </button>
            <button type="button" id="cancelConfigBtn" class="config-btn cancel-btn">
                ❌ 取消
            </button>
        </div>

        <div id="configStatus" class="config-status" style="display: none;">
            <!-- 配置状态信息会显示在这里 -->
        </div>
    </div>

    <div id="configSuccess" class="config-success" style="display: none;">
        <div class="success-icon">✅</div>
        <h4>配置成功！</h4>
        <p>GitHub令牌已保存并验证成功。页面将在3秒后自动刷新...</p>
        <button type="button" id="refreshNowBtn" class="refresh-btn">立即刷新</button>
    </div>
</div>

<!-- 配置管理按钮 -->
<div class="config-manager">
    <button type="button" id="showConfigBtn" class="config-manager-btn">
        ⚙️ 配置GitHub访问
    </button>
    <button type="button" id="showTokenStatusBtn" class="config-manager-btn">
        🔑 查看令牌状态
    </button>
</div>
