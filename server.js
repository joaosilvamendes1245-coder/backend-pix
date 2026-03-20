const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function gerarNumeroPedido() {
  const agora = new Date();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PED-${agora.getTime()}-${rand}`;
}

app.get("/", (req, res) => {
  res.send("Backend rodando");
});

app.post("/pedido", async (req, res) => {
  try {
    const { nome, email, produto, valor } = req.body;

    if (!nome || !email || !produto || !valor) {
      return res.status(400).json({
        erro: "Campos obrigatórios: nome, email, produto, valor",
      });
    }

    const numeroPedido = gerarNumeroPedido();

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: `${produto} | Pedido ${numeroPedido}`,
        payment_method_id: "pix",
        notification_url: `${process.env.BASE_URL}/webhook`,
        payer: {
          email,
          first_name: nome,
        },
      },
    });

    const dados = resultado.point_of_interaction?.transaction_data || {};

    const { error } = await supabase.from("pedidos").insert({
      numero_pedido: numeroPedido,
      nome,
      email,
      produto,
      valor: Number(valor),
      status: resultado.status || "pending",
      payment_id: String(resultado.id),
      qr_code: dados.qr_code || null,
      ticket_url: dados.ticket_url || null,
    });

    if (error) {
      return res.status(500).json({
        erro: "Erro ao salvar pedido",
        detalhe: error.message,
      });
    }

    res.json({
      numero_pedido: numeroPedido,
      payment_id: resultado.id,
      status: resultado.status,
      qr_code: dados.qr_code || null,
      ticket_url: dados.ticket_url || null,
    });
  } catch (error) {
    console.log("ERRO AO CRIAR PEDIDO:", error);
    res.status(500).json({
      erro: "Erro ao criar pedido",
      detalhe: error?.message || null,
    });
  }
});

app.get("/pedido/:numero", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", req.params.numero)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      erro: "Erro ao buscar pedido",
      detalhe: error?.message || null,
    });
  }
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("WEBHOOK RECEBIDO:", JSON.stringify(req.body), req.query);

    const paymentId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query["data.id"] ||
      req.query.id;

    if (!paymentId) {
      return res.status(200).json({ ok: true, info: "sem payment id" });
    }

    const payment = new Payment(client);
    const resultado = await payment.get({ id: paymentId });

    const dadosAtualizacao = {
      status: resultado.status || "pending",
    };

    if (resultado.status === "approved") {
      dadosAtualizacao.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("pedidos")
      .update(dadosAtualizacao)
      .eq("payment_id", String(paymentId));

    if (error) {
      console.log("ERRO AO ATUALIZAR PEDIDO:", error.message);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.log("ERRO WEBHOOK:", error);
    res.status(200).json({
      ok: false,
      detalhe: error?.message || null,
    });
  }
});

app.get("/pix", async (req, res) => {
  try {
    const { valor, email, nome, produto } = req.query;

    if (!valor || !email || !nome || !produto) {
      return res.status(400).json({ erro: "Faltando dados" });
    }

    const numeroPedido = gerarNumeroPedido();

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: `${produto} | Pedido ${numeroPedido}`,
        payment_method_id: "pix",
        notification_url: `${process.env.BASE_URL}/webhook`,
        payer: {
          email,
          first_name: nome,
        },
      },
    });

    const dados = resultado.point_of_interaction?.transaction_data || {};

    const { error } = await supabase.from("pedidos").insert({
      numero_pedido: numeroPedido,
      nome,
      email,
      produto,
      valor: Number(valor),
      status: resultado.status || "pending",
      payment_id: String(resultado.id),
      qr_code: dados.qr_code || null,
      ticket_url: dados.ticket_url || null,
    });

    if (error) {
      return res.status(500).json({
        erro: "Erro ao salvar pedido",
        detalhe: error.message,
      });
    }

    res.json({
      numero_pedido: numeroPedido,
      payment_id: resultado.id,
      status: resultado.status,
      qr_code: dados.qr_code || null,
      ticket_url: dados.ticket_url || null,
    });
  } catch (error) {
    console.log("ERRO AO GERAR PIX:", error);
    res.status(500).json({
      erro: "Erro ao gerar pix",
      detalhe: error?.message || null,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
