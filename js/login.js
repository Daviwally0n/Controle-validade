$(document).ready(function () {

  alertify.set({
    delay: 2000,
    labels: {
      ok: "OK",
      cancel: "Cancelar"
    }
  });

  const usuariosValidos = [
    { user: "Davi.wallyson", pass: "123456" },
    { user: "Mario.Henrique", pass: "123456" },
    { user: "Virtor.Gabriel", pass: "123456" },
    { user: "Jadson.Alves", pass: "123456" }
  ];

  // REMOVE handlers anteriores do template e assume controle
  $(document).off("submit", ".signin-form").on("submit", ".signin-form", function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const usuario = $(this).find('input[type="text"]').val().trim();
    const senha = $("#password-field").val().trim();

    if (!usuario || !senha) {
      alertify.error("Informe usuário e senha");
      return false;
    }

    const autorizado = usuariosValidos.find(u =>
      u.user === usuario && u.pass === senha
    );

    if (autorizado) {
      alertify.success("Acesso autorizado");

      localStorage.setItem("auth", "true");
      localStorage.setItem("usuario", usuario);

      setTimeout(() => {
        window.location.replace("app.html");
      }, 800);

    } else {
      alertify.error("Usuário ou senha inválidos");
    }

    return false;
  });

});
