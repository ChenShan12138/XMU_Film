
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ScriptLine } from "../types";

// 优先从 process.env 获取，其次从 window 对象获取
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  // @ts-ignore
  return window.process?.env?.API_KEY || "";
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const generateScript = async (genre: string, idea: string): Promise<{ title: string; script: ScriptLine[] }> => {
  if (!apiKey) {
    console.error("Critical: API_KEY is missing.");
    return { title: '未配置 API KEY', script: [] };
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `根据题材 "${genre}" 和创意 "${idea}" 生成一个吸引人的项目标题和一段4行的短剧本（中文）。
    返回一个 JSON 对象，包含 "title" (字符串) 和 "script" (数组)。
    剧本数组每个对象包含：id, character, dialogue, cameraAngle (Wide, Medium, Close-up, or Over-the-shoulder), action。
    使用一致的角色名称。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                character: { type: Type.STRING },
                dialogue: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                action: { type: Type.STRING },
              },
              required: ["id", "character", "dialogue", "cameraAngle", "action"]
            }
          }
        },
        required: ["title", "script"]
      }
    }
  });

  const text = response.text;
  if (!text) return { title: '未命名项目', script: [] };

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse script", e);
    return { title: '解析失败项目', script: [] };
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  if (!apiKey) return 'https://picsum.photos/1280/720';

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Unity Built-in Render Pipeline 3D scene style, game engine look, simple clean textures, professional lighting, 3D character asset style: ${prompt}` },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  
  return 'https://picsum.photos/1280/720';
};
