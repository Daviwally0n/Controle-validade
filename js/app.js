let scannerAtivo = false;
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("usuarioLogado").innerText =
    localStorage.getItem("usuario") || "";

  renderizarLista();
});

/* =========================
   SCANNER REAL (QUAGGA)
========================= */
function iniciarScanner() {
  if (scannerAtivo) return;

  scannerAtivo = true;

  const scanner = document.getElementById("scanner");
  scanner.innerHTML = "";
  scanner.style.height = "300px";

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: scanner,
      constraints: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    decoder: {
      readers: ["ean_reader", "ean_13_reader"]
    },
    locate: true
  }, err => {
    if (err) {
      alert("Erro ao acessar a câmera");
      scannerAtivo = false;
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(dados => {
    const codigo = dados.codeResult.code;

    if (codigo.length < 8) return;

    Quagga.stop();
    scannerAtivo = false;

    buscarProduto(codigo);
  });
}

/* =========================
   BUSCA PRODUTO (EAN API)
========================= */
async function buscarProduto(codigo) {
  try {
    const [imgRes, descRes] = await Promise.all([
      fetch(`http://www.eanpictures.com.br:9000/api/gtin/${codigo}`),
      fetch(`http://www.eanpictures.com.br:9000/api/descricao/${codigo}`)
    ]);

    const imagem = imgRes.ok ? await imgRes.text() : "";
    const descricao = descRes.ok ? await descRes.text() : "Produto não identificado";

    adicionarProduto(codigo, descricao, imagem);

  } catch (e) {
    alert("Erro ao consultar produto");
  }
}

/* =========================
   ADICIONAR PRODUTO
========================= */
function adicionarProduto(codigo, descricao, imagem) {
  produtos.push({
    codigo,
    descricao,
    imagem,
    quantidade: "",
    validade: ""
  });

  salvar();
  renderizarLista();
}

/* =========================
   RENDERIZA LISTA
========================= */
function renderizarLista() {
  const tbody = document.getElementById("listaProdutos");
  tbody.innerHTML = "";

  produtos.forEach((p, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        ${p.imagem ? `<img src="${p.imagem}" width="60"><br>` : ""}
        ${p.descricao}
      </td>
      <td>
        <input type="number" class="form-control"
          value="${p.quantidade}"
          onchange="atualizar(${i}, 'quantidade', this.value)">
      </td>
      <td>
        <input type="date" class="form-control"
          value="${p.validade}"
          onchange="atualizar(${i}, 'validade', this.value)">
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="remover(${i})">
          ✕
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================
   ATUALIZA / REMOVE
========================= */
function atualizar(i, campo, valor) {
  produtos[i][campo] = valor;
  salvar();
}

function remover(i) {
  produtos.splice(i, 1);
  salvar();
  renderizarLista();
}

function salvar() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

/* =========================
   PDF PROFISSIONAL
========================= */
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("Controle de Validades", 10, 10);

  let y = 20;

  produtos.forEach(p => {
    pdf.setFontSize(10);
    pdf.text(`Produto: ${p.descricao}`, 10, y);
    pdf.text(`Qtd: ${p.quantidade} | Validade: ${p.validade}`, 10, y + 6);
    y += 15;
  });

  pdf.save("controle-validade.pdf");
}

/* =========================
   LOGOUT
========================= */
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

