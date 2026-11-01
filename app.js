const cursor = document.querySelector(".cursor");
const follower = document.querySelector(".cursor-follower");
const loginModal = document.getElementById("loginModal");
const authMessage = document.getElementById("auth-message");
const logoutButton = document.getElementById("logout-btn");
const AUTH_STORAGE_KEY = "odishaVirtualTourUser";
const protectedPageElements = document.querySelectorAll("header, nav, .container, footer");

function setPageInert(isInert) {
    protectedPageElements.forEach((element) => {
        element.inert = isInert;
    });
}

function focusLoginInput() {
    if (window.innerHeight > 700) {
        document.getElementById("login-username").focus();
    }
}

let mouseX = 0;
let mouseY = 0;
let followerX = 0;
let followerY = 0;

document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
});

function animateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;
    requestAnimationFrame(animateFollower);
}
animateFollower();

document.addEventListener("click", (event) => {
    createFireParticles(event.clientX, event.clientY);
});

function createFireParticles(x, y) {
    for (let i = 0; i < 15; i += 1) {
        const particle = document.createElement("div");
        particle.className = "fire-particle";

        const colors = ["#ff9933", "#ff6600", "#ff0000", "#ffcc00"];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];

        const angle = (Math.PI * 2 * i) / 15;
        const velocity = 2 + Math.random() * 3;
        const offsetX = Math.cos(angle) * velocity * 10;
        const offsetY = Math.sin(angle) * velocity * 10;

        particle.style.left = `${x + offsetX}px`;
        particle.style.top = `${y + offsetY}px`;

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

function setAuthView(view) {
    const views = {
        login: {
            heading: "Welcome to Odisha",
            subheading: "Sign in to begin your journey",
            tab: "login"
        },
        signup: {
            heading: "Create your account",
            subheading: "Join us to explore Odisha",
            tab: "signup"
        },
        forgot: {
            heading: "Forgot your password?",
            subheading: "Get help getting back into your account",
            tab: null
        }
    };
    const selectedView = views[view];

    document.querySelectorAll(".auth-view").forEach((form) => {
        form.classList.toggle("active", form.id === `${view}-form`);
    });
    document.querySelectorAll(".auth-tab").forEach((tab) => {
        const isActive = tab.id === `show-${selectedView.tab}-btn`;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });
    document.getElementById("auth-heading").textContent = selectedView.heading;
    document.getElementById("auth-subheading").textContent = selectedView.subheading;
    authMessage.textContent = "";
    authMessage.classList.remove("success", "error");
}

function enterMainPage(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        name: user.name,
        email: user.email
    }));
    loginModal.classList.remove("active");
    document.body.style.overflow = "auto";
    logoutButton.hidden = false;
    setPageInert(false);
}

function restoreLogin() {
    const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedUser) {
        loginModal.classList.add("active");
        document.body.style.overflow = "hidden";
        logoutButton.hidden = true;
        setPageInert(true);
        focusLoginInput();
        return;
    }

    let user;
    try {
        user = JSON.parse(savedUser);
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        loginModal.classList.add("active");
        document.body.style.overflow = "hidden";
        logoutButton.hidden = true;
        setPageInert(true);
        focusLoginInput();
        return;
    }

    if (typeof user.name !== "string" || typeof user.email !== "string") {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        loginModal.classList.add("active");
        document.body.style.overflow = "hidden";
        logoutButton.hidden = true;
        setPageInert(true);
        document.getElementById("login-username").focus();
        return;
    }

    loginModal.classList.remove("active");
    document.body.style.overflow = "auto";
    logoutButton.hidden = false;
    setPageInert(false);
}

function setAuthMessage(message, type) {
    authMessage.textContent = message;
    authMessage.classList.remove("success", "error");
    authMessage.classList.add(type);
}

async function sendAuthRequest(path, payload) {
    const response = await fetch(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong. Please try again.");
    }

    return data;
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const result = await sendAuthRequest("/api/login", { username, password });
        enterMainPage(result.user);
        event.target.reset();
    } catch (error) {
        setAuthMessage(error.message, "error");
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    try {
        await sendAuthRequest("/api/signup", { name, email, password });
        event.target.reset();
        setAuthView("login");
        setAuthMessage("Account created. Please log in to continue.", "success");
    } catch (error) {
        setAuthMessage(error.message, "error");
    }
}

function handleForgotPassword(event) {
    event.preventDefault();
    setAuthMessage("Automatic password reset is not available yet. Please contact the site administrator for help.", "error");
}

function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    loginModal.classList.add("active");
    document.body.style.overflow = "hidden";
    logoutButton.hidden = true;
    setPageInert(true);
    setAuthView("login");
    focusLoginInput();
}

function showDestination(destinationId) {
    document.querySelectorAll(".destination").forEach((destination) => {
        destination.classList.remove("active");
    });

    const activeDestination = document.getElementById(destinationId);
    if (activeDestination) {
        activeDestination.classList.add("active");
    }

    document.querySelectorAll(".nav-btn").forEach((button) => {
        const isActive = button.dataset.destination === destinationId;
        button.classList.toggle("active", isActive);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
    document.querySelectorAll(".info-card").forEach((card) => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < window.innerHeight - 100) {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        }
    });
});

document.querySelectorAll(".info-card").forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "all 0.6s ease";
});

document.getElementById("show-login-btn").addEventListener("click", () => setAuthView("login"));
document.getElementById("show-signup-btn").addEventListener("click", () => setAuthView("signup"));
document.getElementById("show-forgot-btn").addEventListener("click", () => setAuthView("forgot"));
document.getElementById("back-to-login-btn").addEventListener("click", () => setAuthView("login"));
document.getElementById("back-from-forgot-btn").addEventListener("click", () => setAuthView("login"));
document.getElementById("login-form").addEventListener("submit", handleLogin);
document.getElementById("signup-form").addEventListener("submit", handleSignup);
document.getElementById("forgot-form").addEventListener("submit", handleForgotPassword);
logoutButton.addEventListener("click", handleLogout);
restoreLogin();

document.querySelectorAll(".nav-btn, .dest-preview").forEach((element) => {
    element.addEventListener("click", () => {
        const destinationId = element.dataset.destination;
        if (destinationId) {
            showDestination(destinationId);
        }
    });
});
