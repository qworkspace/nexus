import * as fs from 'fs';
import * as path from 'path';

// Task type definitions
export type TaskType = 'coding' | 'qa' | 'analysis' | 'debug' | 'creative' | 'research' | 'summarize';

// Urgency levels
export type Urgency = 'realtime' | 'normal' | 'offline';

// Output formats
export type Format = 'code' | 'text' | 'json';

// Model capabilities
interface ModelCapability {
  name: string;
  type: string;
  cost: number;
  max_tokens: number;
  latency: number;
}

// Routing rules
export interface RouteRule {
  models: string[];
  priority: string[];
}

// Route request
export interface RouteRequest {
  context: string;
  options?: {
    type?: TaskType;
    format?: Format;
    urgency?: Urgency;
  };
}

// Route response
export interface RouteResponse {
  model: string;
  model_name: string;
  task_type: TaskType;
  confidence: number;
  reasoning: string;
  estimated_cost: number;
  estimated_tokens: number;
}

// Router statistics
interface RouterStats {
  [taskType: string]: {
    [model: string]: {
      success: number;
      total: number;
    };
  };
}

// Model capabilities registry
export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  'zai/glm-4.7': {
    name: 'GLM 4.7',
    type: 'coding,qa,debug',
    cost: 0.0002,
    max_tokens: 8000,
    latency: 1.2
  },
  'zai/qwen-32b': {
    name: 'Qwen 2.5 Coder 32B',
    type: 'coding,debug',
    cost: 0,
    max_tokens: 4096,
    latency: 3.5
  },
  'zai/sonnet': {
    name: 'Claude Sonnet 4.2',
    type: 'qa,analysis,summarize',
    cost: 0.003,
    max_tokens: 128000,
    latency: 2.1
  },
  'zai/opus': {
    name: 'Claude Opus 4.6',
    type: 'analysis,research,creative',
    cost: 0.015,
    max_tokens: 200000,
    latency: 3.8
  }
};

// Routing rules
// models array ordered from [default/fast] to [best-quality]
export const ROUTE_RULES: Record<TaskType, RouteRule> = {
  coding: {
    models: ['zai/glm-4.7', 'zai/qwen-32b'],
    priority: ['glm-4.7', 'qwen-32b']
  },
  qa: {
    models: ['zai/glm-4.7', 'zai/sonnet'],
    priority: ['glm-4.7', 'sonnet']
  },
  analysis: {
    models: ['zai/sonnet', 'zai/opus'],
    priority: ['sonnet', 'opus']
  },
  debug: {
    models: ['zai/glm-4.7', 'zai/qwen-32b'],
    priority: ['glm-4.7', 'qwen-32b']
  },
  creative: {
    models: ['zai/sonnet', 'zai/opus'],
    priority: ['sonnet', 'opus']
  },
  research: {
    models: ['zai/sonnet', 'zai/opus'],
    priority: ['sonnet', 'opus']
  },
  summarize: {
    models: ['zai/glm-4.7', 'zai/sonnet'],
    priority: ['glm-4.7', 'sonnet']
  }
};

// Classification keywords
const CLASSIFICATION_KEYWORDS: Record<TaskType, string[]> = {
  coding: [
    'function', 'class', 'implement', 'write code', 'create function', 'debug code',
    'fix bug', 'parse', 'algorithm', 'data structure', 'api', 'endpoint', 'database',
    'query', 'refactor', 'optimize', 'test', 'unit test', 'integration test',
    'typescript', 'javascript', 'python', 'rust', 'go', 'java', 'c++', 'sql',
    'graphql', 'rest', 'webhook', 'middleware', 'auth', 'authentication'
  ],
  qa: [
    'explain', 'how does', 'what is', 'why', 'help me understand', 'question',
    'answer', 'clarify', 'describe', 'difference between', 'compare', 'vs',
    'meaning', 'purpose', 'use case', 'when to use', 'best practice'
  ],
  analysis: [
    'analyze', 'review', 'assess', 'evaluate', 'examine', 'break down',
    'pros and cons', 'advantages', 'disadvantages', 'trade-offs', 'consider',
    'impact', 'implication', 'recommendation', 'suggestion', 'advice'
  ],
  debug: [
    'error', 'bug', 'fix', 'broken', 'not working', 'crash', 'exception',
    'debug', 'troubleshoot', 'issue', 'problem', 'failure', 'stack trace',
    'undefined', 'null', '404', '500', 'timeout', 'permission denied'
  ],
  creative: [
    'write a story', 'create content', 'brainstorm', 'idea', 'creative', 'innovative',
    'narrative', 'plot', 'character', 'dialogue', 'script', 'article', 'blog post',
    'marketing copy', 'slogan', 'tagline', 'headlines', 'title', 'name'
  ],
  research: [
    'research', 'find information', 'look up', 'investigate', 'gather data',
    'statistics', 'trends', 'history', 'background', 'context', 'documentation',
    'reference', 'source', 'verify', 'confirm', 'fact check'
  ],
  summarize: [
    'summarize', 'summary', 'brief', 'overview', 'recap', 'tldr', 'too long',
    'condense', 'key points', 'main ideas', 'highlights', 'bottom line',
    'takeaways', 'quick summary', 'short version'
  ]
};

// Stats file path
const STATS_FILE = path.join(process.env.HOME!, 'shared/router-stats.json');

// Load statistics
function loadStats(): RouterStats {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading router stats:', error);
  }
  return {};
}

// Save statistics
function saveStats(stats: RouterStats): void {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving router stats:', error);
  }
}

// Get router statistics
export function getRouterStats(): RouterStats {
  return loadStats();
}

// Get task type distribution
export function getTaskDistribution(): Record<string, number> {
  const stats = loadStats();
  const distribution: Record<string, number> = {
    coding: 0,
    qa: 0,
    analysis: 0,
    debug: 0,
    creative: 0,
    research: 0,
    summarize: 0,
    total: 0
  };

  for (const [taskType, models] of Object.entries(stats)) {
    let taskTotal = 0;
    for (const modelData of Object.values(models)) {
      taskTotal += modelData.total;
    }
    distribution[taskType] = taskTotal;
    distribution.total += taskTotal;
  }

  return distribution;
}

// Classify task type based on context
export function classifyTask(context: string): TaskType {
  const lowerContext = context.toLowerCase();
  const scores: Record<TaskType, number> = {
    coding: 0,
    qa: 0,
    analysis: 0,
    debug: 0,
    creative: 0,
    research: 0,
    summarize: 0
  };

  // Score each task type based on keyword matches
  for (const [taskType, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContext.includes(keyword)) {
        scores[taskType as TaskType]++;
      }
    }
  }

  // Find the task type with the highest score
  let maxScore = 0;
  let bestType: TaskType = 'qa'; // Default fallback

  for (const [taskType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestType = taskType as TaskType;
    }
  }

  // If no keywords matched, default to qa (general purpose)
  if (maxScore === 0) {
    return 'qa';
  }

  return bestType;
}

// Route task to best model
export function routeTask(request: RouteRequest): RouteResponse {
  const { context, options } = request;

  // Classify task type if not provided
  const taskType = options?.type || classifyTask(context);
  const urgency = options?.urgency || 'normal';
  const format = options?.format || 'text';

  // Get routing rules for task type
  const rule = ROUTE_RULES[taskType];
  if (!rule) {
    throw new Error(`No routing rules found for task type: ${taskType}`);
  }

  // Select best model based on priority
  let selectedModel = rule.models[0];
  let reasoning = '';

  // Adjust selection based on urgency and format
  if (urgency === 'realtime') {
    // Prefer lower latency models for realtime
    const modelsByLatency = [...rule.models].sort((a, b) => {
      return MODEL_CAPABILITIES[a].latency - MODEL_CAPABILITIES[b].latency;
    });
    selectedModel = modelsByLatency[0];
    reasoning = `Realtime urgency selected. ${MODEL_CAPABILITIES[selectedModel].name} offers low latency (${MODEL_CAPABILITIES[selectedModel].latency}s). `;
  } else if (urgency === 'offline') {
    // Prefer best quality regardless of cost
    selectedModel = rule.models[rule.models.length - 1];
    reasoning = `Offline processing selected. ${MODEL_CAPABILITIES[selectedModel].name} provides best quality. `;
  } else {
    // Normal: use default priority
    const priority = rule.priority[0];
    selectedModel = rule.models.find(m => m.includes(priority)) || rule.models[0];
    reasoning = `${MODEL_CAPABILITIES[selectedModel].name} best suited for ${taskType} tasks. `;
  }

  // Add format-specific reasoning
  if (format === 'code') {
    reasoning += 'Code output format prioritizes coding-specialized models.';
  }

  // Estimate tokens based on context length
  const estimatedTokens = Math.max(1000, context.length * 3);
  const estimatedCost = estimatedTokens * MODEL_CAPABILITIES[selectedModel].cost;

  // Calculate confidence based on keyword matching
  let confidence = 0.85; // Base confidence
  if (options?.type) {
    confidence = 0.95; // Higher confidence if type was explicitly provided
  } else {
    // Adjust confidence based on keyword match strength
    const lowerContext = context.toLowerCase();
    const keywords = CLASSIFICATION_KEYWORDS[taskType];
    const matchCount = keywords.filter(k => lowerContext.includes(k)).length;
    confidence = Math.min(0.98, 0.75 + (matchCount * 0.02));
  }

  return {
    model: selectedModel,
    model_name: MODEL_CAPABILITIES[selectedModel].name,
    task_type: taskType,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    estimated_cost: Math.round(estimatedCost * 10000) / 10000,
    estimated_tokens: estimatedTokens
  };
}

// Record task outcome for learning
export function recordOutcome(taskType: TaskType, model: string, success: boolean): void {
  const stats = loadStats();

  if (!stats[taskType]) {
    stats[taskType] = {};
  }

  if (!stats[taskType][model]) {
    stats[taskType][model] = { success: 0, total: 0 };
  }

  stats[taskType][model].total++;
  if (success) {
    stats[taskType][model].success++;
  }

  saveStats(stats);
}
