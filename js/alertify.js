/*!
 * AlertifyJS - versão simples
 * Uso: alertify.success(), alertify.error(), alertify.alert()
 */

(function (global) {

  const container = document.createElement("div");
  container.id = "alertify-container";
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    font-family: Arial, sans-serif;
  `;
  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(container);
  });

  function show(msg, type = "info") {
    const alert = document.createElement("div");
    alert.innerText = msg;

    let bg = "#333";
    if (type === "success") bg = "#28a745";
    if (type === "error") bg = "#dc3545";
    if (type === "warning") bg = "#ffc107";

    alert.style.cssText = `
      background: ${bg};
      color: #fff;
      padding: 12px 18px;
      margin-bottom: 10px;
      border-radius: 4px;
      min-width: 220px;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
      opacity: 0;
      transition: opacity .3s;
    `;

    container.appendChild(alert);

    requestAnimationFrame(() => {
      alert.style.opacity = "1";
    });

    setTimeout(() => {
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, alertify.delay || 2000);
  }

  global.alertify = {
    delay: 2000,

    set: function (opts) {
      if (opts.delay) this.delay = opts.delay;
    },

    success: function (msg) {
      show(msg, "success");
    },

    error: function (msg) {
      show(msg, "error");
    },

    warning: function (msg) {
      show(msg, "warning");
    },

    alert: function (msg) {
      show(msg, "info");
    }
  };

})(window);
