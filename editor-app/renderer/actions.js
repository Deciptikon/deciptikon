// renderer/actions.js – Бизнес-логика: сохранение, удаление, добавление стиха

/**
 * Сохраняет изменения текущего стихотворения.
 * @param {object} originalPoem – исходный объект стихотворения до редактирования
 */
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
    const newPath = (originalPoem.base + newId).replace(/^\//, "");
    const res = await window.api.renameFolder(oldPath, newPath);
    if (!res.success) {
      alert("Не удалось переименовать папку: " + res.error);
      return;
    }
  }

  // Формируем обновлённый объект
  const updated = { ...originalPoem };
  updated.id = newId;
  updated.name = document.getElementById("edit-name").value.trim();
  // Тип не меняем, оставляем как было
  updated.timeOfCreate = formatDate(
    document.getElementById("edit-timeCreate").value,
  );
  updated.timeOfPublication = formatDate(
    document.getElementById("edit-timePub").value,
  );
  updated.keySize =
    parseInt(document.getElementById("char-count").textContent) || 0;
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

  // Обновляем массив
  const index = poems.findIndex((p) => p.id === oldId);
  if (index !== -1) poems[index] = updated;
  else poems.push(updated);

  await saveToFile();
  renderList();
  selectedId = updated.id;
  selectPoem(updated.id);
}

/**
 * Удаляет стихотворение по ID (с подтверждением и удалением папки).
 * @param {string} id – идентификатор стихотворения
 */
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

/**
 * Создаёт новое стихотворение с шаблонными данными и папкой.
 */
async function addNewPoem() {
  const newPoem = {
    id: PREFIX + Date.now(),
    name: "Новое стихотворение",
    type: "poetry",
    timeOfCreate: "",
    timeOfPublication: "",
    keySize: 0,
    tags: ["мрачные", "страх", "меланхолия", "смерть"],
    base: "/pages/poetry/",
    img: "",
    text: "text.txt",
    illustration: "",
    sound: "",
    overview: "",
    annotation: "",
    redacted: "Коваленко М.Е.",
  };

  const folderPath = getFolderPath(newPoem);
  await window.api.createFolder(folderPath);

  poems.push(newPoem);
  await saveToFile();
  renderList();
  selectPoem(newPoem.id);
}
