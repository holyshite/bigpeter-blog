// checkin.js
// 基于GitHub Issues的打卡系统

document.addEventListener('DOMContentLoaded', function () {
    // 配置
    const CONFIG = {
        // GitHub仓库信息（默认使用当前博客仓库）
        repoOwner: 'holyshite', // 从GitHub URL获取
        repoName: 'bigpeter-blog', // 仓库名
        issueNumber: 2, // 用于存储打卡记录的issue编号

        // API端点
        apiBase: 'https://api.github.com',

        // 本地存储键名
        storageKeys: {
            token: 'github_token',
            lastCheckin: 'last_checkin_date',
            checkinHistory: 'checkin_history_cache'
        }
    };

    // DOM元素
    const elements = {
        todayStatus: document.getElementById('todayStatus'),
        checkinBtn: document.getElementById('checkinBtn'),
        totalDays: document.getElementById('totalDays'),
        currentStreak: document.getElementById('currentStreak'),
        longestStreak: document.getElementById('longestStreak'),
        thisMonth: document.getElementById('thisMonth'),
        historyList: document.getElementById('historyList'),
        configHint: document.getElementById('configHint')
    };

    // 状态
    let state = {
        token: null,
        todayCheckedIn: false,
        checkinHistory: [],
        isLoading: true,
        userInfo: null // 存储用户信息（GitHub用户名等）
    };

    // 从本地存储加载应用配置
    function loadAppConfig() {
        // 从本地存储加载仓库配置（如果存在）
        const savedOwner = localStorage.getItem('github_repo_owner');
        const savedRepo = localStorage.getItem('github_repo_name');
        const savedIssue = localStorage.getItem('github_issue_number');

        // 更新配置常量（如果本地存储中有值）
        if (savedOwner) CONFIG.repoOwner = savedOwner;
        if (savedRepo) CONFIG.repoName = savedRepo;
        if (savedIssue) CONFIG.issueNumber = parseInt(savedIssue);
    }

    // 获取GitHub用户信息
    async function getGitHubUserInfo(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API错误: ${response.status}`);
            }

            const userData = await response.json();
            return {
                login: userData.login,
                id: userData.id,
                name: userData.name || userData.login,
                avatarUrl: userData.avatar_url
            };
        } catch (error) {
            console.error('获取用户信息失败:', error);
            throw error;
        }
    }

    // 初始化
    async function init() {
        showLoadingState();

        // 加载应用配置（仓库、issue等）
        loadAppConfig();

        // 检查GitHub token
        state.token = localStorage.getItem(CONFIG.storageKeys.token);

        if (!state.token) {
            showConfigHint();
            // 即使没有token，也显示空的贡献日历
            state.checkinHistory = [];
            updateUI();
            hideLoadingState();
            return;
        }

        // 隐藏配置提示
        if (elements.configHint) {
            elements.configHint.style.display = 'none';
        }

        try {
            // 尝试获取用户信息（如果失败，继续但不进行用户过滤）
            try {
                state.userInfo = await getGitHubUserInfo(state.token);
                console.log('用户信息获取成功:', state.userInfo.login);
            } catch (userInfoError) {
                console.warn('获取用户信息失败，继续加载数据（无用户过滤）:', userInfoError);
                state.userInfo = null;
            }
            
            // 加载打卡历史
            await loadCheckinHistory();

            // 更新UI
            updateUI();

            // 启用打卡按钮
            if (elements.checkinBtn) {
                elements.checkinBtn.disabled = false;
                elements.checkinBtn.querySelector('.btn-text').textContent = '立即打卡';
                elements.checkinBtn.addEventListener('click', handleCheckin);
            }

        } catch (error) {
            console.error('初始化失败:', error);
            showErrorState('加载打卡数据失败，请检查网络连接和GitHub Token权限');
        } finally {
            hideLoadingState();
            state.isLoading = false;
        }
    }

    // 显示加载状态
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

        if (elements.historyList) {
            elements.historyList.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-line"></div>
                    <div class="loading-line"></div>
                    <div class="loading-line"></div>
                </div>
            `;
        }
    }

    // 隐藏加载状态
    function hideLoadingState() {
        // 移除加载状态，但保留当前显示的内容
    }

    // 显示错误状态
    function showErrorState(message) {
        if (elements.todayStatus) {
            elements.todayStatus.innerHTML = `
                <p>❌ ${message}</p>
                <button class="retry-btn" id="retryBtn">重试</button>
            `;
            elements.todayStatus.className = 'status-error';

            // 添加重试按钮事件
            const retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function () {
                    init();
                });
            }
        }

        if (elements.checkinBtn) {
            elements.checkinBtn.disabled = true;
            elements.checkinBtn.querySelector('.btn-text').textContent = '加载失败';
        }
    }

    // 显示配置提示
    function showConfigHint() {
        // 显示配置提示文本
        if (elements.configHint) {
            elements.configHint.style.display = 'block';
        }

        // 显示整个配置区域（如果存在）
        const configSection = document.getElementById('configSection');
        if (configSection) {
            configSection.style.display = 'block';
            document.body.classList.add('config-modal-open');

            // 确保表单部分可见
            const configForm = document.getElementById('configForm');
            const configSuccess = document.getElementById('configSuccess');
            if (configForm) configForm.style.display = 'block';
            if (configSuccess) configSuccess.style.display = 'none';

        }

        // 禁用打卡按钮
        if (elements.checkinBtn) {
            elements.checkinBtn.disabled = true;
            elements.checkinBtn.querySelector('.btn-text').textContent = '需要配置GitHub Token';
        }

        // 更新状态显示（保留今日状态，由updateUI处理）
        // 不再覆盖今日状态，以显示打卡图
    }

    // 加载打卡历史
    async function loadCheckinHistory() {
        try {
            // 从GitHub Issues获取打卡历史
            const history = await fetchCheckinHistory();
            state.checkinHistory = history;

            // 缓存到本地存储
            localStorage.setItem(
                CONFIG.storageKeys.checkinHistory,
                JSON.stringify(history)
            );

        } catch (error) {
            console.error('加载打卡历史失败:', error);

            // 尝试从本地缓存加载
            const cached = localStorage.getItem(CONFIG.storageKeys.checkinHistory);
            if (cached) {
                try {
                    const cachedHistory = JSON.parse(cached);
                    // 过滤本地缓存数据：只显示当前用户的数据
                    if (state.userInfo) {
                        state.checkinHistory = cachedHistory.filter(item => 
                            !item.userId || item.userId === state.userInfo.login
                        );
                    } else {
                        state.checkinHistory = cachedHistory;
                    }
                } catch (e) {
                    state.checkinHistory = [];
                }
            }
        }
    }

    // 从GitHub Issues获取打卡历史
    async function fetchCheckinHistory() {
        const response = await fetch(
            `${CONFIG.apiBase}/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/issues/${CONFIG.issueNumber}/comments`,
            {
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API错误: ${response.status}`);
        }

        const comments = await response.json();

        // 解析打卡记录
        const checkins = [];
        comments.forEach(comment => {
            try {
                const data = JSON.parse(comment.body);
                if (data.type === 'checkin' && data.date) {
                    // 提取用户标识符（兼容旧数据）
                    const userId = data.userId || data.userInfo?.login || null;
                    
                    // 过滤逻辑：如果已获取当前用户信息，则只显示当前用户的数据
                    // 如果没有获取到用户信息或数据没有用户标识符，则显示所有数据（向后兼容）
                    const shouldInclude = !state.userInfo || 
                                         !userId || 
                                         userId === state.userInfo.login;
                    
                    if (shouldInclude) {
                        checkins.push({
                            date: data.date,
                            timestamp: data.timestamp || new Date(data.date + 'T00:00:00').getTime(),
                            note: data.note || '',
                            commentId: comment.id,
                            userId: userId
                        });
                    }
                }
            } catch (e) {
                // 忽略非JSON格式的评论
            }
        });

        // 按日期排序（最新的在前）
        return checkins.sort((a, b) => b.timestamp - a.timestamp);
    }

    // 处理打卡
    async function handleCheckin() {
        if (!state.token) {
            showConfigHint();
            return;
        }

        // 基于历史记录检查今天是否已打卡（确保状态最新）
        const todayStatus = checkTodayStatusFromHistory();
        if (todayStatus.hasCheckedIn) {
            alert('今天已经打过卡了！');
            return;
        }

        // 禁用按钮
        if (elements.checkinBtn) {
            elements.checkinBtn.disabled = true;
            elements.checkinBtn.querySelector('.btn-text').textContent = '打卡中...';
        }

        try {
            // 获取当前日期
            const today = new Date();
            const dateStr = getLocalDateString(today); // YYYY-MM-DD（本地时间）

            // 创建打卡记录（记录实际打卡时间）
            const checkinData = {
                type: 'checkin',
                date: dateStr,
                timestamp: today.getTime(),
                note: '每日打卡',
                // 添加用户标识符（如果已获取用户信息）
                userId: state.userInfo ? state.userInfo.login : null
            };

            // 发送到GitHub
            const success = await postCheckin(checkinData);

            if (success) {
                // 将新打卡记录添加到历史记录中
                state.checkinHistory.unshift({
                    date: dateStr,
                    timestamp: today.getTime(),
                    note: '每日打卡',
                    userId: state.userInfo ? state.userInfo.login : null
                });

                // 更新本地存储（作为缓存）
                localStorage.setItem(CONFIG.storageKeys.lastCheckin, dateStr);
                localStorage.setItem(
                    CONFIG.storageKeys.checkinHistory,
                    JSON.stringify(state.checkinHistory)
                );

                // 显示成功消息
                if (elements.todayStatus) {
                    elements.todayStatus.innerHTML = `
                        <p>✅ 打卡成功！</p>
                        <p class="checkin-time">${formatTime(today)}</p>
                    `;
                    elements.todayStatus.className = 'status-success';
                }

                // 更新整个UI（包括统计和历史记录）
                updateUI();

            } else {
                throw new Error('打卡失败');
            }

        } catch (error) {
            console.error('打卡失败:', error);
            alert('打卡失败，请检查网络连接和GitHub Token权限');

            if (elements.todayStatus) {
                elements.todayStatus.innerHTML = '<p>❌ 打卡失败</p>';
                elements.todayStatus.className = 'status-error';
            }
        } finally {
            // 重新启用按钮
            if (elements.checkinBtn) {
                elements.checkinBtn.disabled = false;
                elements.checkinBtn.querySelector('.btn-text').textContent = '立即打卡';
            }
        }
    }

    // 发送打卡记录到GitHub
    async function postCheckin(data) {
        const response = await fetch(
            `${CONFIG.apiBase}/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/issues/${CONFIG.issueNumber}/comments`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${state.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    body: JSON.stringify(data)
                })
            }
        );

        return response.ok;
    }

    // 检查今天是否已打卡（从历史记录中检查）
    function checkTodayStatusFromHistory() {
        if (!state.checkinHistory || state.checkinHistory.length === 0) {
            return { hasCheckedIn: false, checkinTime: null };
        }

        const today = getLocalDateString(new Date());
        
        // 查找今天的打卡记录
        const todayCheckin = state.checkinHistory.find(item => item.date === today);
        
        if (todayCheckin) {
            return {
                hasCheckedIn: true,
                checkinTime: new Date(todayCheckin.timestamp)
            };
        }
        
        return { hasCheckedIn: false, checkinTime: null };
    }

    // 更新UI
    function updateUI() {
        // 检查今日是否已打卡（从GitHub历史记录）
        const todayStatus = checkTodayStatusFromHistory();
        state.todayCheckedIn = todayStatus.hasCheckedIn;

        // 更新今日状态
        if (elements.todayStatus) {
            if (state.todayCheckedIn) {
                const timeDisplay = todayStatus.checkinTime ? 
                    `<p class="checkin-time">${formatTime(todayStatus.checkinTime)}</p>` : '';
                    
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

        // 更新统计
        updateStats();

        // 更新历史记录
        updateHistoryList();
    }

    // 更新统计信息
    function updateStats() {
        const stats = calculateStats(state.checkinHistory);

        if (elements.totalDays) {
            elements.totalDays.textContent = stats.totalDays;
        }
        if (elements.currentStreak) {
            elements.currentStreak.textContent = stats.currentStreak;
        }
        if (elements.longestStreak) {
            elements.longestStreak.textContent = stats.longestStreak;
        }
        if (elements.thisMonth) {
            elements.thisMonth.textContent = stats.thisMonth;
        }
    }

    // 计算统计信息
    function calculateStats(history) {
        if (!history || history.length === 0) {
            return {
                totalDays: 0,
                currentStreak: 0,
                longestStreak: 0,
                thisMonth: 0
            };
        }

        // 总天数
        const totalDays = history.length;

        // 本月打卡天数
        const now = new Date();
        const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1);
        const thisMonth = history.filter(item => {
            const date = new Date(item.date);
            const month = date.getFullYear() * 100 + (date.getMonth() + 1);
            return month === currentMonth;
        }).length;

        // 计算连续打卡
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // 按日期排序（最旧在前）
        const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
        let prevDate = null;

        for (let i = 0; i < sorted.length; i++) {
            const currentDate = new Date(sorted[i].date);

            if (prevDate) {
                const diffDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak++;
                } else if (diffDays > 1) {
                    // 断签
                    if (tempStreak > longestStreak) {
                        longestStreak = tempStreak;
                    }
                    tempStreak = 0;
                }
            } else {
                tempStreak = 1;
            }

            prevDate = currentDate;
        }

        // 检查最后一个连续记录
        if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
        }

        // 当前连续打卡（从最新日期开始往前计算）
        const today = new Date();
        const todayStr = getLocalDateString(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateSet = new Set(history.map(item => item.date));
        currentStreak = 0;

        // 检查今天是否打卡
        let checkDate = dateSet.has(todayStr) ? today : yesterday;
        let checkDateStr = getLocalDateString(checkDate);

        while (dateSet.has(checkDateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            checkDateStr = getLocalDateString(checkDate);
        }

        return {
            totalDays,
            currentStreak,
            longestStreak,
            thisMonth
        };
    }

    // 更新历史记录列表
    function updateHistoryList() {
        if (!elements.historyList) return;

        // 即使没有打卡记录，也显示空的贡献日历网格
        if (!state.checkinHistory) {
            state.checkinHistory = [];
        }

        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);

        const firstDisplayDate = new Date(endDate);
        firstDisplayDate.setDate(firstDisplayDate.getDate() - 364);

        const gridStartDate = new Date(firstDisplayDate);
        gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay());

        const checkinInfoByDate = new Map();
        state.checkinHistory.forEach(item => {
            if (!item.date) return;
            const existing = checkinInfoByDate.get(item.date);
            const currentTimestamp = Number(item.timestamp) || 0;

            if (!existing) {
                checkinInfoByDate.set(item.date, {
                    count: 1,
                    latestTimestamp: currentTimestamp
                });
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
                const inRange = currentDate >= firstDisplayDate && currentDate <= endDate;
                const checkinInfo = inRange ? checkinInfoByDate.get(key) : null;
                const count = checkinInfo ? checkinInfo.count : 0;
                const latestTimestamp = checkinInfo ? checkinInfo.latestTimestamp : null;

                week.push({
                    date: currentDate,
                    dateKey: key,
                    count,
                    latestTimestamp,
                    inRange
                });

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

        const totalActiveDays = Array.from(checkinInfoByDate.keys()).length;
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
                    <p class="contribution-summary">过去一年累计打卡 <strong>${totalActiveDays}</strong> 天</p>
                    <p class="contribution-latest">最近打卡：${latestText}</p>
                </div>
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

        if (latestTimestamp) {
            return `${dayLabel} 打卡时间 ${formatTime(new Date(latestTimestamp))}`;
        }

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
        cells.forEach((cell) => {
            cell.addEventListener('mouseenter', (event) => {
                showTooltip(cell.dataset.tooltip || '', event);
            });

            cell.addEventListener('mousemove', moveTooltip);
            cell.addEventListener('mouseleave', hideTooltip);
        });

        container.addEventListener('mouseleave', hideTooltip);
    }

    // 工具函数：获取本地YYYY-MM-DD格式的日期
    function getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 工具函数：格式化日期
    function formatDate(date) {
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // 工具函数：格式化时间
    function formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 工具函数：获取星期几
    function getDayOfWeek(date) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    }

    // ========== 配置管理功能 ==========
    function setupConfigManagement() {
        // 获取配置相关元素
        const configSection = document.getElementById('configSection');
        const configForm = document.getElementById('configForm');
        const configSuccess = document.getElementById('configSuccess');
        const configStatus = document.getElementById('configStatus');
        const showConfigBtn = document.getElementById('showConfigBtn');
        const showTokenStatusBtn = document.getElementById('showTokenStatusBtn');
        const cancelConfigBtn = document.getElementById('cancelConfigBtn');
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        const clearConfigBtn = document.getElementById('clearConfigBtn');
        const testConfigBtn = document.getElementById('testConfigBtn');
        const githubTokenInput = document.getElementById('githubTokenInput');
        const repoOwnerInput = document.getElementById('repoOwnerInput');
        const repoNameInput = document.getElementById('repoNameInput');
        const issueNumberInput = document.getElementById('issueNumberInput');
        const toggleTokenVisibility = document.getElementById('toggleTokenVisibility');
        const refreshNowBtn = document.getElementById('refreshNowBtn');

        // 如果配置元素不存在，则退出（可能不在打卡页面）
        if (!configSection) return;

        // 将配置弹窗挂载到 body，避免被玻璃容器的层叠上下文/滤镜影响定位与点击
        if (configSection.parentElement !== document.body) {
            document.body.appendChild(configSection);
        }

        // 加载现有配置
        loadConfigFromStorage();

        // 按钮显示控制函数
        function showConfigUI() {
            configSection.style.display = 'block';
            document.body.classList.add('config-modal-open');
            configForm.style.display = 'block';
            configSuccess.style.display = 'none';
            configStatus.style.display = 'none';
        }

        function hideConfigUI() {
            configSection.style.display = 'none';
            document.body.classList.remove('config-modal-open');
        }

        // 显示/隐藏配置区域
        if (showConfigBtn) {
            showConfigBtn.addEventListener('click', showConfigUI);
        }

        // 显示令牌状态
        if (showTokenStatusBtn) {
            showTokenStatusBtn.addEventListener('click', function () {
                alert(`当前令牌状态：${state.token ? '已配置' : '未配置'}\n存储键名：${CONFIG.storageKeys.token}`);
            });
        }

        // 取消配置
        if (cancelConfigBtn) {
            cancelConfigBtn.addEventListener('click', hideConfigUI);
        }

        // 切换令牌可见性
        if (toggleTokenVisibility) {
            toggleTokenVisibility.addEventListener('click', function () {
                const type = githubTokenInput.getAttribute('type');
                if (type === 'password') {
                    githubTokenInput.setAttribute('type', 'text');
                    toggleTokenVisibility.textContent = '🙈';
                    toggleTokenVisibility.title = '隐藏令牌';
                } else {
                    githubTokenInput.setAttribute('type', 'password');
                    toggleTokenVisibility.textContent = '👁️';
                    toggleTokenVisibility.title = '显示令牌';
                }
            });
        }

        // 保存配置
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', async function () {
                const token = githubTokenInput.value.trim();
                const owner = repoOwnerInput.value.trim();
                const repo = repoNameInput.value.trim();
                const issueNumber = parseInt(issueNumberInput.value);

                if (!token) {
                    showConfigStatus('请输入GitHub个人访问令牌', 'error');
                    return;
                }

                // 显示加载状态
                const btnText = saveConfigBtn.querySelector('.btn-text');
                const spinner = saveConfigBtn.querySelector('.loading-spinner');
                btnText.textContent = '验证中...';
                spinner.style.display = 'inline-block';
                saveConfigBtn.disabled = true;

                try {
                    // 验证令牌
                    const isValid = await validateGitHubToken(token);
                    if (!isValid) {
                        throw new Error('令牌验证失败，请检查令牌是否有 repo 权限');
                    }

                    // 保存到本地存储
                    localStorage.setItem(CONFIG.storageKeys.token, token);
                    localStorage.setItem('github_repo_owner', owner);
                    localStorage.setItem('github_repo_name', repo);
                    localStorage.setItem('github_issue_number', issueNumber.toString());

                    // 更新配置常量
                    CONFIG.repoOwner = owner;
                    CONFIG.repoName = repo;
                    CONFIG.issueNumber = issueNumber;

                    // 更新应用状态
                    state.token = token;

                    // 显示成功消息
                    configForm.style.display = 'none';
                    configSuccess.style.display = 'block';

                    // 设置自动刷新
                    setTimeout(() => {
                        location.reload();
                    }, 3000);

                } catch (error) {
                    console.error('配置保存失败:', error);
                    showConfigStatus(`配置失败: ${error.message}`, 'error');
                } finally {
                    // 恢复按钮状态
                    btnText.textContent = '保存并验证';
                    spinner.style.display = 'none';
                    saveConfigBtn.disabled = false;
                }
            });
        }

        // 清除配置
        if (clearConfigBtn) {
            clearConfigBtn.addEventListener('click', function () {
                if (confirm('确定要清除所有配置吗？这将删除本地存储的GitHub令牌和设置。')) {
                    localStorage.removeItem(CONFIG.storageKeys.token);
                    localStorage.removeItem('github_repo_owner');
                    localStorage.removeItem('github_repo_name');
                    localStorage.removeItem('github_issue_number');
                    localStorage.removeItem(CONFIG.storageKeys.checkinHistory);
                    localStorage.removeItem(CONFIG.storageKeys.lastCheckin);

                    // 清空输入框
                    githubTokenInput.value = '';
                    repoOwnerInput.value = 'holyshite';
                    repoNameInput.value = 'bigpeter-blog';
                    issueNumberInput.value = '2';

                    // 重置状态
                    state.token = null;

                    showConfigStatus('配置已清除', 'success');
                }
            });
        }

        // 测试连接
        if (testConfigBtn) {
            testConfigBtn.addEventListener('click', async function () {
                const token = githubTokenInput.value.trim();
                if (!token) {
                    showConfigStatus('请输入GitHub令牌进行测试', 'error');
                    return;
                }

                const btnText = testConfigBtn.querySelector('.btn-text');
                const originalText = btnText.textContent;
                btnText.textContent = '测试中...';
                testConfigBtn.disabled = true;

                try {
                    const isValid = await validateGitHubToken(token);
                    if (isValid) {
                        showConfigStatus('✅ 连接测试成功！令牌有效且具有必要权限。', 'success');
                    } else {
                        showConfigStatus('❌ 连接测试失败：令牌无效或权限不足', 'error');
                    }
                } catch (error) {
                    showConfigStatus(`❌ 测试失败: ${error.message}`, 'error');
                } finally {
                    btnText.textContent = originalText;
                    testConfigBtn.disabled = false;
                }
            });
        }

        // 立即刷新按钮
        if (refreshNowBtn) {
            refreshNowBtn.addEventListener('click', function () {
                location.reload();
            });
        }

        // 显示配置状态消息
        function showConfigStatus(message, type) {
            if (!configStatus) return;

            configStatus.textContent = message;
            configStatus.className = `config-status config-status-${type}`;
            configStatus.style.display = 'block';

            // 5秒后自动隐藏
            setTimeout(() => {
                configStatus.style.display = 'none';
            }, 5000);
        }

        // 从本地存储加载配置到输入框
        function loadConfigFromStorage() {
            const savedToken = localStorage.getItem(CONFIG.storageKeys.token);
            const savedOwner = localStorage.getItem('github_repo_owner');
            const savedRepo = localStorage.getItem('github_repo_name');
            const savedIssue = localStorage.getItem('github_issue_number');

            if (githubTokenInput && savedToken) {
                githubTokenInput.value = savedToken;
            }
            if (repoOwnerInput && savedOwner) {
                repoOwnerInput.value = savedOwner;
            }
            if (repoNameInput && savedRepo) {
                repoNameInput.value = savedRepo;
            }
            if (issueNumberInput && savedIssue) {
                issueNumberInput.value = savedIssue;
            }
        }

        // 验证GitHub令牌
        async function validateGitHubToken(token) {
            try {
                const response = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    return false;
                }

                // 检查是否有repo权限（repo或public_repo）
                const scopes = response.headers.get('x-oauth-scopes');
                if (!scopes || (!scopes.includes('repo') && !scopes.includes('public_repo'))) {
                    console.warn('令牌缺少 repo 或 public_repo 权限，当前权限:', scopes);
                    return false;
                }

                return true;
            } catch (error) {
                console.error('令牌验证错误:', error);
                return false;
            }
        }
    }

    // 初始化应用
    setupConfigManagement();
    init();
});
