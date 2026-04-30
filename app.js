const progress = document.createElement("div");
progress.className = "scroll-progress";
document.body.prepend(progress);

const header = document.querySelector(".site-header");

function updateScrollUI() {
  const doc = document.documentElement;
  const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
  const ratio = Math.min(window.scrollY / max, 1);

  progress.style.transform = `scaleX(${ratio})`;

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
}

updateScrollUI();
window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", updateScrollUI, { passive: true });