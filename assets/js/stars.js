// assets/js/stars.js
(function () {
    function initStars() {
        const canvas = document.getElementById('starCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const MAX_DPR = 1.5;
        const BASE_DENSITY = 8000;
        const MIN_STARS = 60;
        const MAX_STARS = 220;
        const BASE_RADIUS = 150;
        const MIN_RADIUS = 80;
        const MAX_RADIUS = 260;
        const LINE_DISTANCE = 120;
        const LINE_DISTANCE_SQ = LINE_DISTANCE * LINE_DISTANCE;
        const CELL_SIZE = LINE_DISTANCE;

        let viewportWidth = 0;
        let viewportHeight = 0;
        let animationFrameId = 0;
        let resizeFrameId = 0;
        let interactionRadius = BASE_RADIUS;
        let gravityMode = false;
        let vortexStrength = 0;
        let longPressTimer = null;
        let initialPinchDistance = null;
        let initialRotationAngle = null;
        let isVisible = !document.hidden;
        let isThemeLight = document.body.classList.contains('theme-light');
        const mouse = { x: 0, y: 0 };
        const stars = [];

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function getStarCount() {
            const count = Math.floor((viewportWidth * viewportHeight) / BASE_DENSITY);
            return clamp(count, MIN_STARS, MAX_STARS);
        }

        function setCanvasSize() {
            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;

            const renderWidth = Math.floor(viewportWidth * dpr);
            const renderHeight = Math.floor(viewportHeight * dpr);

            if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
                canvas.width = renderWidth;
                canvas.height = renderHeight;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            if (!mouse.x && !mouse.y) {
                mouse.x = viewportWidth / 2;
                mouse.y = viewportHeight / 2;
            }
        }

        class Star {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = Math.random() * viewportWidth;
                this.y = Math.random() * viewportHeight;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.radius = Math.random() * 1.5 + 0.5;

                if (!initial) {
                    this.x = Math.random() < 0.5 ? 0 : viewportWidth;
                    this.y = Math.random() * viewportHeight;
                }
            }

            update() {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < interactionRadius * interactionRadius) {
                    const distance = Math.sqrt(distanceSquared) || 1;
                    const force = (interactionRadius - distance) / interactionRadius;

                    if (gravityMode) {
                        this.vx += (dx / distance) * force * 0.03;
                        this.vy += (dy / distance) * force * 0.03;
                    } else {
                        this.vx -= (dx / distance) * force * 0.02;
                        this.vy -= (dy / distance) * force * 0.02;
                    }

                    if (vortexStrength !== 0) {
                        this.vx += (-dy / distance) * vortexStrength * 0.02;
                        this.vy += (dx / distance) * vortexStrength * 0.02;
                    }
                }

                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > viewportWidth || this.y < 0 || this.y > viewportHeight) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            }
        }

        function syncStars() {
            const targetCount = getStarCount();

            while (stars.length < targetCount) {
                stars.push(new Star());
            }

            if (stars.length > targetCount) {
                stars.length = targetCount;
            }
        }

        function drawLinePair(a, b) {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared >= LINE_DISTANCE_SQ) return;

            const distance = Math.sqrt(distanceSquared);
            ctx.strokeStyle = `rgba(255,255,255,${1 - distance / LINE_DISTANCE})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        function drawLines() {
            const grid = new Map();

            for (const star of stars) {
                const cellX = Math.floor(star.x / CELL_SIZE);
                const cellY = Math.floor(star.y / CELL_SIZE);
                const key = `${cellX},${cellY}`;

                if (!grid.has(key)) {
                    grid.set(key, []);
                }

                grid.get(key).push(star);
            }

            const neighborOffsets = [
                [1, 0],
                [0, 1],
                [1, 1],
                [1, -1]
            ];

            grid.forEach((cellStars, key) => {
                const [cellX, cellY] = key.split(',').map(Number);

                for (let i = 0; i < cellStars.length; i += 1) {
                    for (let j = i + 1; j < cellStars.length; j += 1) {
                        drawLinePair(cellStars[i], cellStars[j]);
                    }
                }

                for (const [offsetX, offsetY] of neighborOffsets) {
                    const neighborStars = grid.get(`${cellX + offsetX},${cellY + offsetY}`);
                    if (!neighborStars) continue;

                    for (const star of cellStars) {
                        for (const neighbor of neighborStars) {
                            drawLinePair(star, neighbor);
                        }
                    }
                }
            });
        }

        function renderFrame() {
            animationFrameId = 0;

            if (!isVisible || isThemeLight) {
                ctx.clearRect(0, 0, viewportWidth, viewportHeight);
                return;
            }

            ctx.clearRect(0, 0, viewportWidth, viewportHeight);

            for (const star of stars) {
                star.update();
                star.draw();
            }

            drawLines();
            animationFrameId = window.requestAnimationFrame(renderFrame);
        }

        function requestRender() {
            if (!animationFrameId && isVisible) {
                animationFrameId = window.requestAnimationFrame(renderFrame);
            }
        }

        function handleResize() {
            if (resizeFrameId) return;

            resizeFrameId = window.requestAnimationFrame(() => {
                resizeFrameId = 0;
                setCanvasSize();
                syncStars();
                requestRender();
            });
        }

        function updatePointerPosition(clientX, clientY) {
            mouse.x = clientX;
            mouse.y = clientY;
        }

        function clearLongPress() {
            if (longPressTimer) {
                window.clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }

        function handleVisibilityChange() {
            isVisible = !document.hidden;

            if (isVisible && !isThemeLight) {
                requestRender();
                return;
            }

            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
        }

        function handleThemeChange(event) {
            isThemeLight = event.detail && event.detail.theme === 'light';

            if (isThemeLight) {
                ctx.clearRect(0, 0, viewportWidth, viewportHeight);

                if (animationFrameId) {
                    window.cancelAnimationFrame(animationFrameId);
                    animationFrameId = 0;
                }

                return;
            }

            requestRender();
        }

        setCanvasSize();
        syncStars();

        window.addEventListener('resize', handleResize, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('site-theme-change', handleThemeChange);

        window.addEventListener('mousemove', (event) => {
            updatePointerPosition(event.clientX, event.clientY);
        }, { passive: true });

        window.addEventListener('mousedown', (event) => {
            updatePointerPosition(event.clientX, event.clientY);
            gravityMode = true;
        }, { passive: true });

        window.addEventListener('mouseup', () => {
            gravityMode = false;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            gravityMode = false;
        }, { passive: true });

        window.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                updatePointerPosition(touch.clientX, touch.clientY);

                clearLongPress();
                longPressTimer = window.setTimeout(() => {
                    gravityMode = true;
                }, 400);
            }

            if (event.touches.length === 2) {
                clearLongPress();

                const [a, b] = event.touches;
                initialPinchDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                initialRotationAngle = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                updatePointerPosition(touch.clientX, touch.clientY);
            }

            if (event.touches.length === 2 && initialPinchDistance !== null && initialRotationAngle !== null) {
                const [a, b] = event.touches;
                const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
                const angle = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);

                interactionRadius = clamp(BASE_RADIUS + (distance - initialPinchDistance) * 0.3, MIN_RADIUS, MAX_RADIUS);
                vortexStrength = (angle - initialRotationAngle) * 0.6;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            clearLongPress();
            gravityMode = false;
            vortexStrength = 0;
            initialPinchDistance = null;
            initialRotationAngle = null;
            interactionRadius = BASE_RADIUS;
        }, { passive: true });

        window.addEventListener('pagehide', () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
            }
        }, { passive: true });

        window.requestAnimationFrame(() => {
            if (!isThemeLight) {
                requestRender();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStars, { once: true });
    } else {
        initStars();
    }
})();
