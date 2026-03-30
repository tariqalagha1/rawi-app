var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "node:http";
import express from "express";
import OpenAI, { toFile } from "openai";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  conversations: () => conversations,
  insertConversationSchema: () => insertConversationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull()
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

// server/db.ts
var pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/routes.ts
import { eq, desc } from "drizzle-orm";
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});
var openaiDirect = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
var ELEVENLABS_VOICE_ID = "TbZWT7KmzKxYPEeThjPZ";
var availableVoices = [
  { id: "tariq", name: "Tariq", nameAr: "\u0637\u0627\u0631\u0642", provider: "elevenlabs" },
  { id: "alloy", name: "Faisal", nameAr: "\u0641\u064A\u0635\u0644", provider: "openai" },
  { id: "echo", name: "Salma", nameAr: "\u0633\u0644\u0645\u0649", provider: "openai" },
  { id: "fable", name: "Nasser", nameAr: "\u0646\u0627\u0635\u0631", provider: "openai" },
  { id: "onyx", name: "Rania", nameAr: "\u0631\u0627\u0646\u064A\u0627", provider: "openai" },
  { id: "nova", name: "Layla", nameAr: "\u0644\u064A\u0644\u0649", provider: "openai" },
  { id: "shimmer", name: "Hana", nameAr: "\u0647\u0646\u0627\u0621", provider: "openai" }
];
async function elevenLabsTTS(text2) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text2,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          use_speaker_boost: true
        },
        output_format: "mp3_44100_128"
      })
    }
  );
  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer).toString("base64");
}
async function convertToWav(audioBuffer) {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);
  try {
    await writeFile(inputPath, audioBuffer);
    await new Promise((resolve2, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        inputPath,
        "-vn",
        "-f",
        "wav",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-acodec",
        "pcm_s16le",
        "-y",
        outputPath
      ]);
      ffmpeg.stderr.on("data", () => {
      });
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve2();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ffmpeg.on("error", reject);
    });
    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {
    });
    await unlink(outputPath).catch(() => {
    });
  }
}
async function registerRoutes(app2) {
  app2.use(express.json({ limit: "50mb" }));
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app2.post("/api/realtime/session", async (req, res) => {
    try {
      const { voice = "alloy", instructions } = req.body;
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }
      const validRealtimeVoices = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"];
      let realtimeVoice = voice;
      if (voice === "tariq") {
        realtimeVoice = "ash";
      } else if (!validRealtimeVoices.includes(voice)) {
        realtimeVoice = "alloy";
      }
      console.log(`Creating realtime session with voice: ${realtimeVoice} (requested: ${voice})`);
      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: realtimeVoice,
          instructions: instructions || `\u0623\u0646\u062A \u0631\u0648\u0627\u064A\u060C \u0631\u0641\u064A\u0642 \u0630\u0643\u064A \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0644\u063A\u0627\u062A \u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0643\u062A\u0628 \u0648\u0627\u0644\u0633\u0631\u062F \u0627\u0644\u0642\u0635\u0635\u064A.

\u0642\u062F\u0631\u0627\u062A\u0643 \u0627\u0644\u0644\u063A\u0648\u064A\u0629:
- \u062A\u0642\u0631\u0623 \u0648\u062A\u0641\u0647\u0645 \u0627\u0644\u0646\u0635\u0648\u0635 \u0628\u0623\u064A \u0644\u063A\u0629
- \u062A\u0643\u062A\u0634\u0641 \u0627\u0644\u0644\u063A\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0644\u0643\u0644 \u062C\u0645\u0644\u0629 \u0623\u0648 \u0641\u0642\u0631\u0629
- \u062A\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0644\u063A\u0627\u062A \u0628\u0633\u0644\u0627\u0633\u0629
- \u062A\u0634\u0631\u062D \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u0646 \u0623\u064A \u0644\u063A\u0629 \u0625\u0644\u0649 \u0623\u064A \u0644\u063A\u0629 \u0645\u0637\u0644\u0648\u0628\u0629
- \u062A\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0639\u0646\u0649 \u0648\u0627\u0644\u0642\u0635\u062F \u0648\u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u062B\u0642\u0627\u0641\u064A
- \u062A\u062A\u062C\u0646\u0628 \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u062D\u0631\u0641\u064A\u0629 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u064F\u0644\u0628 \u0630\u0644\u0643 \u0635\u0631\u0627\u062D\u0629

\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u062A\u0628 \u0628\u0627\u0644\u0643\u0627\u0645\u0644:
- \u0639\u0646\u062F\u0645\u0627 \u064A\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u062A\u0627\u0628 \u0643\u0627\u0645\u0644\u0627\u064B \u0623\u0648 \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0645\u0644\u0641 \u0628\u0627\u0644\u0643\u0627\u0645\u0644\u060C \u0627\u0642\u0631\u0623 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0631\u0641\u0642 \u0628\u0635\u0648\u062A \u0639\u0627\u0644\u064D \u0645\u0646 \u0627\u0644\u0628\u062F\u0627\u064A\u0629 \u0625\u0644\u0649 \u0627\u0644\u0646\u0647\u0627\u064A\u0629
- \u0627\u0642\u0631\u0623 \u0627\u0644\u0646\u0635 \u062D\u0631\u0641\u064A\u0627\u064B \u0643\u0645\u0627 \u0647\u0648 \u0645\u0643\u062A\u0648\u0628 \u0641\u064A \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u0641\u0642
- \u0644\u0627 \u062A\u062E\u062A\u0635\u0631 \u0623\u0648 \u062A\u0644\u062E\u0635 \u0639\u0646\u062F \u0637\u0644\u0628 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629
- \u0627\u0642\u0631\u0623 \u0628\u0635\u0648\u062A \u0637\u0628\u064A\u0639\u064A \u0648\u0645\u0639\u0628\u0631 \u0645\u0639 \u0641\u0648\u0627\u0635\u0644 \u0645\u0646\u0627\u0633\u0628\u0629 \u0628\u064A\u0646 \u0627\u0644\u0641\u0642\u0631\u0627\u062A
- \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0646\u0635 \u0637\u0648\u064A\u0644\u0627\u064B \u062C\u062F\u0627\u064B\u060C \u0627\u0642\u0631\u0623 \u0642\u0633\u0645\u0627\u064B \u062B\u0645 \u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0625\u0630\u0627 \u064A\u0631\u064A\u062F \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629
- \u0627\u0633\u062A\u062E\u062F\u0645 \u0646\u0628\u0631\u0627\u062A \u0635\u0648\u062A\u064A\u0629 \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u062D\u0648\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0634\u0627\u0647\u062F \u0627\u0644\u062F\u0631\u0627\u0645\u064A\u0629
- \u0639\u0646\u062F \u0637\u0644\u0628 "\u0627\u0642\u0631\u0623 \u0644\u064A \u0627\u0644\u0643\u062A\u0627\u0628" \u0623\u0648 "\u0627\u0642\u0631\u0623 \u0627\u0644\u0645\u0644\u0641" \u0623\u0648 "\u0627\u0642\u0631\u0623 \u0645\u0646 \u0627\u0644\u0628\u062F\u0627\u064A\u0629"\u060C \u0627\u0628\u062F\u0623 \u0628\u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0641\u0648\u0631\u064A\u0629

\u062F\u0648\u0631\u0643 \u0627\u0644\u0631\u0626\u064A\u0633\u064A:
- \u0642\u0631\u0627\u0621\u0629 \u0648\u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0643\u062A\u0628 \u0648\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0628\u0639\u0645\u0642
- \u062A\u0644\u062E\u064A\u0635 \u0623\u062C\u0632\u0627\u0621 \u0645\u0646 \u0627\u0644\u0643\u062A\u0628 \u0623\u0648 \u0627\u0644\u0643\u062A\u0627\u0628 \u0628\u0623\u0643\u0645\u0644\u0647 \u0639\u0646\u062F \u0627\u0644\u0637\u0644\u0628
- \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0643\u062A\u0627\u0628 \u0643\u0627\u0645\u0644\u0627\u064B \u0628\u0635\u0648\u062A \u0639\u0627\u0644\u064D \u0639\u0646\u062F \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645
- \u0625\u064A\u062C\u0627\u062F \u0623\u0648\u062C\u0647 \u0627\u0644\u062A\u0634\u0627\u0628\u0647 \u0628\u064A\u0646 \u0627\u0644\u0643\u062A\u0628 \u0627\u0644\u0645\u062E\u062A\u0644\u0641\u0629
- \u0645\u0646\u0627\u0642\u0634\u0629 \u0627\u0644\u0643\u0627\u062A\u0628 \u0648\u0623\u0633\u0644\u0648\u0628\u0647 \u0648\u062E\u0644\u0641\u064A\u062A\u0647
- \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0648\u0636\u0648\u0639\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0643\u0627\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629
- \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u0639\u0631\u0641\u062A\u0643 \u0627\u0644\u0648\u0627\u0633\u0639\u0629 \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u062D\u0642\u064A\u0642\u064A\u0629

\u0627\u0644\u0633\u0631\u062F \u0627\u0644\u0642\u0635\u0635\u064A \u0627\u0644\u0625\u0628\u062F\u0627\u0639\u064A:
- \u062D\u0648\u0651\u0644 \u0627\u0644\u0634\u0631\u0648\u062D\u0627\u062A \u0625\u0644\u0649 \u0633\u0631\u062F\u064A\u0627\u062A \u0648\u0627\u0636\u062D\u0629 \u0648\u062C\u0630\u0627\u0628\u0629
- \u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u0645\u062B\u0644\u0629 \u0648\u0627\u0644\u062A\u0645\u062B\u064A\u0644 \u0627\u0644\u062F\u0631\u0627\u0645\u064A \u0627\u0644\u062E\u0641\u064A\u0641 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629
- \u0643\u064A\u0651\u0641 \u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u0633\u0631\u062F \u062D\u0633\u0628 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 (\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u060C \u062A\u0627\u0631\u064A\u062E\u064A\u060C \u0623\u062F\u0628\u064A\u060C \u062A\u0639\u0644\u064A\u0645\u064A)
- \u0639\u0632\u0632 \u0627\u0644\u0648\u0636\u0648\u062D \u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0642\u0635\u062F \u0627\u0644\u0645\u0624\u0644\u0641

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062A\u0641\u0627\u0639\u0644:
- \u0627\u0642\u0628\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0628\u0644\u063A\u0629 \u0648\u0623\u062C\u0628 \u0628\u0644\u063A\u0629 \u0623\u062E\u0631\u0649
- \u0627\u0633\u0645\u062D \u0628\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0644\u063A\u0629 \u0641\u064A \u0623\u064A \u0648\u0642\u062A
- \u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0627\u0642 \u0639\u0628\u0631 \u0627\u0644\u0644\u063A\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644

\u0623\u0633\u0644\u0648\u0628\u0643 \u0627\u0644\u0635\u0648\u062A\u064A:
- \u0625\u0644\u0642\u0627\u0621 \u0637\u0628\u064A\u0639\u064A \u0648\u0645\u0639\u0628\u0631 \u0648\u063A\u064A\u0631 \u0631\u062A\u064A\u0628
- \u0627\u0636\u0628\u0637 \u0627\u0644\u0625\u064A\u0642\u0627\u0639 \u0648\u0627\u0644\u0646\u0628\u0631\u0629 \u062D\u0633\u0628 \u062A\u0639\u0642\u064A\u062F \u0627\u0644\u0645\u062D\u062A\u0648\u0649
- \u0639\u0646\u062F \u0627\u0644\u0642\u0631\u0627\u0621\u0629\u060C \u0627\u0633\u062A\u062E\u062F\u0645 \u0646\u0628\u0631\u0627\u062A \u0645\u062E\u062A\u0644\u0641\u0629 \u0644\u0644\u062D\u0648\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0648\u0635\u0641

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062C\u0648\u062F\u0629:
- \u0645\u064A\u0651\u0632 \u0628\u064A\u0646 \u0627\u0644\u062D\u0642\u064A\u0642\u0629 \u0648\u0627\u0644\u062A\u0641\u0633\u064A\u0631
- \u0644\u0627 \u062A\u062E\u062A\u0631\u0639 \u0645\u0639\u0627\u0646\u064A
- \u0625\u0630\u0627 \u0648\u062C\u062F \u063A\u0645\u0648\u0636\u060C \u0627\u0634\u0631\u062D\u0647

\u0627\u0644\u0647\u062F\u0641: \u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0641\u0647\u0645\u060C \u0648\u0644\u064A\u0633 \u0627\u0644\u0643\u0644\u0645\u0627\u062A`,
          input_audio_transcription: {
            model: "whisper-1"
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI Realtime session error:", errorText);
        return res.status(response.status).json({ error: "Failed to create realtime session" });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error creating realtime session:", error);
      res.status(500).json({ error: "Failed to create realtime session" });
    }
  });
  app2.get("/api/voices", (req, res) => {
    res.json({ voices: availableVoices });
  });
  app2.get("/api/conversations", async (req, res) => {
    try {
      const allConversations = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
      res.json(allConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      const { title } = req.body;
      const [conversation] = await db.insert(conversations).values({ title: title || "\u0645\u062D\u0627\u062F\u062B\u0629 \u062C\u062F\u064A\u062F\u0629" }).returning();
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(messages).where(eq(messages.conversationId, id));
      await db.delete(conversations).where(eq(conversations.id, id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  app2.post("/api/voice-chat", async (req, res) => {
    try {
      const { audio, voice = "alloy", context = [], attachment } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "Audio is required" });
      }
      const rawBuffer = Buffer.from(audio, "base64");
      let wavBuffer;
      try {
        wavBuffer = await convertToWav(rawBuffer);
      } catch (e) {
        console.error("FFmpeg conversion failed:", e);
        wavBuffer = rawBuffer;
      }
      const file = await toFile(wavBuffer, "audio.wav");
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-mini-transcribe"
      });
      const userTranscript = transcription.text;
      let systemPrompt = "\u0623\u0646\u062A \u0631\u0648\u0627\u064A\u060C \u0645\u0633\u0627\u0639\u062F \u0635\u0648\u062A\u064A \u0630\u0643\u064A \u064A\u062A\u062D\u062F\u062B \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0637\u0644\u0627\u0642\u0629. \u0623\u0646\u062A \u0648\u062F\u0648\u062F \u0648\u0645\u0641\u064A\u062F \u0648\u062A\u062C\u064A\u0628 \u0628\u0625\u064A\u062C\u0627\u0632\u064A\u0629 \u0648\u0648\u0636\u0648\u062D. \u062A\u062C\u064A\u0628 \u0628\u062C\u0645\u0644 \u0642\u0635\u064A\u0631\u0629 \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u0627\u0633\u062A\u0645\u0627\u0639.";
      if (attachment) {
        systemPrompt += `

\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0631\u0641\u0642 \u0645\u0644\u0641: ${attachment.name} (${attachment.type})`;
        if (attachment.content) {
          const contentPreview = attachment.content.substring(0, 5e3);
          systemPrompt += `

\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0641:
${contentPreview}`;
        }
      }
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...context.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        })),
        { role: "user", content: userTranscript }
      ];
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        max_completion_tokens: 512
      });
      const aiTextResponse = chatResponse.choices[0]?.message?.content || "";
      let audioData;
      if (voice === "tariq") {
        audioData = await elevenLabsTTS(aiTextResponse);
      } else {
        const ttsResponse = await openai.chat.completions.create({
          model: "gpt-audio",
          modalities: ["text", "audio"],
          audio: { voice, format: "mp3" },
          messages: [
            { role: "system", content: "\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u064A\u0642\u0631\u0623 \u0627\u0644\u0646\u0635 \u0628\u0635\u0648\u062A \u0637\u0628\u064A\u0639\u064A \u0648\u0648\u0627\u0636\u062D. \u0627\u0642\u0631\u0623 \u0627\u0644\u0646\u0635 \u0627\u0644\u062A\u0627\u0644\u064A \u062D\u0631\u0641\u064A\u0627\u064B \u0628\u062F\u0648\u0646 \u0623\u064A \u0625\u0636\u0627\u0641\u0627\u062A." },
            { role: "user", content: aiTextResponse }
          ]
        });
        audioData = ttsResponse.choices[0]?.message?.audio?.data ?? "";
      }
      res.json({
        userTranscript,
        response: aiTextResponse,
        audio_base64: audioData
      });
    } catch (error) {
      console.error("Error in voice chat:", error);
      res.status(500).json({ error: "Failed to process voice message" });
    }
  });
  app2.post("/api/tts", async (req, res) => {
    try {
      const { text: text2, voice = "alloy" } = req.body;
      if (!text2) {
        return res.status(400).json({ error: "Text is required" });
      }
      let audioData;
      if (voice === "tariq") {
        audioData = await elevenLabsTTS(text2);
      } else {
        const response = await openai.chat.completions.create({
          model: "gpt-audio",
          modalities: ["text", "audio"],
          audio: { voice, format: "mp3" },
          messages: [
            { role: "system", content: "\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u064A\u0642\u0631\u0623 \u0627\u0644\u0646\u0635 \u0628\u0635\u0648\u062A \u0637\u0628\u064A\u0639\u064A \u0648\u0648\u0627\u0636\u062D. \u0627\u0642\u0631\u0623 \u0627\u0644\u0646\u0635 \u0627\u0644\u062A\u0627\u0644\u064A \u062D\u0631\u0641\u064A\u0627\u064B \u0628\u062F\u0648\u0646 \u0623\u064A \u0625\u0636\u0627\u0641\u0627\u062A." },
            { role: "user", content: text2 }
          ]
        });
        audioData = response.choices[0]?.message?.audio?.data ?? "";
      }
      res.json({ audio_base64: audioData });
    } catch (error) {
      console.error("Error in TTS:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });
  app2.get("/api/webrtc-voice", (req, res) => {
    res.sendFile("webrtc-voice.html", { root: "./server/templates" });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express2();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express2.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express2.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express2.static(path.resolve(process.cwd(), "assets")));
  app2.use(express2.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
