// renderer/utils.js – Вспомогательные функции

/**
 * Экранирует спецсимволы HTML, чтобы безопасно вставлять текст в разметку.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Возвращает относительный путь папки стихотворения (без ведущего слеша).
 * @param {object} poem – объект стихотворения с полями base и id
 * @returns {string}
 */
function getFolderPath(poem) {
  const base = poem.base || "/pages/poetry/";
  return (base + poem.id).replace(/^\//, "");
}

/**
 * Показывает кастомное модальное окно подтверждения.
 * @param {string} message – текст сообщения
 * @returns {Promise<boolean>} true – подтверждено, false – отмена
 */
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

/**
 * Форматирует суффикс ID: пробелы → "_", нижний регистр,
 * удаляет подчёркивания в начале и конце, убирает дублирующиеся подчёркивания.
 * @param {string} input – введённый суффикс (без префикса poetry_)
 * @returns {string}
 */
function formatIdSuffix(input) {
  return input
    .replace(/\s+/g, "_") // пробельные символы в подчёркивание
    .replace(/_{2,}/g, "_") // несколько подчёркиваний подряд в одно
    .replace(/^_+|_+$/g, "") // убрать крайние подчёркивания
    .toLowerCase();
}

/**
 * Форматирует строку даты к виду ДД.ММ.ГГГГ.
 * Заменяет запятые на точки, дополняет день/месяц нулями,
 * добавляет "20" к году из двух цифр.
 * @param {string} dateStr – исходная строка даты
 * @returns {string}
 */
function formatDate(dateStr) {
  // Удаляем всё, кроме цифр, точек и запятых
  let cleaned = dateStr.replace(/[^0-9.,]/g, "");
  // Запятые на точки
  cleaned = cleaned.replace(/,/g, ".");

  const parts = cleaned.split(".");
  if (parts.length === 3) {
    let [day, month, year] = parts;

    // Дополняем день и месяц до двух цифр, обрезаем лишнее
    day = day.padStart(2, "0").slice(0, 2);
    month = month.padStart(2, "0").slice(0, 2);

    // Если год состоит из двух цифр, добавляем "20"
    if (year.length === 2) {
      year = "20" + year;
    } else if (year.length === 4) {
      year = year.slice(0, 4);
    }

    return `${day}.${month}.${year}`;
  }

  // Если структура не соответствует, возвращаем очищенную строку
  return cleaned;
}
