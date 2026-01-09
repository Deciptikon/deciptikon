// Активация мобильного меню
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  // Переключение меню
  menuToggle.addEventListener("click", function () {
    navLinks.classList.toggle("active");
    const icon = menuToggle.querySelector("i");
    if (navLinks.classList.contains("active")) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-times");
    } else {
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });

  // Закрытие меню при клике на ссылку
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      const icon = menuToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    });
  });

  // Плавная анимация для кнопок
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseenter", function (e) {
      const x = e.pageX - this.offsetLeft;
      const y = e.pageY - this.offsetTop;

      const ripples = document.createElement("span");
      ripples.style.left = x + "px";
      ripples.style.top = y + "px";
      ripples.classList.add("ripple");

      this.appendChild(ripples);

      setTimeout(() => {
        ripples.remove();
      }, 1000);
    });
  });

  // Анимация появления элементов при прокрутке
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animated");
      }
    });
  }, observerOptions);

  // Наблюдаем за элементами с классом "feature"
  document.querySelectorAll(".feature").forEach((el) => {
    observer.observe(el);
  });

  // Добавляем небольшой эффект для логотипа
  const logo = document.querySelector(".logo");
  logo.addEventListener("mouseenter", () => {
    logo.style.transform = "scale(1.05)";
    logo.style.transition = "transform 0.3s ease";
  });

  logo.addEventListener("mouseleave", () => {
    logo.style.transform = "scale(1)";
  });

  // Консольное сообщение для разработчика
  console.log(
    "Заглавная страница загружена. Вы можете легко изменить её содержимое в файлах HTML, CSS и JS."
  );
});
