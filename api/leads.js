
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

module.exports = async function (req, res) {
  try {
    // Salvar novo contato
    if (req.method === "POST") {
      const b = req.body || {};
      const nome = String(b.nome || "").trim().slice(0, 80);
      const telefone = String(b.telefone || "").trim().slice(0, 25);
      if (!nome || !telefone) {
        return res.status(400).json({ erro: "Nome e telefone são obrigatórios." });
      }
      const lead = {
        id: Date.now().toString(36),
        nome: nome,
        telefone: telefone,
        plano: String(b.plano || "").slice(0, 20),
        objetivo: String(b.objetivo || "").slice(0, 300),
        data: new Date().toISOString()
      };
      await redis.lpush("leads", lead);
      return res.status(201).json({ ok: true });
    }

    // Ver contatos salvos (protegido por senha)
    if (req.method === "GET") {
      if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ erro: "Não autorizado." });
      }
      const leads = await redis.lrange("leads", 0, 99);
      return res.status(200).json(leads);
    }

    return res.status(405).json({ erro: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({ erro: "Erro no servidor." });
  }
};
