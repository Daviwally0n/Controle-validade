/***********************
 * ESTADO GLOBAL
 ***********************/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let detector = null;

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
  const userEl = document.getElementById("usuarioLogado");
  if (userEl) {
    userEl.innerText = localStorage.getItem("usuario") || "Usuário";
  }
  renderizarLista();
});

/***********************
 * LOGOUT
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
  scanner.innerHTML = `<video id="video" autoplay playsinline class="w-100" style="max-height:300px"></video>`;

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

      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const codigo = barcodes[0].rawValue;
        pararScanner();
        processarCodigo(codigo);
      } else {
        requestAnimationFrame(scanLoop);
      }
    };

    scanLoop();
  } catch {
    alert("Não foi possível acessar a câmera.");
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
  if (codigo?.trim()) {
    processarCodigo(codigo.trim());
  }
}

/***********************
 * PROCESSAR CÓDIGO
 ***********************/
function processarCodigo(codigo) {
  const existente = produtos.find(p => p.codigo === codigo);

  if (existente) {
    produtos.push({ ...existente });
  } else {
    const descricao = prompt("Digite a descrição do produto:");
    if (!descricao) return;

    produtos.push({
      codigo,
      descricao,
      quantidade: 1,
      validade: ""
    });
  }

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
      <td>${p.descricao}<br><small>EAN: ${p.codigo}</small></td>
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

  renderizarRodape();
}

/***********************
 * RODAPÉ
 ***********************/
function renderizarRodape() {
  if (document.getElementById("rodape")) return;

  const rodape = document.createElement("div");
  rodape.id = "rodape";
  rodape.className = "text-center text-light mt-4";

  rodape.innerHTML = `
    <img src="images/logo.png" width="50" height="50"><br>
    <small>Produzido por Sistema E-DW Forms</small>
  `;

  document.body.appendChild(rodape);
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
      `${i + 1}. ${p.descricao} | EAN: ${p.codigo} | Qtd: ${p.quantidade} | Val: ${p.validade || "-"}`,
      10,
      y
    );
    y += 8;
  });

  doc.save("controle-validade.pdf");
}









