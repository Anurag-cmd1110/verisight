require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI, SchemaType, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const app = express();
const PORT = 5000;

// --- MIDDLEWARE ---
// Increased limit to 50mb to handle video frame uploads
// --- MIDDLEWARE ---
// Allow HUGE data for video frames (JSON + URL Encoded)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // <--- YOU MISSED THIS LINE

// Allow Frontend to talk to Backend
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));
// --- 1. DATABASE CONNECTION (MongoDB) ---
// Ensure you have MongoDB installed or use a cloud URI in .env
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/verisight')
  .then(() => console.log("✅ MongoDB Connected: Secure Storage Active"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// --- 2. USER SECURITY MODEL ---
const UserSchema = new mongoose.Schema({
  agentId: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Stores HASHED password
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// --- 3. AUTHENTICATION ROUTES ---

// REGISTER: Create new agent with Encrypted Password
app.post('/api/register', async (req, res) => {
  try {
    const { agentId, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ agentId });
    if (existingUser) return res.status(400).json({ error: "Agent ID already exists in system." });

    // 🔒 HASHING: Encrypt password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ agentId, password: hashedPassword });
    await newUser.save();

    res.json({ message: "Clearance Granted. Agent Registered." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Registration Failed." });
  }
});

// LOGIN: Verify Credentials
app.post('/api/login', async (req, res) => {
  try {
    const { agentId, password } = req.body;

    // Find User
    const user = await User.findOne({ agentId });
    if (!user) return res.status(400).json({ error: "Agent ID not found." });

    // 🔒 VERIFY: Compare entered password with stored Hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid Passkey." });

    // Generate Session Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

    res.json({ token, agentId: user.agentId, message: "Access Granted" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Authentication System Error." });
  }
});

// --- 4. FORENSIC AI SETUP (Gemini 2.5 Flash) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// STRICT JSON SCHEMA: Forces AI to return exact data structure
const analysisSchema = {
  description: "Forensic Video Analysis Report",
  type: SchemaType.OBJECT,
  properties: {
    isAuthentic: { type: SchemaType.BOOLEAN },
    score: { type: SchemaType.NUMBER, description: "0-100 Integrity Score" },
    summary: { type: SchemaType.STRING, description: "Executive forensic summary" },
    confidenceLevel: { type: SchemaType.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
    analysis: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          detail: { type: SchemaType.STRING },
          status: { type: SchemaType.STRING, enum: ["PASS", "WARN", "FAIL"] }
        },
        required: ["category", "confidence", "detail", "status"]
      }
    }
  },
  required: ["isAuthentic", "score", "summary", "confidenceLevel", "analysis"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // Stable Version
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ]
});

const PROMPT = `You are a Forensic Video Analyst.
Analyze the provided video frames and audio for digital manipulation.

RULES:
1. **Visuals:** Look for face warping, inconsistent lighting, and bad lip-sync.
2. **Audio:** Look for robotic artifacts or background noise mismatches.
3. **Text:** If you see "Deepfake", "Face Swap", or "AI Generated" text, INSTANTLY set score to 0 and status FAIL.

Return a strict JSON report based on the provided schema.`;

// --- 5. ANALYSIS ROUTE ---
app.post('/api/analyze', async (req, res) => {
  try {
    const { frames, audioBase64 } = req.body;
    const parts = [{ text: PROMPT }];
    
    // Add Images (Optimization: Send every 2nd frame to save bandwidth/quota)
    if (frames && frames.length > 0) {
      frames.forEach((f, index) => {
        if (index % 2 === 0) {
          parts.push({ 
            inlineData: { 
              data: f.base64, 
              mimeType: "image/jpeg" 
            } 
          });
        }
      });
    }

    // Add Audio
    if (audioBase64) {
      parts.push({ 
        inlineData: { 
          data: audioBase64, 
          mimeType: "audio/wav" 
        } 
      });
    }

    // Call Gemini
    const result = await model.generateContent(parts);
    const response = await result.response;
    
    // Parse and Return
    res.json(JSON.parse(response.text()));

  } catch (error) {
    console.error("Analysis Error:", error);
    // Handle Quota/Server Errors gracefully
    const msg = error.message.includes('429') 
      ? "Server Busy (Quota Exceeded). Please try again in a moment." 
      : error.message || "Internal Forensic Error";
      
    res.status(500).json({ error: msg });
  }
});

// --- 6. START SERVER ---
app.listen(PORT, () => console.log(`🚀 Forensic Server running on http://localhost:${PORT}`));