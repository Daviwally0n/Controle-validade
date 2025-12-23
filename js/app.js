let produtos = [];
let scannerAtivo = false;

// Mostrar usuário logado
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("usuario");
  if (user) {
    document.getElementById("usuarioLogado").innerText = user;
  }
  carregarLista();
});

// LOGOUT
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

// INICIAR SCANNER
function iniciarScanner() {
  if (scannerAtivo) return;
  scannerAtivo = true;

  Quagga.init({
    inputStream: {
      type: "LiveStream",
      target: document.querySelector("#scanner"),
      constraints: {
        facingMode: "environment"
      }
    },
    decoder: {
      readers: ["ean_reader", "ean_13_reader", "code_128_reader"]
    }
  }, err => {
    if (err) {
      alert("Erro ao iniciar câmera");
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(onDetectado);
}

// QUANDO DETECTAR O CÓDIGO
async function onDetectado(data) {
  Quagga.stop();
  Quagga.offDetected(onDetectado);
  scannerAtivo = false;

  const codigo = data.codeResult.code;
  buscarProdutoEAN(codigo);
}

// BUSCAR PRODUTO NAS APIs EAN PICTURES
async function buscarProdutoEAN(codigo) {
  try {
    const imgURL = `http://www.eanpictures.com.br:9000/api/gtin/${codigo}`;
    const descResp = await fetch(`http://www.eanpictures.com.br:9000/api/descricao/${codigo}`);
    const descData = await descResp.json();

    const descricao = descData.descricao || "Descrição não encontrada";

    adicionarProduto({
      codigo,
      descricao,
      imagem: imgURL,
      quantidade: "",
      validade: ""
    });

  } catch (e) {
    alert("Erro ao buscar produto");
  }
}

// ADICIONAR PRODUTO À LISTA
function adicionarProduto(produto) {
  produtos.push(produto);
  salvarLista();
  renderizarLista();
}

// RENDERIZAR LISTA
function renderizarLista() {
  const tbody = document.getElementById("listaProdutos");
  tbody.innerHTML = "";

  produtos.forEach((p, index) => {
    tbody.innerHTML += `
      <tr>
        <td>
          <img src="${p.imagem}" style="width:60px; display:block; margin-bottom:5px">
          <small>${p.descricao}</small>
        </td>
        <td>
          <input type="number" class="form-control"
            value="${p.quantidade}"
            onchange="atualizarCampo(${index}, 'quantidade', this.value)">
        </td>
        <td>
          <input type="date" class="form-control"
            value="${p.validade}"
            onchange="atualizarCampo(${index}, 'validade', this.value)">
        </td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="removerProduto(${index})">X</button>
        </td>
      </tr>
    `;
  });
}

// ATUALIZAR CAMPOS
function atualizarCampo(index, campo, valor) {
  produtos[index][campo] = valor;
  salvarLista();
}

// REMOVER
function removerProduto(index) {
  produtos.splice(index, 1);
  salvarLista();
  renderizarLista();
}

// SALVAR OFFLINE
function salvarLista() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

// CARREGAR OFFLINE
function carregarLista() {
  const data = localStorage.getItem("produtos");
  if (data) {
    produtos = JSON.parse(data);
    renderizarLista();
  }
}

// EXPORTAR PDF
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text("Controle de Validades", 10, y);
  y += 10;

  produtos.forEach(p => {
    doc.text(`${p.descricao} | Qtd: ${p.quantidade} | Val: ${p.validade}`, 10, y);
    y += 8;
  });

  doc.save("controle-validade.pdf");
}
