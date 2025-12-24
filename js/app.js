let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let detector;
let stream;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("usuarioLogado").innerText =
    localStorage.getItem("usuario") || "";

  renderizarLista();
});

/* =========================
   SCANNER REAL (BarcodeDetector)
========================= */
async function iniciarScanner() {
  if (!("BarcodeDetector" in window)) {
    alert("Scanner não suportado neste navegador");
    return;
  }

  detector = new BarcodeDetector({
    formats: ["ean_13", "ean_8"]
  });

  const video = document.getElementById("video");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    await video.play();

    requestAnimationFrame(scanLoop);
  } catch (e) {
    alert("Erro ao acessar a câmera");
  }
}

async function scanLoop() {
  if (!detector) return;

  const video = document.getElementById("video");

  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    requestAnimationFrame(scanLoop);
    return;
  }

  const codigos = await detector.detect(video);

  if (codigos.length > 0) {
    const codigo = codigos[0].rawValue;
    pararScanner();
    buscarProduto(codigo);
    return;
  }

  requestAnimationFrame(scanLoop);
}

function pararScanner() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
  }
}

/* =========================
   DIGITAR CÓDIGO MANUAL
========================= */
function digitarCodigo() {
  const codigo = prompt("Digite o código de barras (EAN):");

  if (!codigo) return;

  if (!/^\d{8,13}$/.test(codigo)) {
    alert("Código inválido");
    return;
  }

  buscarProduto(codigo);
}

/* =========================
   BUSCAR PRODUTO (API EAN)
========================= */
async function buscarProduto(codigo) {
  try {
    const [imgRes, descRes] = await Promise.all([
      fetch(`http://www.eanpictures.com.br:9000/api/gtin/${codigo}`),
      fetch(`http://www.eanpictures.com.br:9000/api/descricao/${codigo}`)
    ]);

    const imagem = imgRes.ok ? await imgRes.text() : "";
    const descricao = descRes.ok
      ? await descRes.text()
      : "Produto não identificado";

    adicionarProduto(codigo, descricao, imagem);

  } catch (e) {
    alert("Erro ao consultar a API");
  }
}

/* =========================
   LISTA
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
   PDF
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




