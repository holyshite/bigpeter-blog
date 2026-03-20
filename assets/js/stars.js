// assets/js/stars.js
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById("starCanvas");
    const ctx = canvas.getContext("2d");

    let w, h;
    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    const mouse = { x: w / 2, y: h / 2 };
    let interactionRadius = 150;
    let gravityMode = false;
    let vortexStrength = 0;

    let longPressTimer = null;
    let initialPinchDistance = null;
    let initialRotationAngle = null;

    /* ===== 鼠标 ===== */
    window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mousedown", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        gravityMode = true;
    });

    window.addEventListener("mouseup", () => {
        gravityMode = false;
    });

    window.addEventListener("mouseleave", () => {
        gravityMode = false;
    });

    /* ===== 触摸 ===== */
    window.addEventListener("touchstart", e => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;

            longPressTimer = setTimeout(() => {
                gravityMode = true;
            }, 400);
        }

        if (e.touches.length === 2) {
            clearTimeout(longPressTimer);

            const [a, b] = e.touches;
            initialPinchDistance = Math.hypot(
                a.clientX - b.clientX,
                a.clientY - b.clientY
            );
            initialRotationAngle = Math.atan2(
                b.clientY - a.clientY,
                b.clientX - a.clientX
            );
        }
    }, { passive: false });

    window.addEventListener("touchmove", e => {
        if (e.touches.length === 1) {
            const t = e.touches[0];
            mouse.x = t.clientX;
            mouse.y = t.clientY;
        }

        if (e.touches.length === 2) {
            const [a, b] = e.touches;
            const dist = Math.hypot(
                a.clientX - b.clientX,
                a.clientY - b.clientY
            );
            const angle = Math.atan2(
                b.clientY - a.clientY,
                b.clientX - a.clientX
            );

            interactionRadius = 150 + (dist - initialPinchDistance) * 0.3;
            interactionRadius = Math.max(80, Math.min(260, interactionRadius));

            vortexStrength = (angle - initialRotationAngle) * 0.6;
        }
    }, { passive: false });

    window.addEventListener("touchend", () => {
        clearTimeout(longPressTimer);
        gravityMode = false;
        vortexStrength = 0;
        initialPinchDistance = null;
        initialRotationAngle = null;
        interactionRadius = 150;
    });

    const STAR_COUNT = Math.floor((w * h) / 8000);
    const stars = [];

    class Star {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
        }

        update() {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < interactionRadius) {
                const force = (interactionRadius - dist) / interactionRadius;

                if (gravityMode) {
                    this.vx += dx / dist * force * 0.03;
                    this.vy += dy / dist * force * 0.03;
                } else {
                    this.vx -= dx / dist * force * 0.02;
                    this.vy -= dy / dist * force * 0.02;
                }

                if (vortexStrength !== 0) {
                    this.vx += -dy / dist * vortexStrength * 0.02;
                    this.vy += dx / dist * vortexStrength * 0.02;
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();
        }
    }

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star());
    }

    function drawLines() {
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.strokeStyle = `rgba(255,255,255,${1 - dist / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(stars[i].x, stars[i].y);
                    ctx.lineTo(stars[j].x, stars[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            s.update();
            s.draw();
        });
        drawLines();
        requestAnimationFrame(animate);
    }

    animate();
});