const placeSelect = document.getElementById("quiz-place-select");
const loadBtn = document.getElementById("load-quiz-btn");
const quizForm = document.getElementById("quiz-form");
const submitBtn = document.getElementById("submit-quiz-btn");
const resultBox = document.getElementById("quiz-result");

let currentQuestions = [];

function renderQuestions(questions) {
    quizForm.innerHTML = questions.map((q, idx) => {
        const options = q.options.map((option, optionIndex) => `
            <label class="quiz-option">
                <input type="radio" name="q-${idx}" value="${optionIndex}" required>
                ${option}
            </label>
        `).join("");

        return `
            <div class="quiz-q">
                <h4>${idx + 1}. ${q.question}</h4>
                ${options}
            </div>
        `;
    }).join("");
}

async function loadQuiz() {
    const place = placeSelect.value;
    resultBox.textContent = "Loading quiz...";
    submitBtn.style.display = "none";

    try {
        const response = await fetch(`/api/quiz/${place}`);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || "Unable to load quiz.");
        }

        currentQuestions = data.quiz.questions;
        renderQuestions(currentQuestions);
        resultBox.textContent = `Loaded ${currentQuestions.length} questions for ${data.quiz.placeLabel}.`;
        submitBtn.style.display = "inline-block";
    } catch (error) {
        resultBox.textContent = error.message;
        quizForm.innerHTML = "";
    }
}

async function submitQuiz() {
    if (currentQuestions.length === 0) {
        resultBox.textContent = "Load a quiz first.";
        return;
    }

    const answers = currentQuestions.map((question, idx) => {
        const selected = quizForm.querySelector(`input[name="q-${idx}"]:checked`);
        return {
            id: question.id,
            answerIndex: selected ? Number(selected.value) : -1
        };
    });

    if (answers.some((item) => item.answerIndex < 0)) {
        resultBox.textContent = "Please answer all questions.";
        return;
    }

    try {
        const response = await fetch("/api/quiz/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ place: placeSelect.value, answers })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to submit quiz.");
        }

        resultBox.innerHTML = `
            <h3>Your Score: ${data.score}/${data.total}</h3>
            <p>${data.resultMessage}</p>
        `;
    } catch (error) {
        resultBox.textContent = error.message;
    }
}

loadBtn.addEventListener("click", loadQuiz);
submitBtn.addEventListener("click", submitQuiz);
