// renderer/list.js – Отрисовка списка стихотворений

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
