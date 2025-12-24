/***********************
 * CONFIGURAÇÃO PROXY *
 ***********************/
const PROXY_BASE = "https://ean-proxy.vercel.app/api/ean";

/***********************
 * ESTADO GLOBAL *
 ***********************/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let detector = null;

/***********************
 * INIT *
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("usuarioLogado").innerText =
    localStorage.getItem("usuario") || "Usuário";

  renderizarLista();
});

/***********************
 * LOGOUT *
 ***********************/
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

/***********************
 * SCANNER REAL (CAMERA)
 ***********************/
async function iniciarScanner() {
  if (!("BarcodeDetector" in window)) {
    alert("Scanner não suportado neste navegador.");
    return;
  }

  detector = new BarcodeDetector({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e"]
  });

  const scanner = document.getElementById("scanner");
  scanner.innerHTML = `<video id="video" autoplay playsinline></video>`;

  const video = document.getElementById("video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;

  const scanLoop = async () => {
    if (!video.videoWidth) {
      requestAnimationFrame(scanLoop);
      return;
    }

    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const codigo = barcodes[0].rawValue;
        pararScanner();
        buscarProduto(codigo);
      }
    } catch (e) {
      console.error(e);
    }

    requestAnimationFrame(scanLoop);
  };

  scanLoop();
}

function pararScanner() {
  const video = document.getElementById("video");
  if (video && video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
  document.getElementById("scanner").innerHTML = "";
}

/***********************
 * ENTRADA MANUAL
 ***********************/
function buscarManual() {
  const codigo = prompt("Digite o código de barras:");
  if (codigo) buscarProduto(codigo.trim());
}

/***********************
 * BUSCAR PRODUTO (API)
 ***********************/
async function buscarProduto(codigo) {
  try {
    const [imgRes, descRes] = await Promise.all([
      fetch(`${PROXY_BASE}?tipo=gtin&codigo=${codigo}`),
      fetch(`${PROXY_BASE}?tipo=descricao&codigo=${codigo}`)
    ]);

    const imagem = imgRes.ok ? await imgRes.text() : "";
    const descricao = descRes.ok
      ? await descRes.text()
      : "Produto não identificado";

    adicionarProduto(codigo, descricao, imagem);

  } catch (err) {
    alert("Erro ao consultar a API");
    console.error(err);
  }
}

/***********************
 * ADICIONAR PRODUTO
 ***********************/
function adicionarProduto(codigo, descricao, imagem) {
  produtos.push({
    codigo,
    descricao,
    imagem,
    quantidade: 1,
    validade: ""
  });

  salvar();
  renderizarLista();
}

/***********************
 * RENDERIZAR LISTA
 ***********************/
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
        <input type="number" min="1" value="${p.quantidade}"
          onchange="atualizarQtd(${i}, this.value)">
      </td>
      <td>
        <input type="date" value="${p.validade}"
          onchange="atualizarValidade(${i}, this.value)">
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="remover(${i})">X</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/***********************
 * ATUALIZAÇÕES
 ***********************/
function atualizarQtd(i, v) {
  produtos[i].quantidade = v;
  salvar();
}

function atualizarValidade(i, v) {
  produtos[i].validade = v;
  salvar();
}

function remover(i) {
  produtos.splice(i, 1);
  salvar();
  renderizarLista();
}

/***********************
 * SALVAR LOCAL
 ***********************/
function salvar() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

/***********************
 * EXPORTAR PDF
 ***********************/
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text("Controle de Validades", 10, 10);

  let y = 20;

  produtos.forEach((p, i) => {
    doc.setFontSize(10);
    doc.text(
      `${i + 1}. ${p.descricao} | Qtd: ${p.quantidade} | Val: ${p.validade || "-"}`,
      10,
      y
    );
    y += 8;
  });

  doc.save("controle-validade.pdf");
}



