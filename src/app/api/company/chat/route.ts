import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const ROSTER_PATH = join(process.env.HOME || "", ".openclaw/shared/agent-roster.json");

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  personality: string;
}

// Load agent roster
function loadRoster(): Agent[] {
  try {
    const data = JSON.parse(readFileSync(ROSTER_PATH, "utf-8"));
    return data.agents || [];
  } catch {
    return [];
  }
}

// Generate chat between two agents using Ollama
async function generateChat(agent1: Agent, agent2: Agent): Promise<string> {
  const systemPrompt = `You are simulating a conversation between two AI agents:

Agent 1: ${agent1.name} (${agent1.role})
Personality: ${agent1.personality}

Agent 2: ${agent2.name} (${agent2.role})
Personality: ${agent2.personality}

Rules:
- Generate natural, in-character dialogue
- Keep responses brief (1-2 sentences each)
- Stay true to each agent's personality
- Make it feel like a casual office conversation
- Topics: work, projects, coffee, office life
- No markdown, no special formatting
- Max 3 exchanges total (6 messages)

Format each line as:
${agent1.name}: <message>
${agent2.name}: <message>
...repeat...

Generate the full conversation now:`;

  try {
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1:8b",
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || "";
  } catch (error) {
    console.error("Ollama chat error:", error);

    // Fallback conversation
    return `${agent1.name}: Hey ${agent2.name}, how's it going?
${agent2.name}: Not bad! Working on that new feature.
${agent1.name}: Nice. Let me know if you need any help.
${agent2.name}: Will do. Thanks!`;
  }
}

// Parse conversation into messages
function parseConversation(text: string) {
  const messages: Array<{ agent: string; name: string; text: string }> = [];
  const lines = text.split("\n").filter(l => l.trim());

  for (const line of lines) {
    // Match "Name: message" or "**Name**: message"
    const match = line.match(/^(?:\*\*)?([^:*]+?)(?:\*\*)?:\s*(.+)$/);
    if (match) {
      const name = match[1].trim();
      const text = match[2].trim();
      // Map name to agent ID
      const agent = loadRoster().find(a =>
        a.name.toLowerCase() === name.toLowerCase() ||
        a.id === name.toLowerCase()
      );

      if (agent) {
        messages.push({ agent: agent.id, name: agent.name, text });
      }
    }
  }

  return messages;
}

export async function POST(request: Request) {
  try {
    const { agent1, agent2 } = await request.json();

    if (!agent1 || !agent2) {
      return NextResponse.json(
        { error: "Both agent1 and agent2 are required" },
        { status: 400 }
      );
    }

    const roster = loadRoster();
    const a1 = roster.find(a => a.id === agent1);
    const a2 = roster.find(a => a.id === agent2);

    if (!a1 || !a2) {
      return NextResponse.json(
        { error: "One or both agents not found in roster" },
        { status: 404 }
      );
    }

    // Generate conversation
    const conversation = await generateChat(a1, a2);

    // Parse into messages
    const messages = parseConversation(conversation);

    // Stream response (simplified - just return all at once for now)
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate chat", detail: String(error) },
      { status: 500 }
    );
  }
}
