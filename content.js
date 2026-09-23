console.log("AI Form Assistant Loaded");

// ====================================
// GRADIENT BORDER OVERLAY
// ====================================

let gradientOverlay = null;
let borderResizeHandler = null;

function updateGradientBorderDimensions() {
    const inner = document.getElementById("ai-mask-inner-rect");
    if (!inner) return;

    const sbWidth = window.innerWidth - document.documentElement.clientWidth;
    const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
    );
    const hasScrollbar =
        sbWidth > 0 ||
        scrollHeight > window.innerHeight;

    const topInset = 10;
    const bottomInset = 10;
    const leftInset = 10;
    const rightInset = hasScrollbar
        ? 10 + (sbWidth > 0 ? Math.round(sbWidth) : 10)
        : 10;

    const width = Math.max(0, window.innerWidth - leftInset - rightInset);
    const height = Math.max(0, window.innerHeight - topInset - bottomInset);

    inner.setAttribute("x", `${leftInset}`);
    inner.setAttribute("y", `${topInset}`);
    inner.setAttribute("width", `${width}`);
    inner.setAttribute("height", `${height}`);
}

function showGradientBorder() {

    // Remove existing if any
    hideGradientBorder();

    // Inject SVG Mask for boxy outer border and rounded inner cutout
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "ai-gradient-mask-svg";
    svg.setAttribute("style", "position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = `
        <defs>
            <mask id="ai-gradient-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect id="ai-mask-inner-rect" x="14" y="14" width="0" height="0" rx="20" ry="20" fill="black" />
            </mask>
        </defs>
    `;
    document.body.appendChild(svg);

    // Inject keyframes & overlay styles
    const style =
        document.createElement("style");

    style.id =
        "ai-form-gradient-style";

    style.textContent = `
        @keyframes ai-border-spin {
            0%   { --ai-angle: 0deg; }
            100% { --ai-angle: 360deg; }
        }

        @property --ai-angle {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
        }

        #ai-gradient-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 2147483647;
            pointer-events: none;
            box-sizing: border-box;
            background: conic-gradient(
                from var(--ai-angle),
                #ff6b6b,
                #feca57,
                #48dbfb,
                #ff9ff3,
                #54a0ff,
                #5f27cd,
                #ff6b6b
            );
            -webkit-mask: url(#ai-gradient-mask);
            mask: url(#ai-gradient-mask);
            animation: ai-border-spin 2s linear infinite;
        }

        #ai-gradient-overlay::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: inherit;
            -webkit-mask: url(#ai-gradient-mask);
            mask: url(#ai-gradient-mask);
            filter: blur(10px);
            opacity: 0.7;
            animation: ai-border-spin 2s linear infinite;
        }
    `;

    document.head.appendChild(style);

    // Create overlay div
    gradientOverlay =
        document.createElement("div");

    gradientOverlay.id =
        "ai-gradient-overlay";

    document.body.appendChild(
        gradientOverlay
    );

    // Dynamically adjust mask dimensions (handling window size & scrollbars)
    updateGradientBorderDimensions();
    borderResizeHandler = updateGradientBorderDimensions;
    window.addEventListener("resize", borderResizeHandler);

    // Show flow screen underneath gradient border
    showFlowScreen();

    console.log(
        "Gradient border shown"
    );

}

function hideGradientBorder() {

    if (borderResizeHandler) {
        window.removeEventListener("resize", borderResizeHandler);
        borderResizeHandler = null;
    }

    const overlay =
        document.getElementById(
            "ai-gradient-overlay"
        );

    if (overlay) {
        overlay.remove();
    }

    const svg =
        document.getElementById(
            "ai-gradient-mask-svg"
        );

    if (svg) {
        svg.remove();
    }

    const style =
        document.getElementById(
            "ai-form-gradient-style"
        );

    if (style) {
        style.remove();
    }

    gradientOverlay = null;

    // Hide flow screen alongside gradient border
    hideFlowScreen();

    console.log(
        "Gradient border hidden"
    );

}

// ====================================
// MESH GRADIENT FLOW SCREEN
// ====================================

let flowScreenCanvas = null;
let flowScreenContainer = null;
let flowScreenAnimId = null;
let flowScreenVideoFrameId = null;
let flowScreenScrollHandler = null;
let flowScreenResizeHandler = null;

function showFlowScreen() {
    hideFlowScreen();

    const blurLayer = document.createElement("div");
    blurLayer.id = "ai-flow-blur";
    blurLayer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483645;
        pointer-events: none;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    `;
    document.body.appendChild(blurLayer);

    flowScreenContainer = document.createElement("div");
    flowScreenContainer.id = "ai-flow-screen";
    flowScreenContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483646;
        pointer-events: none;
        opacity: 0.5;
    `;

    flowScreenCanvas = document.createElement("canvas");
    flowScreenCanvas.id = "ai-flow-canvas";
    flowScreenCanvas.style.cssText = `
        width: 100%;
        height: 100%;
        display: block;
    `;

    flowScreenContainer.appendChild(flowScreenCanvas);
    document.body.appendChild(flowScreenContainer);

    const video = document.createElement("video");
    video.id = "ai-flow-video-src";
    video.src = chrome.runtime.getURL("assets/Ai Loading.webm");
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.style.display = "none";
    document.body.appendChild(video);

    const videoCanvas = document.createElement("canvas");
    videoCanvas.id = "ai-flow-video";
    videoCanvas.width = 200;
    videoCanvas.height = 200;
    videoCanvas.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2147483646;
        pointer-events: none;
        width: 200px;
        height: 200px;
    `;
    document.body.appendChild(videoCanvas);

    const vCtx = videoCanvas.getContext("2d", { willReadFrequently: true });

    function renderVideoFrame() {
        if (video.readyState >= 2) {
            vCtx.drawImage(video, 0, 0, 200, 200);
            const imageData = vCtx.getImageData(0, 0, 200, 200);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                const brightness = (r + g + b) / 3;
                if (brightness > 220) {
                    data[i + 3] = 0;
                } else if (brightness > 180) {
                    data[i + 3] = Math.round(255 * (1 - (brightness - 180) / 40));
                }
            }
            vCtx.putImageData(imageData, 0, 0);
        }
        flowScreenVideoFrameId = requestAnimationFrame(renderVideoFrame);
    }
    video.addEventListener("playing", () => { renderVideoFrame(); });
    video.play().catch(() => {});

    const dpr = window.devicePixelRatio || 1;
    flowScreenCanvas.width = window.innerWidth * dpr;
    flowScreenCanvas.height = window.innerHeight * dpr;

    const ctx = flowScreenCanvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const colors = [
        { color: "#FF5772", enabled: true },
        { color: "#4CB4BB", enabled: true },
        { color: "#FFC600", enabled: true },
        { color: "#8B6AE6", enabled: true },
        { color: "#2E0EC7", enabled: true },
        { color: "#FF9A9E", enabled: true },
    ];

    const speed = 7;
    const horizontalPressure = 3;
    const verticalPressure = 4;
    const waveFrequencyX = 3;
    const waveFrequencyY = 4;
    const waveAmplitude = 6;

    const blobs = colors.map((c, i) => {
        const angle = (i / colors.length) * Math.PI * 2;
        return {
            color: c.color,
            x: 0.3 + 0.4 * Math.cos(angle),
            y: 0.3 + 0.4 * Math.sin(angle),
            vx: (Math.random() - 0.5) * 0.002 * speed,
            vy: (Math.random() - 0.5) * 0.002 * speed,
            radius: 0.25 + Math.random() * 0.15,
            phase: Math.random() * Math.PI * 2,
        };
    });

    let scrollY = 0;
    flowScreenScrollHandler = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", flowScreenScrollHandler, { passive: true });

    flowScreenResizeHandler = () => {
        const d = window.devicePixelRatio || 1;
        flowScreenCanvas.width = window.innerWidth * d;
        flowScreenCanvas.height = window.innerHeight * d;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(d, d);
    };
    window.addEventListener("resize", flowScreenResizeHandler);

    let startTime = performance.now();

    function animate() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const elapsed = (performance.now() - startTime) / 1000;

        ctx.clearRect(0, 0, w, h);

        const scrollOffset = scrollY * 0.001;

        blobs.forEach((blob) => {
            const waveX = Math.sin(elapsed * waveFrequencyX * 0.3 + blob.phase) * waveAmplitude * 0.01;
            const waveY = Math.cos(elapsed * waveFrequencyY * 0.3 + blob.phase * 1.3) * waveAmplitude * 0.01;

            blob.x += blob.vx + waveX * 0.01;
            blob.y += blob.vy + waveY * 0.01 + scrollOffset * 0.001;

            if (blob.x < -0.1) blob.vx = Math.abs(blob.vx) * 0.8 + 0.001;
            if (blob.x > 1.1) blob.vx = -Math.abs(blob.vx) * 0.8 - 0.001;
            if (blob.y < -0.1) blob.vy = Math.abs(blob.vy) * 0.8 + 0.001;
            if (blob.y > 1.1) blob.vy = -Math.abs(blob.vy) * 0.8 - 0.001;

            blob.vx *= 0.999;
            blob.vy *= 0.999;

            const cx = blob.x * w;
            const cy = blob.y * h;
            const r = blob.radius * Math.max(w, h);

            const stretchX = 1 + horizontalPressure * 0.1;
            const stretchY = 1 + verticalPressure * 0.1;

            const rgb = hexToRgb(blob.color);
            const gradient = ctx.createRadialGradient(
                cx, cy, 0,
                cx, cy, r
            );
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
            gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(stretchX, stretchY);
            ctx.translate(-cx, -cy);
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - r * stretchX, cy - r * stretchY, r * 2 * stretchX, r * 2 * stretchY);
            ctx.restore();
        });

        flowScreenAnimId = requestAnimationFrame(animate);
    }

    animate();
    console.log("Flow screen shown");
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
}

function hideFlowScreen() {
    if (flowScreenAnimId) {
        cancelAnimationFrame(flowScreenAnimId);
        flowScreenAnimId = null;
    }

    if (flowScreenVideoFrameId) {
        cancelAnimationFrame(flowScreenVideoFrameId);
        flowScreenVideoFrameId = null;
    }

    if (flowScreenScrollHandler) {
        window.removeEventListener("scroll", flowScreenScrollHandler);
        flowScreenScrollHandler = null;
    }

    if (flowScreenResizeHandler) {
        window.removeEventListener("resize", flowScreenResizeHandler);
        flowScreenResizeHandler = null;
    }

    const container = document.getElementById("ai-flow-screen");
    if (container) container.remove();

    const blur = document.getElementById("ai-flow-blur");
    if (blur) blur.remove();

    const videoCanvas = document.getElementById("ai-flow-video");
    if (videoCanvas) videoCanvas.remove();

    const videoSrc = document.getElementById("ai-flow-video-src");
    if (videoSrc) {
        videoSrc.pause();
        videoSrc.remove();
    }

    flowScreenCanvas = null;
    flowScreenContainer = null;
    console.log("Flow screen hidden");
}

// ====================================
// MESSAGE LISTENER
// ====================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.action === "fillForm") {

            const questions =
                detectQuestions();

            testAI(questions)
                .then(() => {

                    sendResponse({
                        done: true
                    });

                })
                .catch((err) => {

                    console.error(
                        "Fill failed:",
                        err
                    );

                    sendResponse({
                        done: false,
                        error: err.message
                    });

                });

            return true;
        }

    }
);

// ====================================
// DETECT QUESTIONS
// ====================================

function detectQuestions() {

    const questionBlocks =
        document.querySelectorAll(
            '[role="listitem"]'
        );

    const parsedQuestions = [];

    questionBlocks.forEach(
        (block, index) => {

            const titleEl =
                block.querySelector(
                    '[role="heading"]'
                );

            const questionText =
                titleEl
                    ? titleEl.innerText.trim()
                    : block.innerText
                        .split("\n")[0]
                        .trim();

            let type = "unknown";
            let options = [];

            // =========================
            // MULTIPLE CHOICE GRID
            // =========================

            if (
                block.querySelectorAll(
                    '[role="radiogroup"]'
                ).length > 1
            ) {

                type =
                    "multiple_choice_grid";

                options =
                    extractGridData(
                        block,
                        "radio"
                    );
            }

            // =========================
            // CHECKBOX GRID
            // =========================

            else if (
                block.querySelectorAll(
                    '[role="group"]'
                ).length > 1 ||
                (
                    block.querySelectorAll(
                        '[role="checkbox"]'
                    ).length > 4 &&
                    block.querySelectorAll(
                        '[role="rowheader"], [data-row-key]'
                    ).length > 0
                )
            ) {

                type =
                    "checkbox_grid";

                options =
                    extractGridData(
                        block,
                        "checkbox"
                    );
            }

            // =========================
            // LINEAR SCALE
            // =========================

            else if (
                block.querySelector(
                    '[role="radiogroup"]'
                ) &&
                isLinearScale(block)
            ) {

                type =
                    "linear_scale";

                options =
                    extractRadioOptions(
                        block
                    );
            }

            // =========================
            // MULTIPLE CHOICE
            // =========================

            else if (
                block.querySelector(
                    '[role="radio"]'
                )
            ) {

                type =
                    "multiple_choice";

                options =
                    extractRadioOptions(
                        block
                    );
            }

            // =========================
            // CHECKBOX
            // =========================

            else if (
                block.querySelector(
                    '[role="checkbox"]'
                )
            ) {

                type =
                    "checkbox";

                options =
                    extractCheckboxOptions(
                        block
                    );
            }

            // =========================
            // DROPDOWN
            // =========================

            else if (
                block.querySelector(
                    '[role="listbox"]'
                ) ||
                block.querySelector(
                    'select'
                )
            ) {

                type =
                    "dropdown";

                options =
                    extractDropdownOptions(
                        block
                    );
            }

            // =========================
            // DATE
            // =========================

            else if (
                block.querySelector(
                    'input[type="date"]'
                )
            ) {

                type = "date";
            }

            // =========================
            // TIME
            // =========================

            else if (
                block.querySelector(
                    '[aria-label*="Hour"]'
                )
            ) {

                type = "time";
            }

            // =========================
            // PARAGRAPH
            // =========================

            else if (
                block.querySelector(
                    'textarea'
                )
            ) {

                type =
                    "paragraph";
            }

            // =========================
            // SHORT ANSWER (Text, Email, Number, Tel, URL)
            // =========================

            else if (
                block.querySelector(
                    'input[type="text"], input[type="email"], input[type="number"], input[type="tel"], input[type="url"], input:not([type])'
                )
            ) {

                type =
                    "short_answer";
            }

            // =========================
            // FILE UPLOAD
            // =========================

            else if (
                block.querySelector(
                    'input[type="file"]'
                )
            ) {

                type =
                    "file_upload";
            }

            parsedQuestions.push({

                index:
                    index + 1,

                question:
                    questionText,

                type:
                    type,

                options:
                    options,

                // IMPORTANT
                element:
                    block

            });

        });

    // Check if there is an email input outside of [role="listitem"]
    // (very common in Google Forms when "Collect email addresses" is enabled)
    const standaloneEmail = document.querySelector(
        'input[type="email"], input[name="emailAddress"], input[autocomplete="email"], input[aria-label*="email" i]'
    );

    if (standaloneEmail) {

        const isCovered =
            parsedQuestions.some(
                (q) =>
                    q.element &&
                    (q.element === standaloneEmail ||
                        q.element.contains(standaloneEmail))
            );

        if (!isCovered) {

            const container =
                standaloneEmail.closest('[role="listitem"]') ||
                standaloneEmail.closest('form > div') ||
                standaloneEmail.parentElement;

            parsedQuestions.unshift({
                index: 0,
                question: "Email Address",
                type: "short_answer",
                options: [],
                element: container || standaloneEmail
            });

        }

    }

    // Re-index all questions cleanly (1, 2, 3...)
    parsedQuestions.forEach((q, i) => {
        q.index = i + 1;
    });

    console.log(
        "PARSED QUESTIONS:",
        parsedQuestions
    );

    return parsedQuestions;
}

// ====================================
// AI TEST
// ====================================

async function testAI(questions) {

    // Show gradient border
    // while API is working
    showGradientBorder();

    try {

        // Load profile
        const profile =
            typeof loadProfile === "function"
                ? await loadProfile()
                : null;

        // Strip DOM elements before
        // sending to Gemini
        const cleanQuestions =
            questions.map((q) => ({
                index: q.index,
                question: q.question,
                type: q.type,
                options: q.options
            }));

        const answers =
            await askGemini(
                cleanQuestions
            );

        console.log(
            "===================="
        );

        console.log(
            "FINAL AI ANSWERS:"
        );

        console.log(
            answers
        );

        if (Array.isArray(answers)) {

            answers.forEach(
                (item, index) => {

                    console.log(
                        `\n[${index + 1}]`
                    );

                    console.log(
                        "QUESTION:",
                        item.question
                    );

                    console.log(
                        "ANSWER:",
                        item.answer
                    );

                });

            // =========================
            // AUTOFILL
            // =========================

            autofillAnswers(
                answers,
                questions,
                profile
            );

        }

    }

    catch (error) {

        console.error(
            "Gemini Error:",
            error
        );

    }

    finally {

        // Hide gradient border
        // when done (success or fail)
        hideGradientBorder();

    }

}

// ====================================
// AUTOFILL ENGINE
// ====================================

function matchProfileToOptions(profileVal, options) {
    if (!profileVal || !options || options.length === 0) return null;
    const p = String(profileVal).toLowerCase().trim();

    // 1. Exact match
    const exact = options.find((o) => o.toLowerCase().trim() === p);
    if (exact) return exact;

    // 2. Bidirectional contains (e.g. "3rd year" contains "3rd")
    const contains = options.find((o) => {
        const opt = o.toLowerCase().trim();
        return p.includes(opt) || opt.includes(p);
    });
    if (contains) return contains;

    // 3. Digit match (e.g. "3" in "3rd Year" matches "3" in "3rd")
    const pDigit = p.match(/\d+/)?.[0];
    if (pDigit) {
        const digitMatch = options.find((o) => o.match(/\d+/)?.[0] === pDigit);
        if (digitMatch) return digitMatch;
    }

    return null;
}

function resolveIdentityAnswer(profile, qText, currentAnswer, options) {
    if (!profile) return currentAnswer;

    let targetProfileVal = null;

    if (/e[- ]?mail/i.test(qText)) {
        targetProfileVal = profile.email;
    } else if (/\b(roll\s*(no|number)?|registration\s*(no|number)?|reg\s*no)\b/i.test(qText)) {
        targetProfileVal = profile.roll_number || profile.registration_number;
    } else if (/\b(full\s*name|student\s*name|your\s*name|^name)\b/i.test(qText)) {
        targetProfileVal = profile.name;
    } else if (/\b(section)\b/i.test(qText)) {
        targetProfileVal = profile.section;
    } else if (/\b(phone|mobile|contact)\b/i.test(qText)) {
        targetProfileVal = profile.phone;
    } else if (/\b(department|branch)\b/i.test(qText)) {
        targetProfileVal = profile.branch;
    } else if (/\b(semester|sem)\b/i.test(qText)) {
        targetProfileVal = profile.semester;
    } else if (/\b(current\s*year|^year)\b/i.test(qText) && !/\b(year\s*range)\b/i.test(qText)) {
        targetProfileVal = profile.current_year;
    }

    if (!targetProfileVal) return currentAnswer;

    // If this question has specific options (MCQ, dropdown, etc.)
    if (Array.isArray(options) && options.length > 0) {
        // If Gemini already picked one of the valid options, keep it!
        const curMatches = options.some(
            (o) => o.toLowerCase().trim() === String(currentAnswer).toLowerCase().trim()
        );
        if (curMatches && currentAnswer) {
            return currentAnswer;
        }

        // Otherwise resolve profile value to closest option (e.g. "3rd Year" -> "3rd")
        const matched = matchProfileToOptions(targetProfileVal, options);
        if (matched) {
            return matched;
        }
    }

    return targetProfileVal || currentAnswer;
}

function autofillAnswers(
    answers,
    questions,
    profile
) {

    answers.forEach((item, i) => {

        // Match by index (reliable)
        // Fall back to question text
        const matchedQuestion =
            questions.find(
                (q) =>
                    q.index === item.index
            ) ||
            questions.find(
                (q) =>
                    q.question.trim() ===
                    item.question?.trim()
            ) ||
            questions[i];

        if (!matchedQuestion)
            return;

        const block =
            matchedQuestion.element;

        if (!block)
            return;

        let answer =
            item.answer !== undefined && item.answer !== null
                ? item.answer
                : "";

        const qText =
            (matchedQuestion.question || "").toLowerCase();

        // Resolve identity answer smartly (won't clobber valid MCQ options like "3rd" with "3rd Year")
        answer = resolveIdentityAnswer(
            profile,
            qText,
            answer,
            matchedQuestion.options
        );

        const answerStr =
            typeof answer === "object"
                ? ""
                : String(answer);

        const type =
            matchedQuestion.type;

        // =====================
        // MULTIPLE CHOICE
        // =====================

        if (
            type === "multiple_choice"
        ) {

            clickRadio(block, answerStr);

        }

        // =====================
        // LINEAR SCALE
        // =====================

        else if (
            type === "linear_scale"
        ) {

            clickRadio(block, answerStr);

        }

        // =====================
        // CHECKBOX
        // =====================

        else if (
            type === "checkbox"
        ) {

            const selections =
                Array.isArray(item.answer)
                    ? item.answer
                    : answerStr
                        .split(",")
                        .map((s) => s.trim());

            const checkboxes =
                block.querySelectorAll(
                    '[role="checkbox"]'
                );

            checkboxes.forEach((cb) => {

                const val =
                    (cb.getAttribute("data-answer-value") || "").toLowerCase().trim();

                const aria =
                    (cb.getAttribute("aria-label") || "").toLowerCase().trim();

                const text =
                    (cb.innerText || "").toLowerCase().trim();

                const shouldCheck =
                    selections.some((s) => {
                        const target = s.toLowerCase().trim();
                        return (
                            val === target ||
                            aria === target ||
                            text === target ||
                            (text && text.includes(target))
                        );
                    });

                if (shouldCheck) {

                    cb.click();

                    console.log(
                        "Checked:",
                        text || aria || val
                    );

                }

            });

        }

        // =====================
        // DROPDOWN
        // =====================

        else if (
            type === "dropdown"
        ) {

            // Native select fallback
            const nativeSelect =
                block.querySelector("select");

            if (nativeSelect) {

                for (let opt of nativeSelect.options) {

                    if (
                        opt.text.toLowerCase().trim() === answerStr.toLowerCase().trim() ||
                        opt.value.toLowerCase().trim() === answerStr.toLowerCase().trim()
                    ) {

                        nativeSelect.value = opt.value;

                        nativeSelect.dispatchEvent(
                            new Event("change", { bubbles: true })
                        );

                        break;

                    }

                }

            }

            // Google custom listbox
            const trigger =
                block.querySelector(
                    '[role="listbox"]'
                );

            if (trigger) {

                trigger.click();

                setTimeout(() => {

                    const options =
                        document.querySelectorAll(
                            '[role="option"]'
                        );

                    options.forEach((opt) => {

                        const optText =
                            opt.innerText.trim().toLowerCase();

                        const optVal =
                            (opt.getAttribute("data-value") || "").toLowerCase().trim();

                        if (
                            optText === answerStr.toLowerCase() ||
                            optVal === answerStr.toLowerCase()
                        ) {

                            opt.click();

                            console.log(
                                "Dropdown selected:",
                                answerStr
                            );

                        }

                    });

                }, 300);

            }

        }

        // =====================
        // SHORT ANSWER
        // =====================

        else if (
            type === "short_answer"
        ) {

            fillTextInput(
                block,
                'input[type="text"], input[type="email"], input[type="number"], input[type="tel"], input[type="url"], input:not([type])',
                answerStr
            );

        }

        // =====================
        // PARAGRAPH
        // =====================

        else if (
            type === "paragraph"
        ) {

            fillTextInput(
                block,
                "textarea",
                answerStr
            );

        }

        // =====================
        // MULTIPLE CHOICE GRID
        // =====================

        else if (
            type === "multiple_choice_grid"
        ) {

            fillGrid(block, item, "radio");

        }

        // =====================
        // CHECKBOX GRID
        // =====================

        else if (
            type === "checkbox_grid"
        ) {

            fillGrid(block, item, "checkbox");

        }

        // =====================
        // DATE
        // =====================

        else if (
            type === "date"
        ) {

            const dateInput =
                block.querySelector(
                    'input[type="date"]'
                );

            if (dateInput) {

                fillSingleInput(dateInput, answerStr);

            }

        }

        // =====================
        // TIME
        // =====================

        else if (
            type === "time"
        ) {

            const hourInput =
                block.querySelector(
                    '[aria-label*="Hour"]'
                );

            const minuteInput =
                block.querySelector(
                    '[aria-label*="Minute"]'
                );

            const parts =
                answerStr.split(":");

            if (hourInput && parts[0]) {

                fillSingleInput(hourInput, parts[0]);

            }

            if (minuteInput && parts[1]) {

                fillSingleInput(minuteInput, parts[1]);

            }

        }

        console.log(
            `[${matchedQuestion.index}]`,
            type,
            "→",
            answer
        );

    });

    // ====================================
    // GUARANTEED EMAIL & PERSONAL SAFETY PASS
    // ====================================
    if (profile && profile.email) {

        // 1. Any input on the page explicitly designated for email
        const pageEmailInputs =
            document.querySelectorAll(
                'input[type="email"], input[name="emailAddress"], input[autocomplete="email"], input[aria-label*="email" i], input[aria-label*="Email"]'
            );

        pageEmailInputs.forEach((inp) => {

            if (!inp.value || inp.value.trim() === "") {

                console.log(
                    "Safety pass: auto-filling email input with:",
                    profile.email
                );

                fillSingleInput(inp, profile.email);

            }

        });

        // 2. Any question block whose heading or text mentions "email"
        document.querySelectorAll('[role="listitem"]').forEach((block) => {

            const heading =
                block.querySelector('[role="heading"]')?.innerText ||
                block.innerText.split("\n")[0] ||
                "";

            if (/e[- ]?mail/i.test(heading)) {

                const textInp =
                    block.querySelector('input[type="text"], input[type="email"], input:not([type])');

                if (textInp && (!textInp.value || textInp.value.trim() === "")) {

                    console.log(
                        "Safety pass: auto-filling email question block with:",
                        profile.email
                    );

                    fillSingleInput(textInp, profile.email);

                }

            }

        });

    }

}

// ====================================
// AUTOFILL HELPERS
// ====================================

function fillSingleInput(input, answer) {

    if (!input) return;

    try {

        input.focus();

        const proto =
            input instanceof HTMLTextAreaElement
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;

        const setter =
            Object.getOwnPropertyDescriptor(proto, "value")?.set;

        if (setter) {

            setter.call(input, answer);

        } else {

            input.value = answer;

        }

        input.dispatchEvent(
            new Event("input", { bubbles: true, composed: true })
        );

        input.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
        );

        input.blur();

    } catch (e) {

        console.warn(
            "fillSingleInput fallback:",
            e
        );

        input.value = answer;

    }

}

function fillTextInput(
    block,
    selector,
    answer
) {

    const input =
        (block.matches && block.matches(selector))
            ? block
            : block.querySelector(selector);

    if (input) {

        fillSingleInput(input, answer);

    }

}

function triggerClick(element) {

    if (!element) return;

    try {

        element.scrollIntoView?.({ block: "nearest", inline: "nearest" });

        element.focus?.();

        element.click();

        const container =
            element.closest('.docssharedWizToggleLabeledContainer, [role="listitem"] label, .nWQGrd, label');

        if (container && container !== element) {

            container.click();

        }

        ['mousedown', 'mouseup', 'click'].forEach((type) => {

            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            }));

        });

    } catch (e) {

        console.warn("triggerClick fallback:", e);

        element.click?.();

    }

}

function clickRadio(block, answer) {

    const target =
        String(answer).toLowerCase().trim();

    if (!target) return;

    const radios =
        block.querySelectorAll(
            '[role="radio"]'
        );

    if (radios.length === 0) return;

    let clicked = false;

    const getRadioCandidates = (radio) => {

        const val =
            (radio.getAttribute("data-value") || "").toLowerCase().trim();

        const aria =
            (radio.getAttribute("aria-label") || "").toLowerCase().trim();

        const text =
            (radio.innerText || "").toLowerCase().trim();

        const container =
            radio.closest('label, [role="listitem"] div, .docssharedWizToggleLabeledContainer, .nWQGrd');

        const containerText =
            (container?.innerText || "").toLowerCase().trim();

        return [val, aria, text, containerText].filter(Boolean);

    };

    // 1. Exact match
    radios.forEach((radio) => {

        if (clicked) return;

        const candidates =
            getRadioCandidates(radio);

        if (candidates.some((c) => c === target)) {

            triggerClick(radio);

            clicked = true;

            console.log("Radio exact clicked:", target);

        }

    });

    // 2. Bidirectional substring match (e.g. target "3rd Year" vs option "3rd")
    if (!clicked) {

        radios.forEach((radio) => {

            if (clicked) return;

            const candidates =
                getRadioCandidates(radio);

            const matches =
                candidates.some((c) => {

                    return (
                        c.includes(target) ||
                        target.includes(c) ||
                        c.startsWith(target + ",") ||
                        c.endsWith("," + target)
                    );

                });

            if (matches) {

                triggerClick(radio);

                clicked = true;

                console.log("Radio substring clicked:", target);

            }

        });

    }

    // 3. Digit match (e.g. digit 3 in "3rd Year" matches "3rd")
    if (!clicked) {

        const targetDigit =
            target.match(/\d+/)?.[0];

        if (targetDigit) {

            radios.forEach((radio) => {

                if (clicked) return;

                const candidates =
                    getRadioCandidates(radio);

                const matches =
                    candidates.some((c) => {

                        const cDigit =
                            c.match(/\d+/)?.[0];

                        return cDigit && cDigit === targetDigit;

                    });

                if (matches) {

                    triggerClick(radio);

                    clicked = true;

                    console.log("Radio digit clicked:", target, "digit:", targetDigit);

                }

            });

        }

    }

}

function isOptionMatch(element, desired) {

    if (!element || !desired) return false;

    const d =
        String(desired).toLowerCase().trim();

    const dataVal =
        (element.getAttribute("data-value") || "").toLowerCase().trim();

    const aria =
        (element.getAttribute("aria-label") || "").toLowerCase().trim();

    const text =
        (element.innerText || "").toLowerCase().trim();

    if (dataVal === d || aria === d || text === d)
        return true;

    // Google Forms grid compound aria-label: "Column Name, Row Name"
    if (aria) {

        const parts =
            aria.split(",").map((p) => p.trim());

        if (
            parts.some(
                (p) =>
                    p === d ||
                    p.startsWith(d) ||
                    d.startsWith(p) ||
                    p.includes(d) ||
                    d.includes(p)
            )
        ) {

            return true;

        }

    }

    // Digit match for scales/ratings
    const dDigit = d.match(/\d+/)?.[0];
    if (dDigit) {
        const aDigit = (aria || text || dataVal).match(/\d+/)?.[0];
        if (aDigit && aDigit === dDigit) return true;
    }

    return false;

}

function fillGrid(
    block,
    item,
    inputType
) {

    // item.answer can be an object: { "Row Label": "Column Value" }
    // or string fallback: "Very Important"
    let gridAnswers = {};

    if (typeof item.answer === "object" && item.answer !== null) {

        gridAnswers = item.answer;

    } else if (typeof item.answer === "string" && item.answer.trim()) {

        gridAnswers = { "__all__": item.answer.trim() };

    }

    console.log(
        "Grid answers to fill:",
        gridAnswers
    );

    const groupRole =
        inputType === "radio"
            ? "radiogroup"
            : "group";

    const groups =
        block.querySelectorAll(
            `[role="${groupRole}"]`
        );

    if (groups.length > 0) {

        groups.forEach((group) => {

            const rowText =
                group.getAttribute("aria-label")?.trim() ||
                group.querySelector('[role="rowheader"], div[dir="auto"]')?.innerText.trim() ||
                "";

            let desiredValue =
                gridAnswers[rowText] || gridAnswers["__all__"];

            if (!desiredValue) {

                const key =
                    Object.keys(gridAnswers).find((k) =>
                        rowText.toLowerCase().includes(k.toLowerCase()) ||
                        k.toLowerCase().includes(rowText.toLowerCase())
                    );

                if (key) {
                    desiredValue = gridAnswers[key];
                }

            }

            if (!desiredValue)
                return;

            const selector =
                inputType === "radio"
                    ? '[role="radio"]'
                    : '[role="checkbox"]';

            const inputs =
                group.querySelectorAll(selector);

            let filled = false;

            inputs.forEach((input) => {

                if (isOptionMatch(input, desiredValue)) {

                    triggerClick(input);

                    filled = true;

                    console.log(
                        "Grid filled:",
                        rowText,
                        "→",
                        desiredValue
                    );

                }

            });

            // Index-based fallback if attribute match didn't find the column
            if (!filled && inputs.length > 0) {

                inputs.forEach((input, colIdx) => {

                    if (filled) return;

                    if (String(desiredValue) === String(colIdx + 1)) {

                        triggerClick(input);

                        filled = true;

                        console.log("Grid filled by column index:", rowText, "→ col", colIdx + 1);

                    }

                });

            }

        });

        return;

    }

    // Fallback: table rows
    const rows =
        block.querySelectorAll('tr, [role="row"]');

    rows.forEach((row) => {

        const rowLabel =
            row.querySelector('td:first-child, [role="rowheader"]');

        if (!rowLabel) return;

        const rowText =
            rowLabel.innerText.trim();

        let desiredValue =
            gridAnswers[rowText] || gridAnswers["__all__"];

        if (!desiredValue) return;

        const selector =
            inputType === "radio"
                ? '[role="radio"]'
                : '[role="checkbox"]';

        const inputs =
            row.querySelectorAll(selector);

        inputs.forEach((input) => {

            if (isOptionMatch(input, desiredValue)) {

                triggerClick(input);

                console.log(
                    "Grid filled (table):",
                    rowText,
                    "→",
                    desiredValue
                );

            }

        });

    });

}

// ====================================
// HELPERS
// ====================================

function extractRadioOptions(block) {

    const radios =
        block.querySelectorAll(
            '[role="radio"]'
        );

    const options = [];

    radios.forEach((radio) => {

        const label =
            radio.getAttribute(
                "data-value"
            ) ||

            radio.getAttribute(
                "aria-label"
            ) ||

            radio.innerText.trim();

        if (
            label &&
            !options.includes(label)
        ) {

            options.push(label);

        }

    });

    return options;

}

function extractCheckboxOptions(block) {

    const checkboxes =
        block.querySelectorAll(
            '[role="checkbox"]'
        );

    const options = [];

    checkboxes.forEach((cb) => {

        const label =
            cb.getAttribute(
                "data-answer-value"
            ) ||

            cb.getAttribute(
                "aria-label"
            ) ||

            cb.innerText.trim();

        if (
            label &&
            !options.includes(label)
        ) {

            options.push(label);

        }

    });

    return options;

}

function extractDropdownOptions(block) {

    const dropdownItems =
        block.querySelectorAll(
            '[role="option"]'
        );

    const options = [];

    dropdownItems.forEach((item) => {

        const value =
            item.innerText.trim();

        if (
            value &&
            value !== "Choose"
        ) {

            options.push(value);

        }

    });

    return options;

}

function isLinearScale(block) {

    const radios =
        block.querySelectorAll(
            '[role="radio"]'
        );

    if (radios.length < 2)
        return false;

    let allNumeric = true;

    radios.forEach((radio) => {

        const label =
            radio.getAttribute(
                "data-value"
            ) ||

            radio.getAttribute(
                "aria-label"
            ) ||

            radio.innerText.trim();

        if (
            label &&
            isNaN(Number(label))
        ) {

            allNumeric = false;

        }

    });

    return allNumeric;

}

function extractGridData(
    block,
    inputType
) {

    const gridData = [];

    // Method 1: Use radiogroups/groups
    // (how Google Forms actually works)
    const groupRole =
        inputType === "radio"
            ? "radiogroup"
            : "group";

    const groups =
        block.querySelectorAll(
            `[role="${groupRole}"]`
        );

    if (groups.length > 0) {

        groups.forEach((group) => {

            const rowLabel =
                group.getAttribute(
                    "aria-label"
                )?.trim() || "";

            if (!rowLabel)
                return;

            const selector =
                inputType === "radio"
                    ? '[role="radio"]'
                    : '[role="checkbox"]';

            const inputs =
                group.querySelectorAll(
                    selector
                );

            const rowOptions = [];

            inputs.forEach((input) => {

                let val =
                    input.getAttribute("data-value") ||
                    input.getAttribute("aria-label") ||
                    input.innerText.trim();

                if (val) {

                    // If aria-label is compound like "Column, Row", extract column name
                    if (val.includes(",")) {

                        const parts =
                            val.split(",").map((p) => p.trim());

                        if (rowLabel && parts[0].toLowerCase() === rowLabel.toLowerCase()) {

                            val = parts[1];

                        } else {

                            val = parts[0];

                        }

                    }

                    if (val && !rowOptions.includes(val)) {

                        rowOptions.push(val);

                    }

                }

            });

            gridData.push({
                row: rowLabel,
                options: rowOptions
            });

        });

        console.log(
            "Grid data (radiogroup):",
            gridData
        );

        return gridData;

    }

    // Method 2: Fallback to table rows
    const rows =
        block.querySelectorAll(
            'tr, [role="row"]'
        );

    rows.forEach((row) => {

        const rowLabel =
            row.querySelector(
                'td:first-child, [role="rowheader"]'
            );

        if (!rowLabel)
            return;

        const selector =
            inputType === "radio"
                ? '[role="radio"]'
                : '[role="checkbox"]';

        const inputs =
            row.querySelectorAll(
                selector
            );

        const rowOptions = [];

        inputs.forEach((input) => {

            let val =
                input.getAttribute("data-value") ||
                input.getAttribute("aria-label") ||
                input.innerText.trim();

            if (val) {

                if (val.includes(",")) {

                    const parts =
                        val.split(",").map((p) => p.trim());

                    val = parts[0];

                }

                if (val && !rowOptions.includes(val)) {

                    rowOptions.push(val);

                }

            }

        });

        gridData.push({
            row:
                rowLabel.innerText.trim(),
            options:
                rowOptions
        });

    });

    console.log(
        "Grid data (table):",
        gridData
    );

    return gridData;

}