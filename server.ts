import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Persistent cloud storage directory
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "cloud_store.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore(): Record<string, any> {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(content || "{}");
    }
  } catch (err) {
    console.error("Error reading cloud store:", err);
  }
  return {};
}

function saveStore(data: Record<string, any>) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing cloud store:", err);
  }
}

// Lazy Gemini API client
let genAIClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment");
    }
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Cloud Sync: Get data by User ID or Sync Key
app.get("/api/cloud/data/:userId", (req, res) => {
  const { userId } = req.params;
  const store = loadStore();
  const userData = store[userId];
  if (!userData) {
    return res.json({ success: true, data: null, message: "No data found for this identifier" });
  }
  return res.json({ success: true, data: userData });
});

// Cloud Sync: Save data by User ID or Sync Key
app.post("/api/cloud/sync", (req, res) => {
  const { userId, sessions, tasks, settings, lastSyncedAt } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId is required" });
  }

  const store = loadStore();
  store[userId] = {
    userId,
    sessions: sessions || [],
    tasks: tasks || [],
    settings: settings || {},
    updatedAt: new Date().toISOString(),
    clientLastSyncedAt: lastSyncedAt || new Date().toISOString(),
  };
  saveStore(store);

  return res.json({
    success: true,
    serverTime: new Date().toISOString(),
    message: "Dữ liệu đã được đồng bộ lên Cloud thành công!",
  });
});

// AI Meeting Minutes & Task Assignment Generator
app.post("/api/ai/meeting-minutes", async (req, res) => {
  try {
    const { noteContent, sessionTitle, attendees, extraNotes } = req.body;

    if (!noteContent || typeof noteContent !== "string") {
      return res.status(400).json({ error: "Nội dung ghi chú là bắt buộc" });
    }

    const ai = getGemini();

    const prompt = `
Bạn là một Thư ký điều hành và Chuyên gia Quản lý Dự án cao cấp.
Nhiệm vụ của bạn là dựa vào các ghi chú thô của phiên làm việc/cuộc họp dưới đây để soạn thảo một "Biên Bản Họp Chuyên Nghiệp" (Meeting Minutes) và trích xuất "Bảng Phân Công Nhiệm Vụ" (Action Items & Task Assignment) với thời hạn (deadline) và người chịu trách nhiệm rõ ràng.

Thông tin đầu vào:
- Tiêu đề phiên họp: ${sessionTitle || "Cuộc họp nội bộ"}
- Thành phần tham gia: ${attendees || "Không ghi rõ"}
- Ghi chú bổ sung: ${extraNotes || "Không có"}
- Nội dung ghi chép thô:
"""
${noteContent}
"""

HÃY PHẢN HỒI DƯỚI DẠNG JSON với cấu trúc chính xác sau:
{
  "meetingTitle": "Tiêu đề cuộc họp chuẩn hóa",
  "meetingDate": "Ngày giờ cuộc họp (dự đoán hoặc thời điểm hiện tại định dạng YYYY-MM-DD)",
  "attendees": ["Tên người tham gia 1", "Tên người tham gia 2"],
  "summary": "Tóm tắt ngắn gọn 2-3 câu về mục tiêu và tinh thần chính của cuộc họp",
  "discussionPoints": [
    "Điểm thảo luận chính 1",
    "Điểm thảo luận chính 2"
  ],
  "decisions": [
    "Quyết định / Kết luận đã được thống nhất 1",
    "Quyết định / Kết luận đã được thống nhất 2"
  ],
  "actionItems": [
    {
      "task": "Tên công việc cụ thể, bắt đầu bằng động từ hành động",
      "assignee": "Tên người/đầu mối chịu trách nhiệm chính",
      "deadline": "Thời hạn hoàn thành (YYYY-MM-DD hoặc mốc thời gian rõ ràng)",
      "priority": "high | medium | low",
      "notes": "Tiêu chí nghiệm thu hoặc lưu ý thêm"
    }
  ],
  "markdownReport": "Văn bản Biên bản họp hoàn chỉnh trình bày theo chuẩn hành chính/doanh nghiệp bằng Markdown đẹp mắt (gồm đầy đủ Quốc hiệu/Tiêu ngữ hoặc Tiêu đề công ty, Thời gian, Thành phần, Nội dung, Kết luận, Bảng giao việc có Deadline)."
}

Lưu ý:
- Nếu ghi chú không ghi rõ ngày hoặc người làm, hãy suy luận logic từ ngữ cảnh hoặc ghi "Trưởng nhóm", "Đầu mối kỹ thuật",... và deadline hợp lý trong vòng 3-7 ngày tới.
- Độ ưu tiên ("priority") bắt buộc là một trong 3 giá trị: "high", "medium", "low".
- Phản hồi thuần túy bằng tiếng Việt chuẩn mực, chuyên nghiệp.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không nhận được phản hồi từ AI");
    }

    const parsed = JSON.parse(text);
    return res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error("Meeting minutes AI error:", err);
    return res.status(500).json({
      error: "Không thể tạo biên bản họp bằng AI",
      details: err.message,
    });
  }
});

// AI Quick Task Extractor
app.post("/api/ai/extract-tasks", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGemini();
    const prompt = `
Phân tích đoạn ghi chú sau đây và trích xuất toàn bộ các đầu việc cần làm (Todo / Tasks), cùng với người phụ trách (assignee) và hạn chót (deadline) nếu có.

Đoạn văn bản:
"""
${text}
"""

Trả về định dạng JSON:
{
  "tasks": [
    {
      "title": "Tên công việc",
      "assignee": "Người chịu trách nhiệm (hoặc 'Tôi' nếu không nêu rõ)",
      "dueDate": "YYYY-MM-DD hoặc null nếu không xác định",
      "priority": "high" | "medium" | "low",
      "notes": "Mô tả chi tiết hoặc ghi chú"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Extract tasks error:", err);
    return res.status(500).json({ error: "Không thể trích xuất công việc", details: err.message });
  }
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
