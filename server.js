const express = require("express");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const USERS_DB_PATH = path.join(ROOT_DIR, "data", "users.json");
const PLACE_COORDINATES = {
    bhubaneswar: { label: "Bhubaneswar", latitude: 20.2961, longitude: 85.8245 },
    puri: { label: "Puri", latitude: 19.8135, longitude: 85.8312 },
    konark: { label: "Konark", latitude: 19.8876, longitude: 86.0945 },
    sambalpur: { label: "Sambalpur", latitude: 21.4704, longitude: 83.9701 }
};

const PLACE_QUIZ = {
    bhubaneswar: [
        { id: "b1", question: "Bhubaneswar is popularly known as?", options: ["The Lake City", "The Temple City", "The Pink City", "The Steel City"], answerIndex: 1 },
        { id: "b2", question: "Which temple is one of the most famous in Bhubaneswar?", options: ["Lingaraja Temple", "Somnath Temple", "Meenakshi Temple", "Lotus Temple"], answerIndex: 0 },
        { id: "b3", question: "Bhubaneswar is the capital of which state?", options: ["Bihar", "Odisha", "Assam", "Jharkhand"], answerIndex: 1 },
        { id: "b4", question: "Dhauli near Bhubaneswar is linked to which emperor?", options: ["Akbar", "Ashoka", "Harsha", "Samudragupta"], answerIndex: 1 },
        { id: "b5", question: "Bhubaneswar forms the Golden Triangle with Puri and?", options: ["Cuttack", "Konark", "Sambalpur", "Rourkela"], answerIndex: 1 }
    ],
    puri: [
        { id: "p1", question: "Puri is famous for which temple?", options: ["Sun Temple", "Jagannath Temple", "Kamakhya Temple", "Kedarnath Temple"], answerIndex: 1 },
        { id: "p2", question: "Which festival makes Puri globally famous?", options: ["Holi", "Rath Yatra", "Onam", "Bihu"], answerIndex: 1 },
        { id: "p3", question: "Puri is located near which water body?", options: ["Arabian Sea", "Bay of Bengal", "Indian Ocean", "Red Sea"], answerIndex: 1 },
        { id: "p4", question: "Puri is one of the four sacred?", options: ["Jyotirlingas", "Dhams", "Peethas", "Mathas"], answerIndex: 1 },
        { id: "p5", question: "Which nearby place is known as an artist village near Puri?", options: ["Raghurajpur", "Majuli", "Hampi", "Pushkar"], answerIndex: 0 }
    ],
    konark: [
        { id: "k1", question: "Konark is known for which UNESCO site?", options: ["Sun Temple", "Qutub Minar", "Ajanta Caves", "Red Fort"], answerIndex: 0 },
        { id: "k2", question: "The Konark temple is designed as a?", options: ["Ship", "Fort", "Chariot", "Palace"], answerIndex: 2 },
        { id: "k3", question: "The temple is dedicated to which deity?", options: ["Shiva", "Vishnu", "Sun God", "Ganesha"], answerIndex: 2 },
        { id: "k4", question: "Konark is close to which coastal city?", options: ["Puri", "Digha", "Goa", "Kochi"], answerIndex: 0 },
        { id: "k5", question: "The famous annual event in Konark is?", options: ["Dance Festival", "Tea Festival", "Boat Race", "Book Fair"], answerIndex: 0 }
    ],
    sambalpur: [
        { id: "s1", question: "Sambalpur is famous for which textile?", options: ["Banarasi", "Kanjeevaram", "Sambalpuri", "Chanderi"], answerIndex: 2 },
        { id: "s2", question: "Which major dam is near Sambalpur?", options: ["Bhakra", "Tehri", "Hirakud", "Nagarjuna Sagar"], answerIndex: 2 },
        { id: "s3", question: "Sambalpur lies on the banks of which river?", options: ["Godavari", "Mahanadi", "Ganga", "Yamuna"], answerIndex: 1 },
        { id: "s4", question: "Which festival is celebrated prominently in Sambalpur?", options: ["Nuakhai", "Pongal", "Lohri", "Baisakhi"], answerIndex: 0 },
        { id: "s5", question: "Sambalpur belongs to which part of Odisha?", options: ["North", "South", "Western", "Coastal only"], answerIndex: 2 }
    ]
};

app.use(express.json());
app.use(express.static(ROOT_DIR));

function normalizeUserName(value = "") {
    return value.trim().toLowerCase();
}

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

async function readUsers() {
    try {
        const rawData = await fs.readFile(USERS_DB_PATH, "utf-8");
        const parsed = JSON.parse(rawData);
        return Array.isArray(parsed.users) ? parsed.users : [];
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }
        throw error;
    }
}

async function writeUsers(users) {
    await fs.mkdir(path.dirname(USERS_DB_PATH), { recursive: true });
    await fs.writeFile(USERS_DB_PATH, JSON.stringify({ users }, null, 4), "utf-8");
}

app.post("/api/signup", async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const users = await readUsers();
    const normalizedEmail = normalizeUserName(email);
    const userExists = users.some((user) => user.email === normalizedEmail);

    if (userExists) {
        return res.status(409).json({ message: "Email already exists. Please login." });
    }

    const newUser = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalizedEmail,
        username: normalizeUserName(name),
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({
        message: "Account created successfully.",
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }
    });
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ message: "Username/email and password are required." });
    }

    const users = await readUsers();
    const normalizedInput = normalizeUserName(username);

    const matchedUser = users.find(
        (user) => user.email === normalizedInput || user.username === normalizedInput
    );

    if (!matchedUser) {
        return res.status(401).json({ message: "No account found. Please sign up first." });
    }

    if (matchedUser.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ message: "Incorrect password." });
    }

    return res.status(200).json({
        message: "Login successful.",
        user: {
            id: matchedUser.id,
            name: matchedUser.name,
            email: matchedUser.email
        }
    });
});

app.get("/api/places", (_req, res) => {
    const places = Object.entries(PLACE_COORDINATES).map(([key, value]) => ({
        id: key,
        label: value.label
    }));
    res.status(200).json({ places });
});

async function fetchWeatherForPlace(placeId) {
    const place = PLACE_COORDINATES[placeId];
    if (!place) {
        throw new Error("Invalid place.");
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,wind_speed_10m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (!response.ok || !data.current) {
        throw new Error("Unable to fetch weather data right now.");
    }

    return {
        id: placeId,
        label: place.label,
        temperature: data.current.temperature_2m,
        windSpeed: data.current.wind_speed_10m,
        time: data.current.time
    };
}

app.get("/api/weather", async (_req, res) => {
    try {
        const places = await Promise.all(
            Object.keys(PLACE_COORDINATES).map((placeId) => fetchWeatherForPlace(placeId))
        );
        res.status(200).json({ places });
    } catch (error) {
        res.status(500).json({ message: error.message || "Weather fetch failed." });
    }
});

app.get("/api/weather/:place", async (req, res) => {
    try {
        const placeWeather = await fetchWeatherForPlace(req.params.place);
        res.status(200).json({ place: placeWeather });
    } catch (error) {
        res.status(400).json({ message: error.message || "Invalid place." });
    }
});

app.get("/api/quiz/:place", (req, res) => {
    const place = req.params.place;
    const placeQuiz = PLACE_QUIZ[place];
    if (!placeQuiz) {
        return res.status(404).json({ message: "Quiz not found for this place." });
    }

    return res.status(200).json({
        quiz: {
            placeLabel: PLACE_COORDINATES[place]?.label || place,
            questions: placeQuiz.map((item) => ({
                id: item.id,
                question: item.question,
                options: item.options
            }))
        }
    });
});

app.post("/api/quiz/submit", (req, res) => {
    const { place, answers } = req.body || {};
    const placeQuiz = PLACE_QUIZ[place];

    if (!placeQuiz || !Array.isArray(answers)) {
        return res.status(400).json({ message: "Place and answers are required." });
    }

    const answerMap = new Map(answers.map((item) => [item.id, item.answerIndex]));
    let score = 0;
    for (const question of placeQuiz) {
        if (answerMap.get(question.id) === question.answerIndex) {
            score += 1;
        }
    }

    let resultMessage = "Good try! Keep exploring Odisha.";
    if (score === placeQuiz.length) {
        resultMessage = "Excellent! Perfect score.";
    } else if (score >= Math.ceil(placeQuiz.length * 0.7)) {
        resultMessage = "Great job! You know Odisha very well.";
    }

    return res.status(200).json({
        score,
        total: placeQuiz.length,
        resultMessage
    });
});

app.get("/", (_req, res) => {
    res.sendFile(path.join(ROOT_DIR, "odisha_virtual_tour (3).html"));
});

app.listen(PORT, () => {
    console.log(`Odisha Virtual Tour server running at http://localhost:${PORT}`);
});
