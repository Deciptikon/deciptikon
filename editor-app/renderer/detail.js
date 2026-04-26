// renderer/detail.js – Детальный просмотр и редактирование стихотворения

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

    <!-- Текст стиха -->
    <label>Текст стиха</label>
    <textarea id="edit-text" style="height:200px;">${escapeHtml(textContent)}</textarea>
    <div style="margin-top:4px; font-size:0.9em; color:#555;">
      Размер: <span id="char-count">${countSymbols(textContent)}</span> символов
    </div>

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
        <td><input type="text" id="edit-img" value="${escapeHtml(poem.img)}" placeholder="image.png"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-img" ${poem.img ? "checked" : ""}></td>
      </tr>
      <tr>
        <td class="media-label">Иллюстрация</td>
        <td><input type="text" id="edit-illustration" value="${escapeHtml(poem.illustration)}" placeholder="illustration.png"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-illustration" ${poem.illustration ? "checked" : ""}></td>
      </tr>
      <tr>
        <td class="media-label">Звук</td>
        <td><input type="text" id="edit-sound" value="${escapeHtml(poem.sound)}" placeholder="sound.mp3"></td>
        <td style="text-align:center;"><input type="checkbox" id="has-sound" ${poem.sound ? "checked" : ""}></td>
      </tr>
    </table>

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
  charCountSpan.textContent = countSymbols(textarea.value); // начальное значение
  textarea.addEventListener("input", () => {
    charCountSpan.textContent = countSymbols(textarea.value);
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
