// Глобальное состояние
let poems = [];
let selectedId = null;

// DOM-элементы
const listEl = document.getElementById("poem-list");
const detailEl = document.getElementById("detail");
const addBtn = document.getElementById("add-poem");

// Загрузка данных
async function loadData() {
  const db = await window.api.loadDB();
  poems = db.data || [];
  console.log("poems", poems);
  renderList();
}

// Отрисовка списка
function renderList() {
  listEl.innerHTML = "";
  poems.forEach((poem, index) => {
    const li = document.createElement("li");
    li.textContent = poem.name || "(без названия)";
    li.dataset.id = poem.id;
    if (poem.id === selectedId) li.classList.add("active");
    li.addEventListener("click", () => selectPoem(poem.id));
    listEl.appendChild(li);
  });
}

// Выбор стиха
function selectPoem(id) {
  selectedId = id;
  renderList();
  const poem = poems.find((p) => p.id === id);
  if (poem) {
    renderDetail(poem);
  }
}

// Отрисовка формы редактирования справа
function renderDetail(poem) {
  const tagsHtml = poem.tags
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  detailEl.innerHTML = `
    <h2>Редактирование: ${escapeHtml(poem.name)}</h2>
    <label>Название</label>
    <input type="text" id="edit-name" value="${escapeHtml(poem.name)}">
    
    <label>Тип</label>
    <input type="text" id="edit-type" value="${escapeHtml(poem.type)}">
    
    <label>Дата создания</label>
    <input type="text" id="edit-timeCreate" value="${escapeHtml(poem.timeOfCreate || "")}">
    
    <label>Дата публикации</label>
    <input type="text" id="edit-timePub" value="${escapeHtml(poem.timeOfPublication || "")}">
    
    <label>Ключевой размер</label>
    <input type="number" id="edit-keySize" value="${poem.keySize || 0}">
    
    <label>Теги (через запятую)</label>
    <input type="text" id="edit-tags" value="${poem.tags.join(", ")}">
    <div id="tags-display">${tagsHtml}</div>
    
    <label>Обзор</label>
    <textarea id="edit-overview">${escapeHtml(poem.overview || "")}</textarea>
    
    <label>Аннотация</label>
    <textarea id="edit-annotation">${escapeHtml(poem.annotation || "")}</textarea>
    
    <label>Редактор</label>
    <input type="text" id="edit-redacted" value="${escapeHtml(poem.redacted || "")}">
    
    <div class="actions">
      <button id="save-poem">💾 Сохранить</button>
      <button id="delete-poem" style="background:#e74c3c; color:white;">🗑 Удалить</button>
      <button id="cancel-edit">❌ Отменить</button>
    </div>
  `;

  detailEl.offsetHeight;

  // Привязка событий
  document
    .getElementById("save-poem")
    .addEventListener("click", () => saveCurrentPoem(poem));
  document
    .getElementById("delete-poem")
    .addEventListener("click", () => deletePoem(poem.id));
  document.getElementById("cancel-edit").addEventListener("click", () => {
    selectedId = null;
    renderList();
    detailEl.innerHTML = "<p>Выберите стих слева</p>";
  });
  // Живое обновление тегов при вводе
  document.getElementById("edit-tags").addEventListener("input", function (e) {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    document.getElementById("tags-display").innerHTML = tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");
  });

  // Гарантируем, что поля редактируемы
  detailEl.querySelectorAll("input, textarea").forEach((el) => {
    el.disabled = false;
    el.readOnly = false;
  });

  requestAnimationFrame(() => {
    // пустой колбэк, просто чтобы произошёл кадр
  });
}

// Сохранение изменений
async function saveCurrentPoem(originalPoem) {
  const updated = { ...originalPoem }; // поверхностное копирование, затем переопределим поля

  updated.name = document.getElementById("edit-name").value.trim();
  updated.type = document.getElementById("edit-type").value.trim();
  updated.timeOfCreate = document
    .getElementById("edit-timeCreate")
    .value.trim();
  updated.timeOfPublication = document
    .getElementById("edit-timePub")
    .value.trim();
  updated.keySize =
    parseInt(document.getElementById("edit-keySize").value) || 0;
  updated.tags = document
    .getElementById("edit-tags")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  updated.overview = document.getElementById("edit-overview").value;
  updated.annotation = document.getElementById("edit-annotation").value;
  updated.redacted = document.getElementById("edit-redacted").value.trim();

  // Найти индекс и заменить
  const index = poems.findIndex((p) => p.id === originalPoem.id);
  if (index !== -1) {
    poems[index] = updated;
    await saveToFile();
    renderList();
    // перепоказать детали той же записи
    selectedId = updated.id;
    renderDetail(updated);
  }
}

// Удаление стиха
async function deletePoem(id) {
  const confirmed = await showConfirm("Удалить этот стих навсегда?");
  if (!confirmed) return;

  poems = poems.filter((p) => p.id !== id);
  await saveToFile();
  selectedId = null;
  renderList();
  detailEl.innerHTML = "<p>Выберите стих слева</p>";
}

// Добавление нового стиха
async function addNewPoem() {
  const newPoem = {
    id: "poetry_new_" + Date.now(),
    name: "Новое стихотворение",
    type: "poetry",
    timeOfCreate: new Date().toLocaleDateString("ru-RU"),
    timeOfPublication: "",
    keySize: 0,
    tags: [],
    base: "/pages/poetry/",
    img: "",
    text: "text.txt",
    illustration: "",
    sound: "",
    overview: "",
    annotation: "",
    redacted: "",
  };
  poems.push(newPoem);
  await saveToFile();
  renderList();
  selectPoem(newPoem.id);
}

// Сохранение всего массива в файл
async function saveToFile() {
  const db = { meta: {}, data: poems };
  try {
    const result = await window.api.saveData(db);
    if (!result.success) {
      alert("Ошибка сохранения: " + result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(err);
    alert("Критическая ошибка при сохранении: " + err.message);
    return false;
  }
}

// Вспомогательная функция экранирования HTML
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-overlay");
    const msgEl = document.getElementById("modal-message");
    const okBtn = document.getElementById("modal-ok");
    const cancelBtn = document.getElementById("modal-cancel");

    msgEl.textContent = message;
    overlay.style.display = "flex";

    function cleanup() {
      overlay.style.display = "none";
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    }

    function onOk() {
      cleanup();
      resolve(true);
    }
    function onCancel() {
      cleanup();
      resolve(false);
    }

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// Инициализация
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  addBtn.addEventListener("click", addNewPoem);
});
