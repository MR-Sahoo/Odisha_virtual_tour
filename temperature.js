const placeInput = document.getElementById("place-search-input");
const searchBtn = document.getElementById("search-temp-btn");
const resultBox = document.getElementById("temperature-result");

async function fetchPlaceTemperature() {
    const place = placeInput.value.trim().toLowerCase();
    if (!place) {
        resultBox.textContent = "Please enter a place name.";
        return;
    }

    resultBox.textContent = "Loading...";

    try {
        const response = await fetch(`/api/weather/${place}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to fetch weather.");
        }

        const weather = data.place;
        resultBox.innerHTML = `
            <h3>${weather.label}</h3>
            <p><strong>Temperature:</strong> ${weather.temperature}°C</p>
            <p><strong>Wind Speed:</strong> ${weather.windSpeed} km/h</p>
            <p><strong>Updated:</strong> ${new Date(weather.time).toLocaleString()}</p>
        `;
    } catch (error) {
        resultBox.textContent = error.message;
    }
}

searchBtn.addEventListener("click", fetchPlaceTemperature);
placeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        fetchPlaceTemperature();
    }
});
