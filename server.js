import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 SUAS CONFIGS (CONFERE ISSO)
const SUPABASE_URL = "COLE_SUA_URL_SUPABASE";
const SUPABASE_KEY = "COLE_SUA_KEY_SUPABASE";
const MP_TOKEN = "COLE_SEU_TOKEN_MERCADO_PAGO";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔥 HOME (SITE)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 GERAR PEDIDO
app.post("/pedido", async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      produto,
      plano,
      valor,
      quantidade,
      link_alvo,
    } = req.body;

    // ✅ VALIDAÇÃO
    if (!nome || !email || !produto || !plano || !valor || !quantidade || !link_alvo) {
      return res.status(400).json({
        erro: "Campos obrigatórios: nome, email, produto, plano, valor, quantidade, link_alvo",
      });
    }

    // 🔢 GERAR NÚMERO DO PEDIDO
    const numeroPedido = "PED" + Date.now();

    // 💳 CRIAR PAGAMENTO (PIX MERCADO PAGO)
    const pagamento = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: `${produto} - ${plano}`,
        payment_method_id: "pix",
        payer: {
          email: email,
        },
      }),
    });

    const resultado = await pagamento.json();

    if (!pagamento.ok) {
      return res.status(500).json({
        erro: "Erro ao gerar pagamento",
        detalhe: resultado,
      });
    }

    const dados = resultado.point_of_interaction?.transaction_data || {};

    // 💾 SALVAR NO BANCO
    const { error } = await supabase.from("pedidos").insert({
      numero_pedido: numeroPedido,
      nome,
      email,
      telefone: telefone || null,
      produto,
      plano,
      valor: Number(valor),
      quantidade: Number(quantidade),
      link_alvo,
      status: resultado.status || "pending",
      status_entrega: "aguardando",
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

    // 🔥 RESPOSTA PRO FRONT
    res.json({
      numero_pedido: numeroPedido,
      status: resultado.status,
      valor: Number(valor),
      qr_code: dados.qr_code || "",
      ticket_url: dados.ticket_url || "",
    });

  } catch (error) {
    res.status(500).json({
      erro: "Erro interno",
      detalhe: error?.message || null,
    });
  }
});

// 🔍 BUSCAR PEDIDO
app.get("/pedido/:numero", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", req.params.numero)
      .single();

    if (error) {
      return res.status(404).json({ erro: "Pedido não encontrado" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar pedido" });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
