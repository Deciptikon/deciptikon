window.addEventListener("DOMContentLoaded", () => {
  const db = window.api.loadData();
  const listDiv = document.getElementById("list");

  if (!db.data.length) {
    listDiv.innerHTML = "<p>Нет данных</p>";
    return;
  }

  const ul = document.createElement("ul");
  db.data.forEach((poem) => {
    const li = document.createElement("li");
    li.textContent = `${poem.name} (${poem.type})`;
    ul.appendChild(li);
  });
  listDiv.appendChild(ul);
});
