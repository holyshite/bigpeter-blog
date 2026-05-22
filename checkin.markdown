---
layout: checkin
title: 每日打卡
permalink: /checkin/
---

<div class="checkin-container">
    <div class="checkin-user-bar" id="userBar" style="display: none;">
        <img id="userAvatar" class="user-avatar" src="" alt="头像">
        <span id="userName" class="user-name"></span>
        <button type="button" id="logoutBtn" class="logout-btn">退出</button>
    </div>

    <div class="checkin-status">
        <div id="todayStatus" class="status-pending">
            <p>正在检查今日打卡状态...</p>
        </div>
        <button id="checkinBtn" class="checkin-btn" disabled>
            <span class="btn-text">打卡中...</span>
        </button>
    </div>

    <div id="loginHint" class="login-hint" style="display: none;">
        <p>使用 GitHub 账号登录后即可打卡</p>
        <a id="loginBtn" class="login-btn" href="https://github-checkin-api.751802108.workers.dev/api/auth/github">GitHub 登录</a>
    </div>

    <div class="checkin-stats">
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
        <div id="historyList" class="history-list">
            <p>正在加载打卡历史...</p>
        </div>
    </div>
</div>

