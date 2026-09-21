export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY 환경변수가 없습니다." });
  }

  const { text, targetLanguage = "중국어" } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "번역할 text가 필요합니다." });
  }

  const instruction =
    "당신은 여행 통역사입니다. 한국어 문장을 " +
    targetLanguage +
    "로만 번역하세요. 설명이나 해설은 하지 마세요.";

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
          input: instruction + "\n\n문장: " + text,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini API 호출에 실패했습니다.",
      });
    }

    return res.status(200).json({
      text: data.output_text || "",
      model: data.model || process.env.GEMINI_MODEL || "gemini-3.8-flash",
    });
  } catch (error) {
    return res.status(500).json({ error: "Gemini 서버 연결에 실패했습니다." });
  }
}
