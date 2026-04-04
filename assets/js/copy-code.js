// copy-code.js
// 为代码块添加复制按钮功能

document.addEventListener('DOMContentLoaded', function() {
    // 选择所有代码块容器
    const codeBlocks = document.querySelectorAll('div.highlighter-rouge');
    
    if (codeBlocks.length === 0) return;
    
    codeBlocks.forEach((codeBlock, index) => {
        // 确保代码块有相对定位
        codeBlock.style.position = 'relative';
        
        // 检查是否已存在复制按钮
        if (codeBlock.querySelector('.copy-code-btn')) return;
        
        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.setAttribute('type', 'button');
        copyButton.setAttribute('aria-label', '复制代码');
        copyButton.setAttribute('title', '复制代码到剪贴板');
        copyButton.setAttribute('data-index', index);
        
        // 创建SVG图标
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '14');
        svg.setAttribute('height', '14');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '9');
        rect.setAttribute('y', '9');
        rect.setAttribute('width', '13');
        rect.setAttribute('height', '13');
        rect.setAttribute('rx', '2');
        rect.setAttribute('ry', '2');
        
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
        
        svg.appendChild(rect);
        svg.appendChild(path1);
        
        copyButton.appendChild(svg);
        
        // 确保按钮在右上角
        copyButton.style.position = 'absolute';
        copyButton.style.top = '0';
        copyButton.style.right = '0';
        copyButton.style.zIndex = '2';
        copyButton.style.background = 'transparent';
        copyButton.style.border = 'none';
        copyButton.style.padding = '6px 8px';
        copyButton.style.cursor = 'pointer';
        
        codeBlock.appendChild(copyButton);
        
        // 添加点击事件
        copyButton.addEventListener('click', async function() {
            // 从代码块中提取代码文本
            const codeElement = codeBlock.querySelector('code');
            if (!codeElement) return;
            
            let codeText = codeElement.textContent || '';
            
            // 清理代码文本（移除行号）
            const lines = codeText.split('\n');
            const cleanedLines = lines.map(line => {
                // 移除可能存在的行号
                return line.replace(/^\s*\d+\s*/, '');
            });
            codeText = cleanedLines.join('\n').trim();
            
            try {
                await navigator.clipboard.writeText(codeText);
                
                // 更新按钮状态
                const originalTitle = copyButton.getAttribute('title');
                const originalSvg = copyButton.innerHTML;
                
                // 临时显示成功状态
                copyButton.setAttribute('title', '已复制！');
                copyButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
                copyButton.style.opacity = '1';
                
                // 2秒后恢复原状
                setTimeout(() => {
                    copyButton.setAttribute('title', originalTitle);
                    copyButton.innerHTML = originalSvg;
                }, 2000);
                
            } catch (err) {
                console.error('复制失败:', err);
                copyButton.setAttribute('title', '复制失败');
                copyButton.style.opacity = '1';
                
                setTimeout(() => {
                    copyButton.setAttribute('title', '复制代码到剪贴板');
                }, 2000);
            }
        });
    });
});