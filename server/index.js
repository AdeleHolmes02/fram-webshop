import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import "dotenv/config";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

/* Robust paths (fixes spaces / %20 on macOS) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Load knowledge */
const knowledgePath = path.join(__dirname, "knowledge.txt");

if (!fs.existsSync(knowledgePath)) {
  console.error("Finner ikke knowledge.txt");
  console.error("Forventer den her:", knowledgePath);
  console.error("Legg knowledge.txt i samme mappe som index.js (server/).");
  process.exit(1);
}

const KNOWLEDGE = fs.readFileSync(knowledgePath, "utf8");

console.log("KNOWLEDGE file:", knowledgePath);
console.log("KNOWLEDGE length:", KNOWLEDGE.length);
console.log("Has Braastad?", KNOWLEDGE.includes("Braastad"));
console.log("Has Oppdalslinna?", KNOWLEDGE.includes("Oppdalslinna"));

/* OpenAI client */
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY mangler i environment.");
  console.warn("Lag server/.env med: OPENAI_API_KEY=din_nokkel");
  console.warn("Serveren kjorer fortsatt, men OpenAI-kall vil feile.");
}

const client = new OpenAI({ apiKey });

/*  Helpers  */
function normalize(s = "") {
  return String(s).toLowerCase().trim();
}

function isOfferQuestion(text) {
  const t = normalize(text);
  return (
    t.includes("hva tilbyr") ||
    t.includes("hva tilbyr dere") ||
    t.includes("hva selger") ||
    t.includes("hva selger dere") ||
    t.includes("hva kan jeg kjøpe") ||
    t.includes("hvilke produkter") ||
    t.includes("produktutvalg") ||
    t.includes("what do you sell") ||
    t.includes("what do you offer")
  );
}

function offerAnswer() {
  return (
    "Vi tilbyr hjemlevering av sesongbaserte dagligvarer fra lokale samarbeidsgårder 🍎🥕 " +
    "På testsiden finner du for eksempel oats (havre), red onions (rødløk), garlic (hvitløk), " +
    "potato (poteter) og carrots (gulrøtter). Utvalget kan variere med sesong.\n\n" +
    "Partnergård i demoen: Braastad Gaard, Oppdalslinna 242, 2740 Roa, Norway.\n\n" +
    "Vil du at jeg skal foreslå hva som passer best til middag, eller er du ute etter noe spesifikt?"
  );
}

function isFarmsQuestion(text) {
  const t = normalize(text);
  return (
    t.includes("partnering farms") ||
    t.includes("partnering farm") ||
    t.includes("partnergård") ||
    t.includes("gård") ||
    t.includes("farms") ||
    t.includes("farm")
  );
}

function farmsAnswer() {
  return (
    "Vi samarbeider med lokale gårder. På testsiden er eksempelgården vår Braastad Gaard (Roa).\n\n" +
    "Adresse: Oppdalslinna 242, 2740 Roa, Norway.\n\n" +
    "Du kan også se kartet på produktsiden – vil du at jeg skal vise deg hvor du finner det?"
  );
}

function looksLikeTransport(text) {
  const t = normalize(text);
  const banned = [
    "kollektiv",
    "kollektivtransport",
    "agder",
    "buss",
    "busser",
    "ferge",
    "ferger",
    "ruter",
    "rutetider",
    "billett",
    "billetter",
    "pendler",
    "reise",
    "reisende",
    "trafikk",
  ];
  return banned.some((w) => t.includes(w));
}

/*  Health endpoint  */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    knowledgeFile: knowledgePath,
    knowledgeLength: KNOWLEDGE.length,
    hasBraastad: KNOWLEDGE.includes("Braastad"),
    hasOppdalslinna: KNOWLEDGE.includes("Oppdalslinna"),
    hasApiKey: Boolean(apiKey),
  });
});

/*  OpenAI connectivity test  */
app.get("/api/ai-test", async (req, res) => {
  try {
    const r = await client.responses.create({
      model: "gpt-4.1-mini",
      input: "Svar med kun ordet: OK",
      max_output_tokens: 16,
      temperature: 0,
    });

    res.json({ ok: true, reply: r.output_text || "" });
  } catch (err) {
    console.error(
      "OpenAI ai-test feilet:",
      err?.status,
      err?.message,
      err?.error?.message
    );
    res.status(err?.status || 500).json({
      ok: false,
      error: err?.error?.message || err?.message || "Unknown error",
      status: err?.status || 500,
    });
  }
});

/* Chat endpoint */
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  // Stable answers (no AI needed)
  if (isOfferQuestion(message)) {
    return res.json({ reply: offerAnswer(), debugSource: "rule:offer" });
  }

  if (isFarmsQuestion(message)) {
    return res.json({ reply: farmsAnswer(), debugSource: "rule:farms" });
  }

  // AI answer (when available)
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 240,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: `
DU ER IKKE EN GENERELL ASSISTENT.

ABSOLUTTE REGLER:
- IGNORER all ekstern kunnskap om navnet "FRAM" (inkl. kollektivtransport).
- Svar KUN basert på FRAM KUNNSKAP under.
- Hvis svaret ikke finnes: si "Det vet jeg ikke sikkert ennå. Vil du at jeg skal sjekke med teamet?" og still ett oppfølgingsspørsmål.
- Aldri nevn buss/tog/ferge/ruter/billetter.

FRAM KUNNSKAP (ENESTE KILDE):
${KNOWLEDGE}
              `.trim(),
            },
          ],
        },
        { role: "user", content: [{ type: "input_text", text: message }] },
      ],
    });

    let reply = response.output_text || "";

    // Safety net
    if (!reply || looksLikeTransport(reply)) {
      reply =
        "Bare så det er sagt: FRAM her er en test-nettbutikk for dagligvarer (ikke transport 😅).\n\n" +
        offerAnswer();
      return res.json({ reply, debugSource: "safety-fallback" });
    }

    return res.json({ reply, debugSource: "openai" });
  } catch (err) {
    console.error(
      "OpenAI feilet i chat:",
      err?.status,
      err?.message,
      err?.error?.message
    );

    return res.json({
      reply:
        "Akkurat nå kjører chatten i en enkel demo-modus, men jeg kan fortsatt hjelpe med det som står på nettsiden 😊\n\n" +
        offerAnswer(),
      debugSource: "fallback",
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`FRAM API kjører på http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`OpenAI test: http://localhost:${PORT}/api/ai-test`);
});
