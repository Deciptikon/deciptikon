// renderer/data.js – Глобальные переменные и работа с хранилищем

// Глобальное состояние
let poems = [];
let selectedId = null;
const PREFIX = "poetry_";

// Базовый набор тегов для быстрого выбора
//const coreTags = ["мрачные", "проклятие", "страх", "меланхолия", "смерть"];

// DOM-элементы (задаются после загрузки страницы)
const listEl = document.getElementById("poem-list");
const detailEl = document.getElementById("detail");
const addBtn = document.getElementById("add-poem");

// Загрузка данных из БД
async function loadData() {
  const db = await window.api.loadDB();
  poems = db.data || [];
  renderList();
}

// Сохранение данных в БД
async function saveToFile() {
  const db = { meta: {}, data: poems };
  const result = await window.api.saveData(db);
  if (!result.success) {
    alert("Ошибка сохранения: " + result.error);
    return false;
  }
  return true;
}
