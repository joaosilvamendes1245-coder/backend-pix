const catalogo = {
  "Seguidores Instagram": {
    label: "Link do perfil do Instagram",
    planos: {
      "Plano 1": 0.015,
      "Plano 2": 0.02,
      "Plano 3": 0.03,
      "Plano 4": 0.05
    }
  },
  "Curtidas Instagram": {
    label: "Link da foto ou vídeo",
    planos: {
      "Plano 1": 0.02,
      "Plano 2": 0.03,
      "Plano 3": 0.04,
      "Plano 4": 0.06
    }
  },
  "Visualizações Reels": {
    label: "Link do Reels",
    planos: {
      "Plano 1": 0.003,
      "Plano 2": 0.005,
      "Plano 3": 0.007,
      "Plano 4": 0.01
    }
  },
  "Comentários Instagram": {
    label: "Link do post",
    planos: {
      "Plano 1": 0.5,
      "Plano 2": 0.8,
      "Plano 3": 1.2,
      "Plano 4": 1.8
    }
  }
};

const quantidadesPadrao = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

let servicoSelecionado = null;
let planoSelecionado = null;
let quantidadeSelecionada = null;
let usandoOutraQuantidade = false;

const servicosGrid = document.getElementById("servicosGrid");
const planosGrid = document.getElementById("planosGrid");
const quantidadesGrid = document.getElementById("quantidadesGrid");
const btnOutros = document.getElementById("btnOutros");
const quantidadeOutra = document.getElementById("quantidadeOutra");

const linkLabel = document.getElementById("linkLabel");
const linkAlvo = document.getElementById("link_alvo");
const nome = document.getElementById("nome");
const email = document.getElementById("email");
const telefone = document.getElementById("telefone");

const resumoServico = document.getElementById("resumoServico");
const resumoPlano = document.getElementById("resumoPlano");
const resumoQuantidade = document.getElementById("resumoQuantidade");
const resumoValor = document.getElementById("resumoValor");

const btnGerar = document.getElementById("btnGerar");
const statusEl = document.getElementById("status");

const resultado = document.getElementById("resultado");
const pedidoNumero = document.getElementById("pedidoNumero");
const pedidoStatus = document.getElementById("pedidoStatus");
const pedidoValor = document.getElementById("pedidoValor");
const qrCode = document.getElementById("qrCode");
const btnPagar = document.getElementById("btnPagar");
const btnCopiarPix = document.getElementById("btnCopiarPix");

function formatarValor(v) {
  return Number(v).toFixed(2).replace(".", ",");
}

function calcularValor(servico, plano, quantidade) {
  if (!servico || !plano || !quantidade) return 0;
  const precoUnitario = catalogo[servico].planos[plano];
  return Number(precoUnitario) * Number(quantidade);
}

function renderServicos() {
  servicosGrid.innerHTML = "";

  Object.keys(catalogo).forEach((nomeServico, index) => {
    const card = document.createElement("div");
    card.className = "option-card";

    if (index === 0) {
      card.classList.add("active");
      servicoSelecionado = nomeServico;
    }

    card.innerHTML = `
      <div class="option-title">${nomeServico}</div>
      <div class="option-subtitle">Clique para selecionar</div>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll("#servicosGrid .option-card").forEach(el => el.classList.remove("active"));
      card.classList.add("active");
      servicoSelecionado = nomeServico;
      renderPlanos();
      renderQuantidades();
      atualizarResumo();
    });

    servicosGrid.appendChild(card);
  });
}

function renderPlanos() {
  planosGrid.innerHTML = "";

  const planos = catalogo[servicoSelecionado].planos;
  const nomesPlanos = Object.keys(planos);

  nomesPlanos.forEach((nomePlano, index) => {
    const card = document.createElement("div");
    card.className = "option-card";

    if (index === 0) {
      card.classList.add("active");
      planoSelecionado = nomePlano;
    }

    card.innerHTML = `
      <div class="option-title">${nomePlano}</div>
      <div class="option-subtitle">Preço dinâmico pelo cálculo</div>
    `;

    card.addEventListener("click", () => {
      document.querySelectorAll("#planosGrid .option-card").forEach(el => el.classList.remove("active"));
      card.classList.add("active");
      planoSelecionado = nomePlano;
      atualizarResumo();
    });

    planosGrid.appendChild(card);
  });

  linkLabel.textContent = catalogo[servicoSelecionado].label;
  linkAlvo.placeholder = catalogo[servicoSelecionado].label;
}

function renderQuantidades() {
  quantidadesGrid.innerHTML = "";
  usandoOutraQuantidade = false;
  quantidadeOutra.classList.add("hidden");
  quantidadeOutra.value = "";

  quantidadesPadrao.forEach((qtd, index) => {
    const card = document.createElement("div");
    card.className = "option-card";

    if (index === 0) {
      card.classList.add("active");
      quantidadeSelecionada = qtd;
    }

    card.innerHTML = `
      <div class="option-title">${qtd}</div>
      <div class="option-subtitle">quantidade</div>
    `;

    card.addEventListener("click", () => {
      usandoOutraQuantidade = false;
      quantidadeOutra.classList.add("hidden");
      quantidadeOutra.value = "";
      document.querySelectorAll("#quantidadesGrid .option-card").forEach(el => el.classList.remove("active"));
      card.classList.add("active");
      quantidadeSelecionada = qtd;
      atualizarResumo();
    });

    quantidadesGrid.appendChild(card);
  });
}

btnOutros.addEventListener("click", () => {
  document.querySelectorAll("#quantidadesGrid .option-card").forEach(el => el.classList.remove("active"));
  usandoOutraQuantidade = true;
  quantidadeSelecionada = null;
  quantidadeOutra.classList.remove("hidden");
  quantidadeOutra.focus();
  atualizarResumo();
});

quantidadeOutra.addEventListener("input", () => {
  if (usandoOutraQuantidade) {
    quantidadeSelecionada = Number(quantidadeOutra.value || 0);
    atualizarResumo();
  }
});

function atualizarResumo() {
  const valor = calcularValor(servicoSelecionado, planoSelecionado, quantidadeSelecionada);

  resumoServico.textContent = servicoSelecionado || "-";
  resumoPlano.textContent = planoSelecionado || "-";
  resumoQuantidade.textContent = quantidadeSelecionada || "-";
  resumoValor.textContent = formatarValor(valor);
}

btnGerar.addEventListener("click", async () => {
  try {
    statusEl.textContent = "Gerando pedido...";

    const quantidadeFinal = Number(quantidadeSelecionada || 0);
    const valor = calcularValor(servicoSelecionado, planoSelecionado, quantidadeFinal);

    const payload = {
      nome: nome.value.trim(),
      email: email.value.trim(),
      telefone: telefone.value.trim(),
      produto: servicoSelecionado,
      plano: planoSelecionado,
      valor,
      quantidade: quantidadeFinal,
      link_alvo: linkAlvo.value.trim()
    };

    if (!payload.nome || !payload.email || !payload.produto || !payload.plano || !payload.quantidade || !payload.link_alvo) {
      statusEl.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    const response = await fetch("/pedido", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      statusEl.textContent = data.erro || "Erro ao gerar pedido.";
      return;
    }

    pedidoNumero.textContent = data.numero_pedido;
    pedidoStatus.textContent = data.status;
    pedidoValor.textContent = formatarValor(data.valor);
    qrCode.value = data.qr_code || "";
    btnPagar.href = data.ticket_url || "#";

    resultado.classList.remove("hidden");
    statusEl.textContent = "Pedido gerado com sucesso.";
    resultado.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.log(error);
    statusEl.textContent = "Erro ao gerar pedido.";
  }
});

btnCopiarPix.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(qrCode.value);
    alert("Pix copiado com sucesso!");
  } catch (error) {
    alert("Não foi possível copiar o Pix.");
  }
});

renderServicos();
renderPlanos();
renderQuantidades();
atualizarResumo();
