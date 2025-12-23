/* =========================
   AUTENTICAÇÃO / USUÁRIO
========================= */

document.addEventListener("DOMContentLoaded", () => {
  const usuario = localStorage.getItem("usuario");
  if (usuario) {
    document.getElementById("usuarioLogado").innerText = usuario;
  }
  carregarLista();
});

/* =========================
   LOGOUT
========================= */

function logout() {
  localStorage.removeItem("auth");
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}

/* =========================
   SCANNER REAL (QUAGGA)
========================= */

let scannerAtivo = false;

function iniciarScanner() {
  if (scannerAtivo) return;
  scannerAtivo = true;

  const scannerDiv = document.getElementById("scanner");
  scannerDiv.innerHTML = "";

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: scannerDiv,
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "upc_reader",
        "upc_e_reader"
      ]
    }
  }, function (err) {
    if (err) {
      alert("Erro ao acessar câmera");
      scannerAtivo = false;
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(function (data) {
    const codigo = data.codeResult.code;

    Quagga.stop();
    Quagga.offDetected();
    scannerAtivo = false;
    scannerDiv.innerHTML = "";

    buscarProduto(codigo);
  });
}

/* =========================
   BUSCA DE PRODUTO (API)
========================= */

function buscarProduto(codigo) {
  fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 1) {
        const nome =
          data.product.product_name ||
          data.product.generic_name ||
          "Produto identificado";
        adicionarProduto(nome);
      } else {
        adicionarProduto("Produto não encontrado");
      }
    })
    .catch(() => {
      adicionarProduto("Erro ao buscar produto");
    });
}

/* =========================
   LISTA DE PRODUTOS
========================= */

function adicionarProduto(nome) {
  const tbody = document.getElementById("listaProdutos");

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${nome}</td>
    <td><input type="number" class="form-control qtd" value="1" min="1"></td>
    <td><input type="date" class="form-control validade"></td>
    <td>
      <button class="btn btn-sm btn-danger" onclick="removerLinha(this)">X</button>
    </td>
  `;

  tbody.appendChild(tr);
  salvarLista();
}

function removerLinha(btn) {
  btn.closest("tr").remove();
  salvarLista();
}

/* =========================
   SALVAR / CARREGAR OFFLINE
========================= */

function salvarLista() {
  const dados = [];
  document.querySelectorAll("#listaProdutos tr").forEach(tr => {
    dados.push({
      produto: tr.children[0].innerText,
      qtd: tr.querySelector(".qtd").value,
      validade: tr.querySelector(".validade").value
    });
  });
  localStorage.setItem("listaProdutos", JSON.stringify(dados));
}

function carregarLista() {
  const dados = JSON.parse(localStorage.getItem("listaProdutos") || "[]");
  dados.forEach(item => {
    const tbody = document.getElementById("listaProdutos");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.produto}</td>
      <td><input type="number" class="form-control qtd" value="${item.qtd}"></td>
      <td><input type="date" class="form-control validade" value="${item.validade}"></td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="removerLinha(this)">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================
   EXPORTAR PDF PROFISSIONAL
========================= */

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Controle de Validades", 14, 15);

  let y = 30;
  doc.setFontSize(10);

  doc.text("Produto", 14, y);
  doc.text("Qtd", 120, y);
  doc.text("Validade", 150, y);

  y += 5;

  document.querySelectorAll("#listaProdutos tr").forEach(tr => {
    const produto = tr.children[0].innerText;
    const qtd = tr.querySelector(".qtd").value;
    const validade = tr.querySelector(".validade").value || "-";

    doc.text(produto.substring(0, 60), 14, y);
    doc.text(qtd, 120, y);
    doc.text(validade, 150, y);

    y += 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("controle-validade.pdf");
}

/* =========================
   ALERTA DE VENCIMENTO (BASE)
========================= */

function verificarVencimentos() {
  const hoje = new Date();
  document.querySelectorAll("#listaProdutos tr").forEach(tr => {
    const validade = tr.querySelector(".validade").value;
    if (!validade) return;

    const dataValidade = new Date(validade);
    const diff = (dataValidade - hoje) / (1000 * 60 * 60 * 24);

    if (diff <= 7) {
      tr.style.backgroundColor = "#fff3cd"; // amarelo
    }
    if (diff <= 0) {
      tr.style.backgroundColor = "#f8d7da"; // vermelho
    }
  });
}

setInterval(verificarVencimentos, 60000);
