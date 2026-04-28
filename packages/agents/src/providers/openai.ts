// OpenAI provider singleton
// Ref: modulajar-master-v3.jsx — AI: OpenAI GPT-4o (switched from Anthropic)
import OpenAI from "openai";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"] ?? "";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    _client = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _client;
}

export type Model = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";

export interface AgentRunOptions {
  model?: Model;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export interface AgentRunResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costIdr: number;
}
