// Mejoras progresivas: la app funciona sin JavaScript.
document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
  const input = document.getElementById(btn.dataset.togglePassword);
  btn.hidden = false;
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Ocultar" : "Mostrar";
  });
});

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-confirm]");
  if (el && !window.confirm(el.dataset.confirm)) e.preventDefault();
});
