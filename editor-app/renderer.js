// renderer.js – финальный редактор с префиксом ID, форматированием дат и подсчётом символов

let poems = [];
let selectedId = null;
const PREFIX = "poetry_"; // неизменяемая часть ID

const listEl = document.getElementById("poem-list");
const detailEl = document.getElementById("detail");
const addBtn = document.getElementById("add-poem");

// === Вспомогательные ===
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getFolderPath(poem) {
  const base = poem.base || "/pages/poetry/";
  return (base + poem.id).replace(/^\//, "");
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

// === Форматирование ===
function formatIdSuffix(input) {
  // Заменяем всё, что не буква/цифра/пробел/подчёркивание – игнорируем,
  // но здесь мы просто: пробелы в подчёркивания, убираем конечные пробелы/подчёркивания
  return input
    .replace(/\s+/g, "_") // пробелы и табуляции в подчёркивание
    .replace(/_{2,}/g, "_") // множественные подчёркивания в одно
    .replace(/^_+|_+$/g, "") // убрать подчёркивания в начале и конце
    .toLowerCase();
}

function formatDate(dateStr) {
  // Оставляем только цифры, точки и запятые
  let cleaned = dateStr.replace(/[^0-9.,]/g, "");
  // Заменяем запятые на точки
  cleaned = cleaned.replace(/,/g, ".");
  // Разбиваем по точке
  const parts = cleaned.split(".");
  if (parts.length === 3) {
    let [day, month, year] = parts;
    // Дополняем день и месяц нулями слева до двух цифр, если они есть
    day = day.padStart(2, "0").slice(0, 2);
    month = month.padStart(2, "0").slice(0, 2);
    // Год: если две цифры, добавляем '20'
    if (year.length === 2) {
      year = "20" + year;
    } else if (year.length === 4) {
      // оставляем как есть, но обрежем до 4
      year = year.slice(0, 4);
    }
    return `${day}.${month}.${year}`;
  }
  // Если формат не угадывается, возвращаем очищенную строку
  return cleaned;
}

// === Данные ===
async function loadData() {
  const db = await window.api.loadDB();
  poems = db.data || [];
  renderList();
}

async function saveToFile() {
  const db = { meta: {}, data: poems };
  const result = await window.api.saveData(db);
  if (!result.success) {
    alert("Ошибка сохранения: " + result.error);
    return false;
  }
  return true;
}

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

async function selectPoem(id) {
  selectedId = id;
  renderList();
  const poem = poems.find((p) => p.id === id);
  if (!poem) {
    detailEl.innerHTML = "<p>Ошибка: стих не найден</p>";
    return;
  }

  let textContent = "";
  if (poem.text) {
    const filePath = getFolderPath(poem) + "/" + poem.text;
    textContent = await window.api.readTextFile(filePath);
  }
  renderDetail(poem, textContent || "");
}

function renderDetail(poem, textContent) {
  // Извлекаем суффикс ID без префикса
  let idSuffix = poem.id;
  if (idSuffix.startsWith(PREFIX)) {
    idSuffix = idSuffix.slice(PREFIX.length);
  }
  // Если суффикс пуст, оставляем как есть (но так быть не должно)
  const tagsHtml = poem.tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");

  detailEl.innerHTML = `
    <h2>Редактирование: ${escapeHtml(poem.name)}</h2>

    <!-- ID с префиксом -->
    <label>ID</label>
    <div style="display:flex; align-items:center; gap:4px;">
      <span style="font-weight:bold; padding:6px 0;">${PREFIX}</span>
      <input type="text" id="edit-id-suffix" value="${escapeHtml(idSuffix)}" style="flex:1;">
    </div>

    <label>Название</label>
    <input type="text" id="edit-name" value="${escapeHtml(poem.name)}">

    <label>Дата создания</label>
    <input type="text" id="edit-timeCreate" value="${escapeHtml(poem.timeOfCreate || "")}" placeholder="ДД.ММ.ГГГГ">

    <label>Дата публикации</label>
    <input type="text" id="edit-timePub" value="${escapeHtml(poem.timeOfPublication || "")}" placeholder="ДД.ММ.ГГГГ">

    <label>Теги (через запятую)</label>
    <input type="text" id="edit-tags" value="${poem.tags.join(", ")}">
    <div id="tags-display">${tagsHtml}</div>

    <label>Обзор</label>
    <textarea id="edit-overview">${escapeHtml(poem.overview || "")}</textarea>

    <label>Аннотация</label>
    <textarea id="edit-annotation">${escapeHtml(poem.annotation || "")}</textarea>

    <label>Редактор</label>
    <input type="text" id="edit-redacted" value="${escapeHtml(poem.redacted || "")}">

    <!-- Медиафайлы -->
    <table class="media-table">
      <tr>
        <td class="media-label">Изображение</td>
        <td><input type="text" id="edit-img" value="${escapeHtml(poem.img || "image.png")}" placeholder="image.png"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-img" ${poem.img ? "checked" : ""}></td>
      </tr>
      <tr>
        <td class="media-label">Иллюстрация</td>
        <td><input type="text" id="edit-illustration" value="${escapeHtml(poem.illustration || "illustration.png")}" placeholder="illustration.png"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-illustration" ${poem.illustration ? "checked" : ""}></td>
      </tr>
      <tr>
        <td class="media-label">Звук</td>
        <td><input type="text" id="edit-sound" value="${escapeHtml(poem.sound || "sound.mp3")}" placeholder="sound.mp3"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-sound" ${poem.sound ? "checked" : ""}></td>
      </tr>
    </table>

    <!-- Текст стиха (перенесён выше) -->
    <label>Текст стиха</label>
    <textarea id="edit-text" style="height:200px;">${escapeHtml(textContent)}</textarea>
    <div style="margin-top:4px; font-size:0.9em; color:#555;">
      Ключ размера: <span id="char-count">${textContent.length}</span> символов
    </div>

    <div class="actions">
      <button id="save-poem">💾 Сохранить</button>
      <button id="delete-poem" style="background:#e74c3c; color:white;">🗑 Удалить</button>
      <button id="cancel-edit">❌ Отменить</button>
    </div>
  `;

  // Логика чекбоксов медиафайлов
  function setupMediaCheckbox(checkboxId, inputId) {
    const checkbox = document.getElementById(checkboxId);
    const input = document.getElementById(inputId);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (!input.value.trim()) {
          input.value = input.placeholder;
        }
      } else {
        input.value = "";
      }
    });
  }
  setupMediaCheckbox("has-img", "edit-img");
  setupMediaCheckbox("has-illustration", "edit-illustration");
  setupMediaCheckbox("has-sound", "edit-sound");

  // Теги (динамический показ)
  const tagsInput = document.getElementById("edit-tags");
  tagsInput.addEventListener("input", () => {
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    document.getElementById("tags-display").innerHTML = tags
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");
  });

  // ID: отложенное форматирование
  const idSuffixInput = document.getElementById("edit-id-suffix");
  let idTimer;
  idSuffixInput.addEventListener("input", () => {
    clearTimeout(idTimer);
    idTimer = setTimeout(() => {
      const cursorPos = idSuffixInput.selectionStart;
      const formatted = formatIdSuffix(idSuffixInput.value);
      idSuffixInput.value = formatted;
      // Восстанавливаем позицию курсора (не идеально, но приблизительно)
      const newPos = Math.min(cursorPos, formatted.length);
      idSuffixInput.setSelectionRange(newPos, newPos);
    }, 1000);
  });

  // Даты: отложенное форматирование
  function setupDateFormatter(inputId) {
    const input = document.getElementById(inputId);
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const cursorPos = input.selectionStart;
        const formatted = formatDate(input.value);
        input.value = formatted;
        const newPos = Math.min(cursorPos, formatted.length);
        input.setSelectionRange(newPos, newPos);
      }, 1000);
    });
  }
  setupDateFormatter("edit-timeCreate");
  setupDateFormatter("edit-timePub");

  // Подсчёт символов текста
  const textarea = document.getElementById("edit-text");
  const charCountSpan = document.getElementById("char-count");
  textarea.addEventListener("input", () => {
    charCountSpan.textContent = textarea.value.length;
  });

  // Кнопки действий
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
}

// === Сохранение ===
async function saveCurrentPoem(originalPoem) {
  // Собираем полный ID
  const idSuffix = document.getElementById("edit-id-suffix").value.trim();
  if (!idSuffix) {
    alert("Суффикс ID не может быть пустым");
    return;
  }
  const newId = PREFIX + formatIdSuffix(idSuffix);
  const oldId = originalPoem.id;

  // Проверка уникальности (исключая текущий)
  const duplicate = poems.find((p) => p.id === newId && p.id !== oldId);
  if (duplicate) {
    alert(`ID "${newId}" уже используется у стиха "${duplicate.name}"`);
    return;
  }

  // Переименование папки при смене ID
  if (newId !== oldId) {
    const oldPath = getFolderPath(originalPoem);
    const newFolderId = newId; // getFolderPath использует poem.base + poem.id, так что передадим обновлённый id
    const newPath = (originalPoem.base + newId).replace(/^\//, "");
    const res = await window.api.renameFolder(oldPath, newPath);
    if (!res.success) {
      alert("Не удалось переименовать папку: " + res.error);
      return;
    }
  }

  // Обновляем объект
  const updated = { ...originalPoem };
  updated.id = newId;
  updated.name = document.getElementById("edit-name").value.trim();
  // Тип не меняем (оставляем как было)
  updated.timeOfCreate = formatDate(
    document.getElementById("edit-timeCreate").value,
  );
  updated.timeOfPublication = formatDate(
    document.getElementById("edit-timePub").value,
  );
  updated.keySize = document.getElementById("edit-text").value.length; // авто
  updated.tags = document
    .getElementById("edit-tags")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  updated.overview = document.getElementById("edit-overview").value;
  updated.annotation = document.getElementById("edit-annotation").value;
  updated.redacted = document.getElementById("edit-redacted").value.trim();

  // Медиафайлы
  updated.img = document.getElementById("edit-img").value.trim();
  updated.illustration = document
    .getElementById("edit-illustration")
    .value.trim();
  updated.sound = document.getElementById("edit-sound").value.trim();

  // Сохраняем текст стиха в файл
  const textContent = document.getElementById("edit-text").value;
  const textFilePath =
    getFolderPath(updated) + "/" + (updated.text || "text.txt");
  await window.api.writeTextFile(textFilePath, textContent);

  const index = poems.findIndex((p) => p.id === oldId);
  if (index !== -1) poems[index] = updated;
  else poems.push(updated);

  await saveToFile();
  renderList();
  selectedId = updated.id;
  selectPoem(updated.id);
}

async function deletePoem(id) {
  const confirmed = await showConfirm(
    "Удалить этот стих и его папку безвозвратно?",
  );
  if (!confirmed) return;

  const poem = poems.find((p) => p.id === id);
  if (poem) {
    try {
      await window.api.deleteFolder(getFolderPath(poem));
    } catch (e) {
      console.error("Ошибка удаления папки:", e);
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
    id: PREFIX + Date.now(),
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

  const folderPath = getFolderPath(newPoem);
  await window.api.createFolder(folderPath);

  poems.push(newPoem);
  await saveToFile();
  renderList();
  selectPoem(newPoem.id);
}

// === Старт ===
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  addBtn.addEventListener("click", addNewPoem);
});
