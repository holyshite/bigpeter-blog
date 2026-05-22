// checkin.js
// 基于 Cloudflare Workers 后端的打卡系统

document.addEventListener('DOMContentLoaded', function () {
    const CONFIG = {
        apiBase: 'https://github-checkin-api.751802108.workers.dev',
        storageKeys: {
            session: 'checkin_session',
            checkinHistory: 'checkin_history_cache'
        }
    };

    const elements = {
        userBar: document.getElementById('userBar'),
        userAvatar: document.getElementById('userAvatar'),
        userName: document.getElementById('userName'),
        logoutBtn: document.getElementById('logoutBtn'),
        todayStatus: document.getElementById('todayStatus'),
        checkinBtn: document.getElementById('checkinBtn'),
        loginHint: document.getElementById('loginHint'),
        loginBtn: document.getElementById('loginBtn'),
        totalDays: document.getElementById('totalDays'),
        currentStreak: document.getElementById('currentStreak'),
        longestStreak: document.getElementById('longestStreak'),
        thisMonth: document.getElementById('thisMonth'),
        historyList: document.getElementById('historyList')
    };

    let state = {
        sessionId: null,
        userInfo: null,
        todayCheckedIn: false,
        checkinHistory: [],
        stats: null,
        selectedYear: new Date().getFullYear()
    };

    // 从 URL 中提取 session ID（OAuth 回调）
    function getSessionFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const session = params.get('session');
        if (session) {
            // 清除 URL 中的 session 参数
            const url = new URL(window.location);
            url.searchParams.delete('session');
            window.history.replaceState({}, '', url);
        }
        return session;
    }

    // API 请求封装
    async function apiFetch(path, options = {}) {
        const url = `${CONFIG.apiBase}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // 初始化
    async function init() {
        showLoadingState();

        // 优先从 URL 获取 session（OAuth 回调）
        let sessionId = getSessionFromUrl();
        if (sessionId) {
            localStorage.setItem(CONFIG.storageKeys.session, sessionId);
            state.sessionId = sessionId;
        } else {
            state.sessionId = localStorage.getItem(CONFIG.storageKeys.session);
        }

        // 未登录状态
        if (!state.sessionId) {
            showLoggedOutState();
            // 仍加载公开的排行榜数据
            await loadLeaderboard();
            hideLoadingState();
            return;
        }

        try {
            // 验证 session 并获取用户信息
            try {
                state.userInfo = await apiFetch(`/api/auth/session?session=${state.sessionId}`);
            } catch (e) {
                throw new Error('Session验证失败: ' + (e.message || '未知错误'));
            }
            showLoggedInState(state.userInfo);

            // 并行加载打卡记录和统计数据
            let checkins, stats;
            try {
                [checkins, stats] = await Promise.all([
                    apiFetch(`/api/checkin?session=${state.sessionId}`),
                    apiFetch(`/api/stats?session=${state.sessionId}`)
                ]);
            } catch (e) {
                throw new Error('数据加载失败: ' + (e.message || '未知错误'));
            }

            state.checkinHistory = checkins;
            state.stats = stats;

            // 缓存到本地
            localStorage.setItem(
                CONFIG.storageKeys.checkinHistory,
                JSON.stringify(checkins)
            );

            updateUI();
            bindYearSelector();

            // 启用打卡按钮
            if (elements.checkinBtn) {
                elements.checkinBtn.disabled = false;
                elements.checkinBtn.querySelector('.btn-text').textContent = '立即打卡';
                elements.checkinBtn.addEventListener('click', handleCheckin);
            }

        } catch (error) {
            console.error('初始化失败:', error);
            // session 失效，清除本地存储
            if (error.message.includes('Session') || error.message.includes('session')) {
                localStorage.removeItem(CONFIG.storageKeys.session);
                state.sessionId = null;
                showLoggedOutState();
            } else {
                showErrorState(error.message || '加载失败，请刷新重试');
            }
        } finally {
            hideLoadingState();
        }
    }

    // 显示未登录状态
    function showLoggedOutState() {
        if (elements.checkinBtn) elements.checkinBtn.style.display = 'none';
        if (elements.loginBtn) {
            const frontendRedirect = window.location.origin + '/checkin/';
            elements.loginBtn.href = `${CONFIG.apiBase}/api/auth/github?redirect=${encodeURIComponent(frontendRedirect)}`;
            elements.loginBtn.style.display = '';
        }
        if (elements.todayStatus) {
            elements.todayStatus.innerHTML = '<p>⏳ 请先登录</p>';
            elements.todayStatus.className = 'status-pending';
        }
        // 加载本地缓存的历史记录（如有）
        const cached = localStorage.getItem(CONFIG.storageKeys.checkinHistory);
        if (cached) {
            try {
                state.checkinHistory = JSON.parse(cached);
            } catch (e) {
                state.checkinHistory = [];
            }
        }
        updateStatsFromHistory();
        updateHistoryList();
    }

    // 显示已登录状态
    function showLoggedInState(user) {
        if (elements.userBar) elements.userBar.style.display = 'flex';
        if (elements.loginBtn) elements.loginBtn.style.display = 'none';
        if (elements.checkinBtn) elements.checkinBtn.style.display = '';
        if (elements.userAvatar) elements.userAvatar.src = user.avatarUrl || '';
        if (elements.userName) elements.userName.textContent = user.userId || '';
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', handleLogout);
        }
    }

    function showLoadingState() {
        if (elements.todayStatus) {
            elements.todayStatus.innerHTML = `
                <div class="loading-spinner"></div>
                <p>正在加载打卡数据...</p>
            `;
            elements.todayStatus.className = 'status-pending';
        }
        if (elements.checkinBtn) {
            elements.checkinBtn.disabled = true;
            elements.checkinBtn.querySelector('.btn-text').textContent = '加载中...';
        }
    }

    function hideLoadingState() {}

    function showErrorState(message) {
        if (elements.todayStatus) {
            elements.todayStatus.innerHTML = `
                <p>❌ ${message}</p>
                <button class="retry-btn" id="retryBtn">重试</button>
            `;
            elements.todayStatus.className = 'status-error';
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) retryBtn.addEventListener('click', init);
        }
    }

    // 登出
    async function handleLogout() {
        try {
            await apiFetch(`/api/auth/logout?session=${state.sessionId}`);
        } catch (e) {}
        localStorage.removeItem(CONFIG.storageKeys.session);
        localStorage.removeItem(CONFIG.storageKeys.checkinHistory);
        state.sessionId = null;
        state.userInfo = null;
        window.location.reload();
    }

    // 打卡
    async function handleCheckin() {
        if (!state.sessionId) {
            showLoggedOutState();
            return;
        }

        // 检查今日是否已打卡
        if (state.todayCheckedIn) {
            alert('今天已经打过卡了！');
            return;
        }

        if (elements.checkinBtn) {
            elements.checkinBtn.disabled = true;
            elements.checkinBtn.querySelector('.btn-text').textContent = '打卡中...';
        }

        try {
            const result = await apiFetch('/api/checkin', {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: state.sessionId,
                    note: '每日打卡'
                })
            });

            state.todayCheckedIn = true;

            // 更新本地历史
            state.checkinHistory.unshift({
                date: result.date,
                timestamp: result.timestamp,
                note: result.note
            });

            localStorage.setItem(
                CONFIG.storageKeys.checkinHistory,
                JSON.stringify(state.checkinHistory)
            );

            // 重新加载统计
            try {
                state.stats = await apiFetch(`/api/stats?session=${state.sessionId}`);
            } catch (e) {}

            if (elements.todayStatus) {
                elements.todayStatus.innerHTML = `
                    <p>✅ 打卡成功！</p>
                    <p class="checkin-time">${formatTime(new Date(result.timestamp))}</p>
                `;
                elements.todayStatus.className = 'status-success';
            }

            updateUI();

        } catch (error) {
            console.error('打卡失败:', error);
            alert(error.message === 'Already checked in today'
                ? '今天已经打过卡了！'
                : '打卡失败，请重试');
            if (elements.todayStatus) {
                elements.todayStatus.innerHTML = '<p>❌ 打卡失败</p>';
                elements.todayStatus.className = 'status-error';
            }
        } finally {
            if (elements.checkinBtn) {
                elements.checkinBtn.disabled = false;
                elements.checkinBtn.querySelector('.btn-text').textContent = '立即打卡';
            }
        }
    }

    // 加载公开排行榜（无需登录）
    async function loadLeaderboard() {
        try {
            const leaderboard = await apiFetch('/api/leaderboard');
            // 排行榜数据可用于后续扩展显示
        } catch (e) {}
    }

    // 更新 UI
    function updateUI() {
        const today = getLocalDateString(new Date());
        const todayCheckin = state.checkinHistory.find(item => item.date === today);
        state.todayCheckedIn = !!todayCheckin;

        if (elements.todayStatus) {
            if (state.todayCheckedIn) {
                const timeDisplay = todayCheckin
                    ? `<p class="checkin-time">${formatTime(new Date(todayCheckin.timestamp))}</p>`
                    : '';
                elements.todayStatus.innerHTML = `
                    <p>✅ 今日已打卡</p>
                    ${timeDisplay}
                `;
                elements.todayStatus.className = 'status-success';
                if (elements.checkinBtn) {
                    elements.checkinBtn.disabled = true;
                    elements.checkinBtn.querySelector('.btn-text').textContent = '今日已打卡';
                }
            } else {
                elements.todayStatus.innerHTML = '<p>⏳ 今日尚未打卡</p>';
                elements.todayStatus.className = 'status-pending';
            }
        }

        updateStatsFromHistory();
        updateHistoryList();
    }

    // 从历史记录更新统计（兼容已登录和未登录）
    function updateStatsFromHistory() {
        if (state.stats) {
            // 使用后端返回的统计
            if (elements.totalDays) elements.totalDays.textContent = state.stats.totalCheckins;
            if (elements.currentStreak) elements.currentStreak.textContent = state.stats.currentStreak;
            if (elements.longestStreak) elements.longestStreak.textContent = state.stats.longestStreak;
            if (elements.thisMonth) elements.thisMonth.textContent = state.stats.thisMonthCheckins;
            return;
        }

        // 本地计算
        const stats = calculateStats(state.checkinHistory);
        if (elements.totalDays) elements.totalDays.textContent = stats.totalDays;
        if (elements.currentStreak) elements.currentStreak.textContent = stats.currentStreak;
        if (elements.longestStreak) elements.longestStreak.textContent = stats.longestStreak;
        if (elements.thisMonth) elements.thisMonth.textContent = stats.thisMonth;
    }

    function calculateStats(history) {
        if (!history || history.length === 0) {
            return { totalDays: 0, currentStreak: 0, longestStreak: 0, thisMonth: 0 };
        }

        const totalDays = history.length;

        const now = new Date();
        const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1);
        const thisMonth = history.filter(item => {
            const date = new Date(item.date);
            const month = date.getFullYear() * 100 + (date.getMonth() + 1);
            return month === currentMonth;
        }).length;

        let longestStreak = 0;
        let tempStreak = 0;
        const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
        let prevDate = null;

        for (let i = 0; i < sorted.length; i++) {
            const currentDate = new Date(sorted[i].date);
            if (prevDate) {
                const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else if (diffDays > 1) {
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                    tempStreak = 0;
                }
            } else {
                tempStreak = 1;
            }
            prevDate = currentDate;
        }
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        const today = new Date();
        const todayStr = getLocalDateString(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateSet = new Set(history.map(item => item.date));
        let currentStreak = 0;
        let checkDate = dateSet.has(todayStr) ? today : yesterday;
        let checkDateStr = getLocalDateString(checkDate);

        while (dateSet.has(checkDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            checkDateStr = getLocalDateString(checkDate);
        }

        return { totalDays, currentStreak, longestStreak, thisMonth };
    }

    // 年份选择器
    function bindYearSelector() {
        document.addEventListener('click', function (e) {
            const btn = e.target.closest('.year-btn');
            if (!btn) return;
            const year = parseInt(btn.getAttribute('data-year'));
            if (year === state.selectedYear) return;
            state.selectedYear = year;
            updateHistoryList();
        });
    }

    // 贡献日历
    function updateHistoryList() {
        if (!elements.historyList) return;

        if (!state.checkinHistory) state.checkinHistory = [];

        const now = new Date();
        const selectedYear = state.selectedYear || now.getFullYear();

        const yearEnd = new Date(selectedYear, 11, 31);
        yearEnd.setHours(0, 0, 0, 0);
        const yearStart = new Date(selectedYear, 0, 1);
        const gridStartDate = new Date(yearStart);
        gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay());

        const firstDisplayDate = new Date(yearStart);
        const endDate = new Date(yearEnd);

        const checkinInfoByDate = new Map();
        state.checkinHistory.forEach(item => {
            if (!item.date) return;
            const existing = checkinInfoByDate.get(item.date);
            const currentTimestamp = Number(item.timestamp) || 0;
            if (!existing) {
                checkinInfoByDate.set(item.date, { count: 1, latestTimestamp: currentTimestamp });
                return;
            }
            checkinInfoByDate.set(item.date, {
                count: existing.count + 1,
                latestTimestamp: Math.max(existing.latestTimestamp || 0, currentTimestamp)
            });
        });

        const maxCount = Math.max(1, ...Array.from(checkinInfoByDate.values(), item => item.count));
        const weeks = [];
        const cursor = new Date(gridStartDate);

        while (cursor <= endDate) {
            const week = [];
            for (let i = 0; i < 7; i += 1) {
                const currentDate = new Date(cursor);
                const key = getLocalDateString(currentDate);
                const inRange = currentDate >= firstDisplayDate && currentDate <= endDate && currentDate <= now;
                const checkinInfo = inRange ? checkinInfoByDate.get(key) : null;
                const count = checkinInfo ? checkinInfo.count : 0;
                const latestTimestamp = checkinInfo ? checkinInfo.latestTimestamp : null;
                week.push({ date: currentDate, dateKey: key, count, latestTimestamp, inRange });
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(week);
        }

        const monthLabels = [];
        let lastMonth = null;
        weeks.forEach((week, index) => {
            let label = '';
            for (let i = 0; i < week.length; i += 1) {
                const day = week[i];
                if (!day.inRange) continue;
                const month = day.date.getMonth();
                const dayOfMonth = day.date.getDate();
                if ((month !== lastMonth && dayOfMonth <= 7) || (index === 0 && lastMonth === null)) {
                    label = `${month + 1}月`;
                    lastMonth = month;
                }
                break;
            }
            monthLabels.push(label);
        });

        let totalActiveDays = 0;
        checkinInfoByDate.forEach((info, dateKey) => {
            const d = new Date(dateKey);
            if (d >= yearStart && d <= yearEnd) totalActiveDays++;
        });
        const latestRecord = state.checkinHistory[0] ? new Date(state.checkinHistory[0].timestamp) : null;
        const latestText = latestRecord ? `${formatDate(latestRecord)} ${formatTime(latestRecord)}` : '暂无';

        const monthCells = monthLabels.map(label => `
            <span class="contribution-month-label">${label}</span>
        `).join('');

        const weekCells = weeks.map(week => {
            const dayCells = week.map(day => {
                const level = getContributionLevel(day.count, maxCount);
                const tooltip = getContributionTooltip(day.date, day.count, day.latestTimestamp, day.inRange);
                const classes = [
                    'contribution-cell',
                    `contribution-level-${level}`,
                    day.inRange ? '' : 'is-out-of-range'
                ].filter(Boolean).join(' ');
                return `
                    <span
                        class="${classes}"
                        data-date="${day.dateKey}"
                        data-tooltip="${tooltip}"
                        aria-label="${tooltip}"
                    ></span>
                `;
            }).join('');
            return `<div class="contribution-week">${dayCells}</div>`;
        }).join('');

        elements.historyList.innerHTML = `
            <div class="contribution-history">
                <div class="contribution-history-header">
                    <p class="contribution-summary">${selectedYear} 年累计打卡 <strong>${totalActiveDays}</strong> 天</p>
                    <p class="contribution-latest">最近打卡：${latestText}</p>
                </div>
                <div class="contribution-body">
                    <div class="contribution-calendar">
                        <div class="contribution-weekday-labels">
                            <span>周一</span>
                            <span>周三</span>
                            <span>周五</span>
                        </div>
                        <div class="contribution-calendar-main">
                            <div class="contribution-months" style="--week-count: ${weeks.length};">
                                ${monthCells}
                            </div>
                            <div class="contribution-weeks">
                                ${weekCells}
                            </div>
                        </div>
                    </div>
                    <div class="contribution-year-selector">
                        <button class="year-btn${selectedYear === 2026 ? ' is-active' : ''}" data-year="2026">2026</button>
                        <button class="year-btn${selectedYear === 2025 ? ' is-active' : ''}" data-year="2025">2025</button>
                        <button class="year-btn${selectedYear === 2024 ? ' is-active' : ''}" data-year="2024">2024</button>
                    </div>
                </div>
            </div>
        `;

        setupContributionTooltip(elements.historyList);
    }

    function getContributionLevel(count, maxCount) {
        if (count <= 0) return 0;
        if (maxCount <= 1) return 4;
        const ratio = count / maxCount;
        if (ratio >= 0.75) return 4;
        if (ratio >= 0.5) return 3;
        if (ratio >= 0.25) return 2;
        return 1;
    }

    function getContributionTooltip(date, count, latestTimestamp, inRange) {
        const dayLabel = `${formatDate(date)}（${getDayOfWeek(date)}）`;
        if (!inRange) return `${dayLabel} 不在当前统计范围`;
        if (count === 0) return `${dayLabel} 未打卡`;
        if (latestTimestamp) return `${dayLabel} 打卡时间 ${formatTime(new Date(latestTimestamp))}`;
        return `${dayLabel} 已打卡`;
    }

    function getOrCreateContributionTooltip() {
        let tooltip = document.getElementById('contributionTooltip');
        if (tooltip) return tooltip;
        tooltip = document.createElement('div');
        tooltip.id = 'contributionTooltip';
        tooltip.className = 'contribution-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.style.opacity = '0';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function setupContributionTooltip(container) {
        if (!container) return;
        const tooltip = getOrCreateContributionTooltip();

        function hideTooltip() {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translate(-50%, calc(-100% + 4px))';
        }

        function moveTooltip(event) {
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.top = `${event.clientY - 12}px`;
        }

        function showTooltip(text, event) {
            tooltip.textContent = text;
            moveTooltip(event);
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translate(-50%, -100%)';
        }

        const cells = container.querySelectorAll('.contribution-cell[data-tooltip]');
        cells.forEach(cell => {
            cell.addEventListener('mouseenter', event => showTooltip(cell.dataset.tooltip || '', event));
            cell.addEventListener('mousemove', moveTooltip);
            cell.addEventListener('mouseleave', hideTooltip);
        });

        container.addEventListener('mouseleave', hideTooltip);
    }

    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDate(date) {
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    function formatTime(date) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    function getDayOfWeek(date) {
        return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    }

    init();
});
