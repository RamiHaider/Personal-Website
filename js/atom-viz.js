(function () {
    'use strict';

    var canvas = document.getElementById('atom-viz');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    /* ── Config ── */
    var N          = 120;      // number of atoms
    var SPHERE_R   = 220;      // base sphere radius
    var REPEL_R    = 130;      // mouse repulsion radius (screen px)
    var REPEL_F    = 3.5;      // repulsion force strength (weak — nodes stay tethered)
    var SPRING_K   = 0.08;     // spring constant (strong — snaps back fast)
    var DAMPING    = 0.78;     // velocity damping
    var CONN_DIST  = 95;       // max screen-distance for bond lines
    var AUTO_ROT   = 0.0045;   // auto-rotation speed (rad/frame)
    var FOV        = 520;      // perspective field of view

    /* ── State ── */
    var W, H, CX, CY;
    var rotX = 0.28, rotY = 0;
    var dragging = false;
    var lastMX = 0, lastMY = 0;
    var mouseX = -9999, mouseY = -9999;
    var hovering = false;
    var atoms = [];
    var startTime = null;

    /* ── Resize ── */
    function resize() {
        W  = canvas.width  = canvas.offsetWidth;
        H  = canvas.height = canvas.offsetHeight || 400;
        CX = W / 2;
        CY = H / 2;
    }

    /* ── Build atoms on a Fibonacci sphere ── */
    function buildAtoms() {
        atoms = [];
        var golden = Math.PI * (1 + Math.sqrt(5));
        for (var i = 0; i < N; i++) {
            var t   = i / (N - 1);
            var inc = Math.acos(1 - 2 * t);
            var az  = golden * i;
            var r   = SPHERE_R * (0.60 + 0.40 * Math.random());
            var ox  = r * Math.sin(inc) * Math.cos(az);
            var oy  = r * Math.sin(inc) * Math.sin(az);
            var oz  = r * Math.cos(inc);
            atoms.push({
                ox: ox, oy: oy, oz: oz,   // rest position
                x:  ox, y:  oy, z:  oz,   // current position
                vx: 0,  vy: 0,  vz: 0,    // velocity
                size:       2.0 + Math.random() * 3.2,
                driftAmp:   4   + Math.random() * 9,
                driftSpeed: 0.28 + Math.random() * 0.55,
                driftPhase: Math.random() * Math.PI * 2,
                hue:        195 + Math.random() * 45,   // blue-cyan range
            });
        }
    }

    /* ── 3-D rotation (Y then X) ── */
    function rotate(x, y, z, rx, ry) {
        var cy = Math.cos(ry), sy = Math.sin(ry);
        var x1 = x * cy + z * sy;
        var z1 = -x * sy + z * cy;
        var cx2 = Math.cos(rx), sx2 = Math.sin(rx);
        var y2  = y * cx2 - z1 * sx2;
        var z2  = y * sx2 + z1 * cx2;
        return [x1, y2, z2];
    }

    /* ── Perspective project ── */
    function project(rx, ry, rz) {
        var s = FOV / (FOV + rz + SPHERE_R);
        return [CX + rx * s, CY + ry * s, s];
    }

    /* ── Main loop ── */
    function frame(ts) {
        requestAnimationFrame(frame);
        if (!startTime) startTime = ts;
        var t = (ts - startTime) * 0.001;

        if (!dragging) rotY += AUTO_ROT;

        ctx.clearRect(0, 0, W, H);

        /* Update physics + project */
        var pts = [];
        for (var i = 0; i < N; i++) {
            var a = atoms[i];

            /* Drift: organic breathing */
            var driftY = a.driftAmp * Math.sin(t * a.driftSpeed + a.driftPhase);
            var driftX = (a.driftAmp * 0.4) * Math.cos(t * a.driftSpeed * 0.7 + a.driftPhase + 1.2);

            /* Spring toward rest + drift */
            a.vx += (a.ox + driftX - a.x) * SPRING_K;
            a.vy += (a.oy + driftY - a.y) * SPRING_K;
            a.vz += (a.oz          - a.z) * SPRING_K;

            /* Damping */
            a.vx *= DAMPING;
            a.vy *= DAMPING;
            a.vz *= DAMPING;

            /* Integrate */
            a.x += a.vx;
            a.y += a.vy;
            a.z += a.vz;

            /* Project to screen */
            var r3 = rotate(a.x, a.y, a.z, rotX, rotY);
            var p2 = project(r3[0], r3[1], r3[2]);
            var sx = p2[0], sy = p2[1], sc = p2[2];

            /* Mouse repulsion (screen space) */
            if (hovering) {
                var dx = sx - mouseX;
                var dy = sy - mouseY;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < REPEL_R && d > 0.5) {
                    var strength = Math.pow((REPEL_R - d) / REPEL_R, 1.6) * REPEL_F;
                    /* Push in screen space; feed into world-space vx/vy (good enough approx) */
                    a.vx += (dx / d) * strength;
                    a.vy += (dy / d) * strength;
                }
            }

            pts.push({ sx: sx, sy: sy, sc: sc, rz: r3[2], a: a });
        }

        /* Back-to-front sort (painter's algorithm) */
        pts.sort(function (a, b) { return a.rz - b.rz; });

        /* ── Draw bonds ── */
        for (var i = 0; i < pts.length; i++) {
            for (var j = i + 1; j < pts.length; j++) {
                var A = pts[i], B = pts[j];
                var dx = A.sx - B.sx;
                var dy = A.sy - B.sy;
                var d  = Math.sqrt(dx * dx + dy * dy);
                if (d < CONN_DIST) {
                    var alpha = (1 - d / CONN_DIST) * 0.28 * Math.min(A.sc, B.sc) * 2.4;
                    ctx.beginPath();
                    ctx.moveTo(A.sx, A.sy);
                    ctx.lineTo(B.sx, B.sy);
                    ctx.strokeStyle = 'rgba(100,100,100,' + alpha.toFixed(3) + ')';
                    ctx.lineWidth   = 0.7;
                    ctx.stroke();
                }
            }
        }

        /* ── Draw atoms ── */
        for (var k = 0; k < pts.length; k++) {
            var p  = pts[k];
            var a  = p.a;
            var sx = p.sx, sy = p.sy, sc = p.sc;

            var coreR    = a.size * sc * 1.6;
            var depth    = 0.35 + 0.65 * sc;   /* 0..1, closer = darker */

            /* Solid node — no glow, just a crisp dot */
            var gray = Math.round(30 + (1 - depth) * 90);   /* darker up front, lighter far back */
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(coreR, 0.8), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + gray + ',' + gray + ',' + gray + ',' + depth.toFixed(3) + ')';
            ctx.fill();
        }
    }

    /* ── Mouse / touch events ── */
    canvas.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseX   = e.clientX - rect.left;
        mouseY   = e.clientY - rect.top;
        hovering = true;
        if (dragging) {
            rotY += (e.clientX - lastMX) * 0.006;
            rotX += (e.clientY - lastMY) * 0.006;
            lastMX = e.clientX;
            lastMY = e.clientY;
        }
    });

    canvas.addEventListener('mouseleave', function () {
        hovering = false;
        dragging = false;
        mouseX   = -9999;
        mouseY   = -9999;
    });

    canvas.addEventListener('mousedown', function (e) {
        dragging = true;
        lastMX   = e.clientX;
        lastMY   = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mouseup', function () {
        if (dragging) {
            dragging = false;
            canvas.style.cursor = 'grab';
        }
    });

    /* Touch */
    canvas.addEventListener('touchstart', function (e) {
        if (e.touches.length === 1) {
            dragging = true;
            lastMX   = e.touches[0].clientX;
            lastMY   = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (e.touches.length === 1 && dragging) {
            rotY   += (e.touches[0].clientX - lastMX) * 0.006;
            rotX   += (e.touches[0].clientY - lastMY) * 0.006;
            lastMX  = e.touches[0].clientX;
            lastMY  = e.touches[0].clientY;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', function () { dragging = false; });

    /* ── Init ── */
    canvas.style.cursor = 'grab';
    resize();
    window.addEventListener('resize', function () { resize(); });
    buildAtoms();
    requestAnimationFrame(frame);
})();
