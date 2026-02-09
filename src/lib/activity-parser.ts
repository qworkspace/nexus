import fs from "fs";
import path from "path";
import { Activity, MessageEvent, ModelChangeEvent, TranscriptEvent } from "@/types/activity";

const SESSIONS_DIR = path.join(process.env.HOME || "", ".openclaw", "agents", "main", "sessions");

/**
 * Parse all session files and extract activities
 */
export async function parseTranscripts(options: {
  limit?: number;
  offset?: number;
  type?: string;
  status?: string;
  from?: Date;
  to?: Date;
  search?: string;
}): Promise<{ activities: Activity[]; total: number; hasMore: boolean }> {
  const {
    limit = 50,
    offset = 0,
    type,
    status,
    from,
    to,
    search,
  } = options;

  // Get all session files, sorted by modification time (newest first)
  const sessionFiles = getSessionFilesSorted();

  const activities: Activity[] = [];

  // Parse each session file until we have enough activities
  for (const sessionFile of sessionFiles) {
    const sessionId = path.basename(sessionFile, ".jsonl");
    const fileActivities = await parseSessionFile(sessionFile, sessionId);

    activities.push(...fileActivities);

    // Stop if we have enough total activities (before filtering)
    if (activities.length > limit + offset + 100) {
      break;
    }
  }

  // Filter activities
  const filteredActivities = filterActivities(activities, {
    type,
    status,
    from,
    to,
    search,
  });

  const total = filteredActivities.length;

  // Apply pagination after filtering
  const paginatedActivities = filteredActivities.slice(offset, offset + limit);

  return {
    activities: paginatedActivities,
    total,
    hasMore: offset + paginatedActivities.length < total,
  };
}

/**
 * Get session files sorted by modification time (newest first)
 */
function getSessionFilesSorted(): string[] {
  try {
    const files = fs.readdirSync(SESSIONS_DIR);

    // Filter only .jsonl files
    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

    // Get full paths
    const filePaths = jsonlFiles.map((f) => path.join(SESSIONS_DIR, f));

    // Sort by modification time (newest first)
    filePaths.sort((a, b) => {
      const statA = fs.statSync(a);
      const statB = fs.statSync(b);
      return statB.mtimeMs - statA.mtimeMs;
    });

    return filePaths;
  } catch (error) {
    console.error("Error reading sessions directory:", error);
    return [];
  }
}

/**
 * Parse a single session JSONL file and extract activities
 */
async function parseSessionFile(
  filePath: string,
  sessionId: string
): Promise<Activity[]> {
  const activities: Activity[] = [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event: TranscriptEvent = JSON.parse(line);
        const activity = extractActivityFromEvent(event, sessionId);

        if (activity) {
          activities.push(activity);
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }
  } catch (error) {
    console.error(`Error parsing session file ${filePath}:`, error);
  }

  return activities;
}

/**
 * Extract an activity from a transcript event
 */
function extractActivityFromEvent(
  event: TranscriptEvent,
  sessionId: string
): Activity | null {
  const { type, id, timestamp } = event;

  // Model changes
  if (type === "model_change") {
    const modelEvent = event as ModelChangeEvent;
    return {
      id: `model-${id}`,
      timestamp,
      type: "model",
      action: "changed",
      title: `Model changed to ${modelEvent.modelId}`,
      description: null,
      metadata: JSON.stringify({
        provider: modelEvent.provider,
        modelId: modelEvent.modelId,
      }),
      duration: null,
      status: "success",
      tokensIn: null,
      tokensOut: null,
      tokensCacheRead: null,
      tokensCacheWrite: null,
      cost: null,
      model: modelEvent.modelId,
      sessionId,
    };
  }

  // Messages (assistant messages with tool calls or content)
  if (type === "message") {
    const messageEvent = event as MessageEvent;

    // Only process assistant messages
    if (messageEvent.message.role !== "assistant") {
      return null;
    }

    const content = messageEvent.message.content || [];

    // Check for tool calls
    const toolCalls = content.filter(
      (c) => c.type === "toolCall" || c.type === "tool_use"
    );

    if (toolCalls.length > 0) {
      // Create an activity for the first tool call
      const toolCall = toolCalls[0] as { name?: string; arguments?: Record<string, unknown> };
      const args = toolCall.arguments || {};
      const toolName = toolCall.name || 'unknown';

      // Determine activity type based on tool name
      let activityType: Activity["type"] = "tool";
      if (toolName === "cron") activityType = "cron";
      else if (toolName === "spawn") activityType = "spawn";
      else if (toolName === "exec" || toolName === "process") activityType = "task";
      else if (toolName === "file" || toolName === "read" || toolName === "write") activityType = "file";
      else if (toolName === "search" || toolName === "web_search") activityType = "search";

      return {
        id: `tool-${id}`,
        timestamp,
        type: activityType,
        action: "called",
        title: `Tool: ${toolName}`,
        description: `Called ${toolName}` + (args ? ` with ${Object.keys(args).length} arguments` : ""),
        metadata: JSON.stringify({
          toolName,
          args,
        }),
        duration: null,
        status: "success",
        tokensIn: messageEvent.usage?.input || null,
        tokensOut: messageEvent.usage?.output || null,
        tokensCacheRead: messageEvent.usage?.cacheRead || null,
        tokensCacheWrite: messageEvent.usage?.cacheWrite || null,
        cost: messageEvent.cost?.total || null,
        model: messageEvent.model || null,
        sessionId,
      };
    }

    // Check for text content (assistant response)
    const textBlocks = content.filter((c) => c.type === "text");
    if (textBlocks.length > 0) {
      const textBlock = textBlocks[0] as { text?: string };
      const text = textBlock.text?.trim();

      if (text && text.length > 0) {
        return {
          id: `message-${id}`,
          timestamp,
          type: "message",
          action: "sent",
          title: "Assistant response",
          description: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
          metadata: null,
          duration: null,
          status: "success",
          tokensIn: messageEvent.usage?.input || null,
          tokensOut: messageEvent.usage?.output || null,
          tokensCacheRead: messageEvent.usage?.cacheRead || null,
          tokensCacheWrite: messageEvent.usage?.cacheWrite || null,
          cost: messageEvent.cost?.total || null,
          model: messageEvent.model || null,
          sessionId,
        };
      }
    }
  }

  // Custom events (cron runs, etc.)
  if (type === "custom") {
    const customEvent = event as TranscriptEvent & { customType: string; data?: Record<string, unknown> };

    if (customEvent.customType === "cron-execution") {
      const data = customEvent.data || {};
      return {
        id: `cron-${id}`,
        timestamp,
        type: "cron",
        action: "completed",
        title: `Cron: ${data.jobName || "Unknown job"}`,
        description: String(data.status || ''),
        metadata: JSON.stringify(data),
        duration: data.durationMs ? Number(data.durationMs) : null,
        status: data.status === "error" ? "error" : "success",
        tokensIn: null,
        tokensOut: null,
        tokensCacheRead: null,
        tokensCacheWrite: null,
        cost: null,
        model: null,
        sessionId,
      };
    }
  }

  return null;
}

/**
 * Filter activities based on criteria
 */
function filterActivities(
  activities: Activity[],
  filters: {
    type?: string;
    status?: string;
    from?: Date;
    to?: Date;
    search?: string;
  }
): Activity[] {
  let filtered = activities;

  // Type filter
  if (filters.type) {
    filtered = filtered.filter((a) => a.type === filters.type);
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter((a) => a.status === filters.status);
  }

  // Date range filter
  if (filters.from) {
    filtered = filtered.filter((a) => new Date(a.timestamp) >= filters.from!);
  }

  if (filters.to) {
    filtered = filtered.filter((a) => new Date(a.timestamp) <= filters.to!);
  }

  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter((a) => {
      return (
        a.title.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower) ||
        JSON.stringify(a.metadata).toLowerCase().includes(searchLower)
      );
    });
  }

  return filtered;
}

/**
 * Export activities to CSV
 */
export function exportToCSV(activities: Activity[]): string {
  const headers = [
    "Timestamp",
    "Type",
    "Action",
    "Title",
    "Description",
    "Status",
    "Duration",
    "Tokens In",
    "Tokens Out",
    "Cache Read",
    "Cache Write",
    "Cost",
    "Model",
    "Session ID",
  ];

  const rows = activities.map((a) => [
    a.timestamp,
    a.type,
    a.action,
    `"${a.title.replace(/"/g, '""')}"`,
    `"${(a.description || "").replace(/"/g, '""')}"`,
    a.status,
    a.duration || "",
    a.tokensIn || "",
    a.tokensOut || "",
    a.tokensCacheRead || "",
    a.tokensCacheWrite || "",
    a.cost || "",
    a.model || "",
    a.sessionId || "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  return csvContent;
}

/**
 * Export activities to JSON
 */
export function exportToJSON(activities: Activity[]): string {
  return JSON.stringify(activities, null, 2);
}
