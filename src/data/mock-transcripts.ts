import { Transcript } from '@/types/transcripts';

// Mock session metadata
export const mockSessions = [
  {
    sessionId: 'session-001',
    sessionKey: 'agent:main:main',
    kind: 'main' as const,
    agent: 'Q',
    model: 'claude-3-5-sonnet',
    messageCount: 156,
    tokenCount: 82534,
    duration: 9900, // 2h 45m
    startedAt: new Date('2026-02-07T14:00:00'),
    lastMessage: "Let's focus on Nexus...",
    label: 'Main Session (PJ ↔ Q)',
  },
  {
    sessionId: 'session-002',
    sessionKey: 'agent:dev:subagent:48e53cdd-a2b3-4444-8b4c-417a2b8e7e8f',
    kind: 'spawn' as const,
    agent: 'Dev',
    model: 'glm-4.7',
    messageCount: 24,
    tokenCount: 37000,
    duration: 840, // 14m
    startedAt: new Date('2026-02-07T13:30:00'),
    lastMessage: 'Build Market Overview dashboard...',
    label: 'Dev Agent: cryptomon-market',
  },
  {
    sessionId: 'session-003',
    sessionKey: 'agent:main:cron:afternoon-joke',
    kind: 'cron' as const,
    agent: 'Q',
    model: 'claude-3-5-sonnet',
    messageCount: 3,
    tokenCount: 1200,
    duration: 16, // 16s
    startedAt: new Date('2026-02-07T12:00:00'),
    lastMessage: "My DAW crashed and I lost 8 hours...",
    label: 'Cron: Afternoon Joke',
  },
  {
    sessionId: 'session-004',
    sessionKey: 'agent:main:main',
    kind: 'main' as const,
    agent: 'Q',
    model: 'claude-3-5-sonnet',
    messageCount: 89,
    tokenCount: 45600,
    duration: 3600, // 1h
    startedAt: new Date('2026-02-07T10:00:00'),
    lastMessage: 'Applied cron hotfix for Issue #142...',
    label: 'Main Session (PJ ↔ Q)',
  },
  {
    sessionId: 'session-005',
    sessionKey: 'agent:dev:subagent:a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    kind: 'spawn' as const,
    agent: 'Dev',
    model: 'glm-4.7',
    messageCount: 18,
    tokenCount: 24500,
    duration: 600, // 10m
    startedAt: new Date('2026-02-06T16:45:00'),
    lastMessage: 'Fixed the memory leak in the dashboard...',
    label: 'Dev Agent: memory-fix',
  },
  {
    sessionId: 'session-006',
    sessionKey: 'agent:creative:subagent:b2c3d4e5-f6a7-8901-bcde-f12345678901',
    kind: 'spawn' as const,
    agent: 'Creative',
    model: 'claude-3-5-sonnet',
    messageCount: 31,
    tokenCount: 28900,
    duration: 720, // 12m
    startedAt: new Date('2026-02-06T14:20:00'),
    lastMessage: 'Created new brand guidelines document...',
    label: 'Creative Agent: Brand Refresh',
  },
  {
    sessionId: 'session-007',
    sessionKey: 'agent:main:cron:daily-summary',
    kind: 'cron' as const,
    agent: 'Q',
    model: 'claude-3-5-sonnet',
    messageCount: 5,
    tokenCount: 2500,
    duration: 30, // 30s
    startedAt: new Date('2026-02-06T09:00:00'),
    lastMessage: 'Daily summary: 42 tasks completed, 156k tokens used...',
    label: 'Cron: Daily Summary',
  },
  {
    sessionId: 'session-008',
    sessionKey: 'agent:main:main',
    kind: 'main' as const,
    agent: 'Q',
    model: 'claude-3-5-sonnet',
    messageCount: 203,
    tokenCount: 112000,
    duration: 14400, // 4h
    startedAt: new Date('2026-02-05T09:00:00'),
    lastMessage: 'The architecture looks solid. Ready to proceed...',
    label: 'Main Session (PJ ↔ Q)',
  },
];

// Mock full transcript for session-001
export const mockTranscript: Transcript = {
  ...mockSessions[0],
  messages: [
    {
      role: 'user',
      content: "Don't wait for my permission, go for it. I trust you to make good decisions.",
      timestamp: Date.parse('2026-02-07T14:42:00'),
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          thinking: "PJ is telling me to stop waiting for permission and just act. This is a clear signal to be more autonomous and take initiative. I should acknowledge this trust and move forward with the task at hand without seeking constant confirmation.",
        },
        {
          type: 'text',
          text: "LET'S GO! 🔥\n\nI'll spawn the Dev Agent to build the Nexus Live Dashboard immediately.",
        },
        {
          type: 'toolCall',
          name: 'sessions_spawn',
          input: {
            agentId: 'dev',
            task: 'Build the Nexus Live Dashboard - real-time activity feed, session monitoring, and quick actions panel',
            label: 'mission-control-live-dashboard',
          },
        },
      ],
      timestamp: Date.parse('2026-02-07T14:42:15'),
      usage: {
        promptTokens: 245,
        completionTokens: 156,
        totalTokens: 401,
      },
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'toolResult',
          content: JSON.stringify({
            status: 'accepted',
            childSessionKey: 'agent:dev:subagent:48e53cdd-a2b3-4444-8b4c-417a2b8e7e8f',
            message: 'Dev Agent spawned successfully',
          }, null, 2),
        },
      ],
      timestamp: Date.parse('2026-02-07T14:42:20'),
    },
    {
      role: 'user',
      content: "Can you also add a search feature? I want to be able to search across all activities.",
      timestamp: Date.parse('2026-02-07T14:45:00'),
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'thinking',
          thinking: "PJ wants a search feature added to the Live Dashboard. This should search across sessions, activities, costs, etc. I need to update the task specification and communicate this to the Dev Agent. The search should be fast, fuzzy matching, with filters for time ranges, agent, etc.",
        },
        {
          type: 'text',
          text: "Great idea! I'll update the requirements to include a comprehensive search feature with:\n\n• Full-text search across all activities\n• Filters by time range, agent, activity type\n• Keyboard shortcut (Cmd+K) for quick access\n• Search suggestions as you type\n\nI'll notify the Dev Agent to add this to the scope.",
        },
        {
          type: 'toolCall',
          name: 'sessions_notify',
          input: {
            sessionKey: 'agent:dev:subagent:48e53cdd-a2b3-4444-8b4c-417a2b8e7e8f',
            message: 'Update: Add search feature to the Live Dashboard. Should support full-text search with filters (time range, agent, type). Quick access via Cmd+K.',
          },
        },
      ],
      timestamp: Date.parse('2026-02-07T14:45:30'),
      usage: {
        promptTokens: 312,
        completionTokens: 189,
        totalTokens: 501,
      },
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'toolResult',
          content: JSON.stringify({
            status: 'notified',
            acknowledged: true,
          }, null, 2),
        },
      ],
      timestamp: Date.parse('2026-02-07T14:45:35'),
    },
    {
      role: 'user',
      content: "Perfect. Let me know when it's ready for review.",
      timestamp: Date.parse('2026-02-07T14:50:00'),
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: "Will do! The Dev Agent is working on it now. I'll ping you once the implementation is ready for testing.",
        },
      ],
      timestamp: Date.parse('2026-02-07T14:50:10'),
    },
  ],
};

// Helper function to get transcript by ID
export function getMockTranscript(sessionId: string): Transcript | null {
  if (sessionId === 'session-001') {
    return mockTranscript;
  }
  // For other sessions, return a basic structure
  const session = mockSessions.find(s => s.sessionId === sessionId);
  if (!session) return null;

  return {
    ...session,
    messages: [
      {
        role: 'user',
        content: 'Initial request...',
        timestamp: session.startedAt.getTime(),
      },
      {
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'I\'ll help you with that.',
          },
        ],
        timestamp: session.startedAt.getTime() + 1000,
      },
    ],
  };
}
