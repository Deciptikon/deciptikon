// renderer.js

// Глобальное состояние
let poems = [];
let selectedId = null;

// DOM-элементы
const listEl = document.getElementById("poem-list");
const detailEl = document.getElementById("detail");
const addBtn = document.getElementById("add-poem");

// ============================================================
// Вспомогательные функции
// ============================================================

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getFolderPath(poem) {
  const base = poem.base || "/pages/poetry/";
  return (base + poem.id).replace(/^\//, ""); // убираем ведущий слеш
}

// Кастомный модальный диалог подтверждения
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("modal-overlay");
    const msgEl = document.getElementById("modal-message");
    const okBtn = document.getElementById("modal-ok");
    const cancelBtn = document.getElementById("modal-cancel");

    msgEl.textContent = message;
    overlay.style.display = "flex"; // показываем оверлей (flex для центрирования)

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

// ============================================================
// Работа с данными
// ============================================================

async function loadData() {
  const db = await window.api.loadDB();
  poems = db.data || [];
  console.log("poems", poems);
  renderList();
}

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

// ============================================================
// Отображение списка и деталей
// ============================================================

function renderList() {
  listEl.innerHTML = "";
  poems.forEach((poem) => {
    const li = document.createElement("li");
    li.textContent = poem.name || "(без названия)";
    li.dataset.id = poem.id;
    if (poem.id === selectedId) li.classList.add("active");
    li.addEventListener("click", () => selectPoem(poem.id));
    listEl.appendChild(li);
  });
}

function selectPoem(id) {
  selectedId = id;
  renderList();
  const poem = poems.find((p) => p.id === id);
  if (!poem) {
    console.error("Стих не найден:", id);
    detailEl.innerHTML = "<p>Ошибка: стих не найден</p>";
    return;
  }
  renderDetail(poem);
}

function renderDetail(poem) {
  const tagsHtml = poem.tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  detailEl.innerHTML = `
    <h2>Редактирование: ${escapeHtml(poem.name)}</h2>
    
    <label>ID</label>
    <input type="text" id="edit-id" value="${escapeHtml(poem.id)}">
    
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

  // Принудительный reflow (на всякий случай, если будут артефакты)
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

  document.getElementById("edit-tags").addEventListener("input", function (e) {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    document.getElementById("tags-display").innerHTML = tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");
  });
}

// ============================================================
// Изменение, удаление, добавление
// ============================================================

async function saveCurrentPoem(originalPoem) {
  const newId = document.getElementById("edit-id").value.trim();
  const oldId = originalPoem.id;

  // Валидация
  if (!newId) {
    alert("ID не может быть пустым");
    return;
  }

  const duplicate = poems.find((p) => p.id === newId && p.id !== oldId);
  if (duplicate) {
    alert(`ID "${newId}" уже используется у стиха "${duplicate.name}"`);
    return;
  }

  // Переименование папки, если ID изменился
  if (newId !== oldId) {
    const oldPath = getFolderPath(originalPoem);
    const newPath = (originalPoem.base + newId).replace(/^\//, "");
    try {
      const res = await window.api.renameFolder(oldPath, newPath);
      if (!res.success) {
        alert("Не удалось переименовать папку: " + res.error);
        return;
      }
    } catch (e) {
      alert("Ошибка при переименовании папки: " + e.message);
      return;
    }
  }

  // Собираем обновлённый объект
  const updated = { ...originalPoem };
  updated.id = newId;
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

  // Замена в массиве
  const index = poems.findIndex((p) => p.id === oldId);
  if (index !== -1) poems[index] = updated;
  else poems.push(updated);

  const saved = await saveToFile();
  if (!saved) return;

  renderList();
  selectedId = newId;
  renderDetail(updated);
}

async function deletePoem(id) {
  const confirmed = await showConfirm(
    "Удалить стих и папку с файлами безвозвратно?",
  );
  if (!confirmed) return;

  const poem = poems.find((p) => p.id === id);
  if (poem) {
    const folderPath = getFolderPath(poem);
    try {
      await window.api.deleteFolder(folderPath);
    } catch (e) {
      console.error("Ошибка при удалении папки:", e);
    }
  }

  poems = poems.filter((p) => p.id !== id);
  await saveToFile();
  selectedId = null;
  renderList();
  detailEl.innerHTML = "<p>Выберите стих слева</p>";
}

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

  // Создаём папку
  const folderPath = getFolderPath(newPoem);
  const result = await window.api.createFolder(folderPath);
  if (!result.success) {
    console.warn("Папка не создана:", result.error);
    // не блокируем создание записи — вдруг папка уже есть
  }

  poems.push(newPoem);
  await saveToFile();
  renderList();
  selectPoem(newPoem.id);
}

// ============================================================
// Старт
// ============================================================
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  addBtn.addEventListener("click", addNewPoem);
});
