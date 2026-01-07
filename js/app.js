/***********************
 * ESTADO GLOBAL
 ***********************/
let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let historicoDescricoes =
  JSON.parse(localStorage.getItem("descricoes")) || [];
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
 * SCANNER
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
  scanner.innerHTML =
    `<video id="video" autoplay playsinline class="w-100" style="max-height:300px"></video>`;

  const video = document.getElementById("video");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;

    const loop = async () => {
      if (!video.videoWidth) {
        requestAnimationFrame(loop);
        return;
      }

      const codes = await detector.detect(video);
      if (codes.length) {
        pararScanner();
        processarCodigo(codes[0].rawValue);
      } else {
        requestAnimationFrame(loop);
      }
    };

    loop();
  } catch {
    alert("Erro ao acessar a câmera.");
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
 * DIGITAÇÃO MANUAL
 ***********************/
function digitarCodigo() {
  const codigo = prompt("Digite o código de barras:");
  if (codigo?.trim()) processarCodigo(codigo.trim());
}

/***********************
 * PROCESSAR CÓDIGO
 ***********************/
function processarCodigo(codigo) {
  const desc = pedirDescricao();
  if (!desc) return;

  produtos.push({
    codigo,
    descricao: desc,
    quantidade: 1,
    validade: "",
    acao: false
  });

  if (!historicoDescricoes.includes(desc)) {
    historicoDescricoes.push(desc);
    localStorage.setItem("descricoes", JSON.stringify(historicoDescricoes));
  }

  salvar();
  renderizarLista();
}

/***********************
 * AUTOCOMPLETE
 ***********************/
function pedirDescricao() {
  const valor = prompt(
    "Descrição do produto:\n\nSugestões:\n" +
    historicoDescricoes.slice(-5).join("\n")
  );
  return valor?.trim();
}

/***********************
 * RENDERIZAR LISTA
 ***********************/
function renderizarLista() {
  const tbody = document.getElementById("listaProdutos");
  if (!tbody) return;

  produtos.sort((a, b) => {
    if (!a.validade) return 1;
    if (!b.validade) return -1;
    return new Date(a.validade) - new Date(b.validade);
  });

  tbody.innerHTML = "";
  const hoje = new Date().toISOString().split("T")[0];

  produtos.forEach((p, i) => {
    const tr = document.createElement("tr");

    if (p.validade && p.validade < hoje) {
      tr.className = "table-danger";
    }

    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.descricao}</td>
      <td>
        <input type="number" min="1" value="${p.quantidade}"
          class="form-control form-control-sm"
          onchange="atualizarQtd(${i}, this.value)">
      </td>
      <td>
        <input type="date" value="${p.validade}"
          class="form-control form-control-sm"
          onchange="atualizarValidade(${i}, this.value)">
      </td>
      <td class="text-center">
        <button class="btn btn-sm ${p.acao ? "btn-success" : "btn-outline-secondary"}"
          onclick="toggleAcao(${i})">
          ${p.acao ? "Praticada" : "Não praticada"}
        </button>
      </td>
      <td class="text-center">
        <button class="btn btn-danger btn-sm"
          onclick="remover(${i})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/***********************
 * AÇÕES
 ***********************/
function toggleAcao(i) {
  produtos[i].acao = !produtos[i].acao;
  salvar();
  renderizarLista();
}

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
 * SALVAR
 ***********************/
function salvar() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

/***********************
 * PDF
 ***********************/
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Controle de Validades", 10, 10);
  let y = 20;

  produtos.forEach((p, i) => {
    doc.text(
      `${i + 1}. ${p.codigo} - ${p.descricao} | Qtd: ${p.quantidade} | Val: ${p.validade || "-"} | ${p.acao ? "Praticada" : "Não praticada"}`,
      10,
      y
    );
    y += 8;
  });

  doc.save("controle-validade.pdf");
}











