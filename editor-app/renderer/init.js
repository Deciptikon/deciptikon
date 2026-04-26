// renderer/init.js – Инициализация приложения

window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  addBtn.addEventListener("click", addNewPoem);
});
