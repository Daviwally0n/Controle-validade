/***********************
 * CONFIGURAÇÃO PROXY *
 ***********************/
const PROXY_BASE =  "https://ean-proxy-git-main-davi-s-projects-7cc56d7c.vercel.app/api/ean";

/***********************
 * ESTADO GLOBAL *
 ***********************/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let detector = null;

/***********************
 * INIT *
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  const userEl = document.getElementById("usuarioLogado");
  if (userEl) {
    userEl.innerText = localStorage.getItem("usuario") || "Usuário";
  }
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
 * SCANNER (CÂMERA)
 ***********************/
async function iniciarScanner() {
  if (!("BarcodeDetector" in window)) {
    alert("Este navegador não suporta leitura por câmera.");
    return;
  }

  detector = new BarcodeDetector({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e"]
  });

  const scanner = document.getElementById("scanner");
  scanner.innerHTML = `
    <video id="video" autoplay playsinline class="w-100" style="max-height:300px"></video>
  `;

  const video = document.getElementById("video");

  try {
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
          return;
        }
      } catch (e) {
        console.error("Erro no detector:", e);
      }

      requestAnimationFrame(scanLoop);
    };

    scanLoop();

  } catch (err) {
    alert("Não foi possível acessar a câmera.");
    console.error(err);
  }
}

function pararScanner() {
  const video = document.getElementById("video");
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
  }
  document.getElementById("scanner").innerHTML = "";
}

/***********************
 * ENTRADA MANUAL
 ***********************/
function digitarCodigo() {
  const codigo = prompt("Digite o código de barras:");
  if (codigo && codigo.trim()) {
    buscarProduto(codigo.trim());
  }
}

/***********************
 * BUSCAR PRODUTO (SCRAPING VIA PROXY)
 ***********************/
async function buscarProduto(codigo) {
  try {
    const res = await fetch(
      `${PROXY_BASE}?tipo=descricao&codigo=${codigo}`
    );

    const descricao = res.ok
      ? (await res.text()).trim()
      : "Produto não identificado";

    adicionarProduto(codigo, descricao);

  } catch (err) {
    alert("Erro ao consultar o produto.");
    console.error(err);
  }
}

/***********************
 * ADICIONAR PRODUTO
 ***********************/
function adicionarProduto(codigo, descricao) {
  produtos.push({
    codigo,
    descricao,
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
  if (!tbody) return;

  tbody.innerHTML = "";

  produtos.forEach((p, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <strong>${p.descricao}</strong><br>
        <small class="text-muted">EAN: ${p.codigo}</small>
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
  produtos[i].quantidade = Number(v);
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








