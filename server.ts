import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Helper to initialize GoogleGenAI lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is missing or not configured. Please locate the Settings > Secrets panel and add your key.");
  }
  
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API endpoint for resetting dev status
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API endpoint for breaking down tasks with Gemini
  app.post("/api/task/breakdown", async (req, res): Promise<any> => {
    try {
      const { taskInput, condition, subStepFocus } = req.body;

      if (!taskInput || typeof taskInput !== "string" || !taskInput.trim()) {
        return res.status(400).json({ error: "Task description is required." });
      }

      const client = getGeminiClient();

      // Custom framing depending on selected neurodiverse profile for custom wording
      let conditionInstruction = "";
      if (condition === "ADHD") {
        conditionInstruction = "Format steps to be extremely bite-sized, direct, and under 10 minutes each. Minimize cognitive load. Use encouraging, positive, and action-oriented verbs.";
      } else if (condition === "Autism") {
        conditionInstruction = "Format steps with unambiguous, highly literal terms free of metaphors or social idioms. Provide clear criteria for when each step is 'done'.";
      } else if (condition === "Dyslexia") {
        conditionInstruction = "Use simple, clear vocabulary and shorter sentences. Optimize readability of titles in steps.";
      } else if (condition === "Dyscalculia") {
        conditionInstruction = "Provide clear visual metaphors or simple relative terms (e.g. 'short duration', 'medium check') rather than overly complex numeric sub-intervals, keeping durations strictly rounded to easy integers like 5 or 10.";
      } else if (condition === "Executive Dysfunction") {
        conditionInstruction = "Provide a warm, supportive first step that removes initial friction—focusing purely on 'starting' without any fear (e.g. 'Sit down and open your book' or 'Just get the item out').";
      } else {
        conditionInstruction = "Break the task into sequential, clear, achievable milestones.";
      }

      let prompt = `Break down the following task/goal: "${taskInput}".\n${conditionInstruction}\n`;
      if (subStepFocus) {
        prompt += `Special request: The user has requested to break the specific step "${subStepFocus}" into even smaller actions. Make these micro-steps even simpler and highly actionable.`;
      }

      prompt += `\nReturn a list of 3 to 6 micro-steps. Each step must have concrete advice under 10 minutes total. Avoid generic steps.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are FocusFlow, an expert, supportive neurodivergent learning coach. Your job is to break overwhelming tasks into micro-tasks (<10min each) that prevent task paralysis, sensory overload, and executive block.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { 
                      type: Type.STRING, 
                      description: "The concrete micro-step instruction" 
                    },
                    minutes: { 
                      type: Type.INTEGER, 
                      description: "The duration of this step in minutes (1 to 10 max)" 
                    },
                    visualMetaphor: {
                      type: Type.STRING,
                      description: "A short non-numeric phrase indicating how long or big this is (e.g., 'tiny sip', 'short step', 'medium piece') for dyscalculia visual timers."
                    }
                  },
                  required: ["text", "minutes"]
                }
              }
            },
            required: ["steps"]
          }
        }
      });

      const text = response.text || "{}";
      const resultObj = JSON.parse(text);

      res.json(resultObj);
    } catch (e: any) {
      console.error("AI breakdown error:", e);
      res.status(500).json({ 
        error: e.message || "An unexpected error occurred during AI breakdown.",
        needsConfig: e.message?.includes("GEMINI_API_KEY") 
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FocusFlow] Fullstack server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server failed to start:", err);
});
