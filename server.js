const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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
  res.send("Backend rodando 🔥");
});

app.post("/pedido", async (req, res) => {
  try {
    const { nome, email, produto, valor } = req.body;

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

    await supabase.from("pedidos").insert({
      numero_pedido: numeroPedido,
      nome,
      email,
      produto,
      valor,
      status: resultado.status,
      payment_id: String(resultado.id),
      qr_code: dados.qr_code,
      ticket_url: dados.ticket_url,
    });

    res.json({
      numero_pedido: numeroPedido,
      payment_id: resultado.id,
      status: resultado.status,
      qr_code: dados.qr_code,
      ticket_url: dados.ticket_url,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Erro ao criar pedido" });
  }
});

app.get("/pedido/:numero", async (req, res) => {
  const { data } = await supabase
    .from("pedidos")
    .select("*")
    .eq("numero_pedido", req.params.numero)
    .single();

  res.json(data);
});

app.post("/webhook", async (req, res) => {
  try {
    const paymentId =
      req.body?.data?.id ||
      req.query["data.id"];

    if (!paymentId) return res.sendStatus(200);

    const payment = new Payment(client);
    const resultado = await payment.get({ id: paymentId });

    await supabase
      .from("pedidos")
      .update({
        status: resultado.status,
        paid_at:
          resultado.status === "approved"
            ? new Date().toISOString()
            : null,
      })
      .eq("payment_id", String(paymentId));

    res.sendStatus(200);
  } catch (error) {
    console.log("Erro webhook:", error);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});

app.get("/pix", async (req, res) => {
  try {
    const { valor, email, nome, sobrenome } = req.query;

    if (!valor || !email || !nome || !sobrenome) {
      return res.json({ erro: "Faltando dados" });
    }

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: "Pagamento via Pix",
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: nome,
          last_name: sobrenome,
        },
      },
    });

    const dados = resultado.point_of_interaction?.transaction_data || {};

    res.json({
      id: resultado.id,
      status: resultado.status,
      qr_code: dados.qr_code,
      ticket_url: dados.ticket_url,
    });
  } catch (error) {
    res.json({ erro: error.message });
  }
});
