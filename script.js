
const STORAGE_KEY = "objectif85-pwa-v1";

const meals = [
  { name: "PETIT-DÉJEUNER", icon: "breakfast.svg", color: "#ffbf19", text: "3 œufs\nFlocons d’avoine\nBanane\nThé" },
  { name: "DÉJEUNER", icon: "lunch.svg", color: "#63c75d", text: "Poulet grillé\nRiz complet\nLégumes" },
  { name: "COLLATION", icon: "snack.svg", color: "#43a8f5", text: "Fromage blanc\nSkyr\nAmandes" },
  { name: "DÎNER", icon: "dinner.svg", color: "#a36ce5", text: "Saumon\nLégumes" }
];

const workouts = [
  { name: "DÉVELOPPÉ COUCHÉ", detail: "4 × 10 à 10 kg", icon: "bench.svg" },
  { name: "ROWING HALTÈRES", detail: "4 × 10 à 10 kg", icon: "rowing.svg" },
  { name: "DÉVELOPPÉ ÉPAULES", detail: "3 × 12 à 8 kg", icon: "shoulders.svg" },
  { name: "CURL BICEPS", detail: "3 × 12 à 6 kg", icon: "biceps.svg" },
  { name: "EXTENSION TRICEPS", detail: "3 × 12 à 6 kg", icon: "triceps.svg" },
  { name: "GAINAGE", detail: "3 × 1 min", icon: "plank.svg" }
];

const trackingFields = [
  { key: "weight", label: "Poids (kg)", icon: "weight.svg", step: "0.1" },
  { key: "waist", label: "Tour de taille (cm)", icon: "waist.svg", step: "0.1" },
  { key: "steps", label: "Pas du jour", icon: "steps.svg", step: "1" },
  { key: "water", label: "Eau bue (L)", icon: "water.svg", step: "0.1" },
  { key: "protein", label: "Protéines (g)", icon: "protein.svg", step: "1" },
  { key: "sleep", label: "Sommeil (h)", icon: "sleep.svg", step: "0.25" }
];

let selectedDate = new Date();
let modalField = null;

function dateKey(date = selectedDate) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function loadState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getDayData(key = dateKey()) {
  const state = loadState();
  return state[key] || {
    meals: {},
    workouts: {},
    weight: 93,
    waist: 97,
    steps: 0,
    water: 0,
    protein: 0,
    sleep: 0,
    notes: ""
  };
}

function setDayData(data, key = dateKey()) {
  const state = loadState();
  state[key] = data;
  saveState(state);
}

function renderHeader() {
  document.getElementById("dayTitle").textContent = selectedDate
    .toLocaleDateString("fr-FR", { weekday: "long" }).toUpperCase();
  document.getElementById("dateTitle").textContent = selectedDate
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long" }).toUpperCase();
}

function getWeekDays(date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function renderWeek() {
  const strip = document.getElementById("weekStrip");
  strip.innerHTML = "";
  getWeekDays(selectedDate).forEach(day => {
    const button = document.createElement("button");
    button.className = "day-card";
    if (dateKey(day) === dateKey(selectedDate)) button.classList.add("active");
    const status = getCompletionStatus(day);
    button.innerHTML = `
      <span>${day.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "").toUpperCase()}</span>
      <strong>${day.getDate()}</strong>
      <i style="background:${status}"></i>
    `;
    button.addEventListener("click", () => {
      selectedDate = day;
      renderAll();
    });
    strip.appendChild(button);
  });
}

function getCompletionStatus(day) {
  const data = getDayData(dateKey(day));
  const done = Object.values(data.meals || {}).filter(Boolean).length +
               Object.values(data.workouts || {}).filter(Boolean).length;
  if (done === 0) return "#7f8996";
  if (done >= meals.length + workouts.length + 1) return "#4caf50";
  return "#ff8a1f";
}

function renderMeals() {
  const data = getDayData();
  const grid = document.getElementById("mealGrid");
  grid.innerHTML = "";
  meals.forEach((meal, index) => {
    const card = document.createElement("article");
    card.className = "meal-card";
    card.innerHTML = `
      <img src="assets/${meal.icon}" alt="" />
      <h3 style="color:${meal.color}">${meal.name}</h3>
      <p>${meal.text.replaceAll("\n", "<br>")}</p>
      <button class="check ${data.meals[index] ? "done" : ""}" aria-label="Valider ${meal.name}">
        ${data.meals[index] ? "✓" : ""}
      </button>
    `;
    card.querySelector(".check").addEventListener("click", () => {
      const fresh = getDayData();
      fresh.meals[index] = !fresh.meals[index];
      setDayData(fresh);
      renderAll();
    });
    grid.appendChild(card);
  });
}

function renderSport() {
  const data = getDayData();
  const list = document.getElementById("sportList");
  const stepsPct = Math.min(100, Math.round((Number(data.steps || 0) / 10000) * 100));
  list.innerHTML = `
    <div class="walk-card">
      <div class="walk-main">
        <img src="assets/walk.svg" alt="" />
        <div>
          <div class="walk-meta">
            <div>
              <h3>MARCHE</h3>
              <p>Objectif : 10 000 pas</p>
            </div>
            <div class="walk-value">${Number(data.steps || 0).toLocaleString("fr-FR")} / 10 000</div>
          </div>
        </div>
        <button class="check ${data.workouts.walk ? "done" : ""}" id="walkCheck">${data.workouts.walk ? "✓" : ""}</button>
      </div>
      <div class="walk-progress"><span style="width:${stepsPct}%"></span></div>
    </div>
  `;

  document.getElementById("walkCheck").addEventListener("click", () => {
    const fresh = getDayData();
    fresh.workouts.walk = !fresh.workouts.walk;
    setDayData(fresh);
    renderAll();
  });

  workouts.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "exercise-row";
    row.innerHTML = `
      <img src="assets/${item.icon}" alt="" />
      <div>
        <h3>${item.name}</h3>
        <p>${item.detail}</p>
      </div>
      <button class="check ${data.workouts[index] ? "done" : ""}" aria-label="Valider ${item.name}">
        ${data.workouts[index] ? "✓" : ""}
      </button>
    `;
    row.querySelector(".check").addEventListener("click", () => {
      const fresh = getDayData();
      fresh.workouts[index] = !fresh.workouts[index];
      setDayData(fresh);
      renderAll();
    });
    list.appendChild(row);
  });
}

function renderStats() {
  const d = getDayData();
  document.getElementById("weightValue").textContent = `${d.weight || 0} kg`;
  document.getElementById("waistValue").textContent = `${d.waist || 0} cm`;
  document.getElementById("waterValue").textContent = `${d.water || 0} / 2 L`;
  document.getElementById("proteinValue").textContent = `${d.protein || 0} / 150 g`;
  document.getElementById("sleepValue").textContent = `${d.sleep || 0} h`;
  document.getElementById("notesInput").value = d.notes || "";
}

function openModal(field) {
  const labels = {
    weight: ["Poids", "Poids en kg"],
    waist: ["Tour de taille", "Tour de taille en cm"],
    water: ["Eau", "Litres bus"],
    protein: ["Protéines", "Protéines consommées en grammes"],
    sleep: ["Sommeil", "Durée de sommeil en heures"]
  };
  modalField = field;
  const d = getDayData();
  document.getElementById("modalTitle").textContent = labels[field][0];
  document.getElementById("modalLabel").textContent = labels[field][1];
  document.getElementById("modalInput").value = d[field] || "";
  document.getElementById("dataModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("dataModal").classList.add("hidden");
}

function renderTrackingForm() {
  const data = getDayData();
  const form = document.getElementById("trackingForm");
  form.innerHTML = "";
  trackingFields.forEach(field => {
    const row = document.createElement("label");
    row.className = "track-field";
    row.innerHTML = `
      <img src="assets/${field.icon}" alt="" />
      <span>${field.label}</span>
      <input data-key="${field.key}" type="number" step="${field.step}" value="${data[field.key] || ""}" />
    `;
    form.appendChild(row);
  });
}

function saveTracking() {
  const data = getDayData();
  document.querySelectorAll("#trackingForm input").forEach(input => {
    data[input.dataset.key] = Number(input.value || 0);
  });
  setDayData(data);
  renderAll();
  renderCharts();
}

function getHistory() {
  const state = loadState();
  return Object.entries(state)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
}

function drawLineChart(svgId, values, color) {
  const svg = document.getElementById(svgId);
  svg.innerHTML = "";
  const width = 360, height = 160, pad = 24;
  const vals = values.length ? values : [0];
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  for (let i = 0; i < 4; i++) {
    const y = pad + i * ((height - pad * 2) / 3);
    svg.insertAdjacentHTML("beforeend",
      `<line x1="${pad}" y1="${y}" x2="${width-pad}" y2="${y}" stroke="#26303a" stroke-width="1"/>`);
  }

  const points = vals.map((v, i) => {
    const x = vals.length === 1 ? width / 2 : pad + i * ((width - pad * 2) / (vals.length - 1));
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });

  if (points.length > 1) {
    svg.insertAdjacentHTML("beforeend",
      `<polyline fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="${points.map(p => p.join(",")).join(" ")}"/>`);
  }

  points.forEach(([x, y]) => {
    svg.insertAdjacentHTML("beforeend",
      `<circle cx="${x}" cy="${y}" r="5" fill="#10161c" stroke="${color}" stroke-width="3"/>`);
  });
}

function renderCharts() {
  const history = getHistory();
  const weights = history.filter(x => x.weight).map(x => Number(x.weight));
  const waists = history.filter(x => x.waist).map(x => Number(x.waist));
  drawLineChart("weightChart", weights, "#e1b35e");
  drawLineChart("waistChart", waists, "#ff7a28");

  const weightDelta = weights.length > 1 ? weights.at(-1) - weights[0] : 0;
  const waistDelta = waists.length > 1 ? waists.at(-1) - waists[0] : 0;
  document.getElementById("weightDelta").textContent = `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`;
  document.getElementById("waistDelta").textContent = `${waistDelta > 0 ? "+" : ""}${waistDelta.toFixed(1)} cm`;

  const stepValues = history.filter(x => x.steps).map(x => Number(x.steps));
  const sleepValues = history.filter(x => x.sleep).map(x => Number(x.sleep));
  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  document.getElementById("avgSteps").textContent = Math.round(avg(stepValues)).toLocaleString("fr-FR");
  document.getElementById("avgSleep").textContent = `${avg(sleepValues).toFixed(1)} h`;
}

function renderAll() {
  renderHeader();
  renderWeek();
  renderMeals();
  renderSport();
  renderStats();
  renderTrackingForm();
  renderCharts();
}

document.querySelectorAll(".stat-card").forEach(button => {
  button.addEventListener("click", () => openModal(button.dataset.field));
});

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalSave").addEventListener("click", () => {
  const data = getDayData();
  data[modalField] = Number(document.getElementById("modalInput").value || 0);
  setDayData(data);
  closeModal();
  renderAll();
});

document.getElementById("notesInput").addEventListener("change", event => {
  const data = getDayData();
  data.notes = event.target.value;
  setDayData(data);
});

document.getElementById("trackingButton").addEventListener("click", () => {
  document.querySelector(".app-shell").classList.add("hidden");
  document.getElementById("trackingView").classList.remove("hidden");
  renderTrackingForm();
  renderCharts();
  window.scrollTo(0,0);
});

document.getElementById("backButton").addEventListener("click", () => {
  document.getElementById("trackingView").classList.add("hidden");
  document.querySelector(".app-shell").classList.remove("hidden");
  renderAll();
  window.scrollTo(0,0);
});

document.getElementById("saveTracking").addEventListener("click", saveTracking);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js"));
}

renderAll();
