const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MercadoPagoConfig, Payment } = require("mercadopago");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

app.get("/", (req, res) => {
  res.send("Backend Mercado Pago rodando");
});

app.post("/criar-pix", async (req, res) => {
  try {
    const { valor, descricao, email, nome, sobrenome } = req.body;

    if (!valor || !email || !nome || !sobrenome) {
      return res.status(400).json({
        erro: "Campos obrigatórios: valor, email, nome, sobrenome",
      });
    }

    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: descricao || "Pagamento via Pix",
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
      status_detail: resultado.status_detail,
      qr_code: dados.qr_code || null,
      qr_code_base64: dados.qr_code_base64 || null,
      ticket_url: dados.ticket_url || null,
    });
  } catch (error) {
    console.log("ERRO MP:", error);

    res.status(500).json({
      erro: "Erro ao criar pagamento Pix",
      detalhe: error?.message || null,
      resposta: error?.cause || null,
    });
  }
});

app.get("/status/:id", async (req, res) => {
  try {
    const payment = new Payment(client);
    const resultado = await payment.get({ id: req.params.id });

    res.json({
      id: resultado.id,
      status: resultado.status,
      status_detail: resultado.status_detail,
    });
  } catch (error) {
    console.log("ERRO STATUS:", error);

    res.status(500).json({
      erro: "Erro ao consultar status",
      detalhe: error?.message || null,
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3000}`);
});
