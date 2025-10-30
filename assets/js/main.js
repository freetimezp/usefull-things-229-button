const btn = document.querySelector(".btn");
const audio = document.getElementById("audio");

// ---- Audio setup ----
let ctx, analyser, dataArray, source;
btn.addEventListener("click", async () => {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        source = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audio.play();

        animateButton();
        drawHalo();
        drawSpace();
    } else {
        if (audio.paused) audio.play();
        else audio.pause();
    }
});

// ---- Button + Sparks ----
function animateButton() {
    const animate = () => {
        requestAnimationFrame(animate);
        if (!audio.paused) {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const scale = 1 + avg / 300;
            const glow = Math.min(avg * 2, 255);
            btn.style.transform = `scale(${scale})`;
            btn.style.boxShadow = `0 0 ${glow / 3}px rgba(0,191,255,0.8), inset 0 0 ${glow / 2}px rgba(0,191,255,0.6)`;
            btn.style.color = `rgb(${glow / 3}, ${glow}, 255)`;

            if (Math.random() < avg / 400) createSpark();
        }
    };
    animate();
}

function createSpark() {
    const spark = document.createElement("span");
    spark.classList.add("spark");
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 50;
    spark.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    spark.style.left = `calc(50% - 2px)`;
    spark.style.top = `calc(50% - 2px)`;
    btn.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
}

// ---- Halo Visualization ----
const halo = document.getElementById("halo");
const ctx2d = halo.getContext("2d");
halo.width = 400;
halo.height = 400;

function drawHalo() {
    const centerX = halo.width / 2;
    const centerY = halo.height / 2;
    const baseRadius = 130;
    let rotation = 0;

    function render() {
        requestAnimationFrame(render);
        if (!audio.paused) {
            analyser.getByteFrequencyData(dataArray);
            const bars = 128;
            ctx2d.clearRect(0, 0, halo.width, halo.height);

            ctx2d.save();
            ctx2d.translate(centerX, centerY);
            ctx2d.rotate(rotation);
            rotation += 0.005;

            for (let i = 0; i < bars; i++) {
                const angle = (i / bars) * Math.PI * 2;
                const value = dataArray[i];
                const radius = baseRadius + value * 0.5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const grad = ctx2d.createLinearGradient(0, 0, x, y);
                grad.addColorStop(0, `rgba(0,191,255,0.1)`);
                grad.addColorStop(1, `rgba(0,191,255,0.9)`);
                ctx2d.strokeStyle = grad;
                ctx2d.lineWidth = 2;
                ctx2d.beginPath();
                ctx2d.moveTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
                ctx2d.lineTo(x, y);
                ctx2d.stroke();
            }

            ctx2d.restore();
        }
    }
    render();
}

// ---- Background Space Particles ----
const space = document.getElementById("space");
const ctxSpace = space.getContext("2d");
space.width = innerWidth;
space.height = innerHeight;

let stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * space.width,
    y: Math.random() * space.height,
    r: Math.random() * 1.8 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.5 + 0.3,
}));

function drawSpace() {
    const draw = () => {
        requestAnimationFrame(draw);
        ctxSpace.clearRect(0, 0, space.width, space.height);
        analyser?.getByteFrequencyData(dataArray);
        const avg = dataArray ? dataArray.reduce((a, b) => a + b) / dataArray.length : 0;

        for (let s of stars) {
            s.x += s.dx;
            s.y += s.dy;
            if (s.x < 0) s.x = space.width;
            if (s.y < 0) s.y = space.height;
            if (s.x > space.width) s.x = 0;
            if (s.y > space.height) s.y = 0;

            const brightness = s.alpha + Math.sin(Date.now() / 1000 + s.x) * 0.2 + avg / 500;
            ctxSpace.beginPath();
            ctxSpace.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctxSpace.fillStyle = `rgba(0,191,255,${Math.min(1, brightness)})`;
            ctxSpace.shadowBlur = 10;
            ctxSpace.shadowColor = "#00bfff";
            ctxSpace.fill();
        }
    };
    draw();
}
