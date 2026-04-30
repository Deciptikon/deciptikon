// renderer/init.js – Инициализация приложения

let coreTags = [];

window.addEventListener("DOMContentLoaded", async () => {
  coreTags = await window.api.loadTags();
  await loadData();
  addBtn.addEventListener("click", addNewPoem);
});
