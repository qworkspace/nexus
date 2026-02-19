"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bug, MessageSquare, History, Clock, User, Tag, CheckCircle } from "lucide-react";
import {
  Bug as BugType,
  BugStatus,
  BugPriority,
  BugComment,
} from "@/lib/bugs/BugService";
import { useState } from "react";

interface BugDetailProps {
  bug: BugType;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<BugType>, changedBy: string) => void;
  onAddComment: (id: string, author: string, content: string) => void;
}

const PRIORITY_COLORS: Record<BugPriority, string> = {
  critical: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  high: "bg-zinc-100 dark:bg-orange-950 text-[#FFE135] dark:text-[#FFE135] border-zinc-300 dark:border-zinc-300",
  medium: "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  low: "bg-zinc-100 dark:bg-green-950 text-zinc-700 dark:text-zinc-500 border-zinc-300 dark:border-zinc-300",
};

const STATUS_COLORS: Record<BugStatus, string> = {
  open: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  "in-progress": "bg-zinc-100 dark:bg-blue-950 text-zinc-700 dark:text-zinc-500 border-zinc-300 dark:border-zinc-300",
  testing: "bg-zinc-100 dark:bg-purple-950 text-zinc-700 dark:text-zinc-500 border-zinc-300 dark:border-zinc-300",
  resolved: "bg-zinc-100 dark:bg-green-950 text-zinc-700 dark:text-zinc-500 border-zinc-300 dark:border-zinc-300",
  closed: "bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

const STATUS_OPTIONS: { value: BugStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'testing', label: 'Testing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(dateString);
  }
};

export function BugDetail({ bug, onClose, onUpdate, onAddComment }: BugDetailProps) {
  const [newComment, setNewComment] = useState('');

  const handleStatusChange = (newStatus: BugStatus) => {
    onUpdate(bug.id, { status: newStatus }, 'User');
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(bug.id, 'User', newComment);
      setNewComment('');
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="h-4 w-4 text-zinc-500" />
              <span className="text-xs font-mono text-zinc-500">{bug.id}</span>
            </div>
            <CardTitle className="text-lg font-semibold leading-tight">
              {bug.title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
                Status
              </label>
              <select
                value={bug.status}
                onChange={(e) => handleStatusChange(e.target.value as BugStatus)}
                className={`w-full px-2 py-1 text-xs rounded border font-medium ${STATUS_COLORS[bug.status]} cursor-pointer`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">
                Priority
              </label>
              <div className={`px-2 py-1 text-xs rounded border font-medium capitalize ${PRIORITY_COLORS[bug.priority]}`}>
                {bug.priority}
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-500">Category:</span>
              <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
                {bug.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-500">Assignee:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {bug.assignee || 'Unassigned'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-zinc-500">Created:</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatRelativeTime(bug.createdAt)}
              </span>
            </div>
            {bug.resolvedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-zinc-500">Resolved:</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {formatRelativeTime(bug.resolvedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Labels */}
          {bug.labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bug.labels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-full"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Description
            </h4>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {bug.description}
            </p>
          </div>

          {/* History */}
          {bug.history.length > 1 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {bug.history.slice(1).reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className="text-xs p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize text-zinc-700 dark:text-zinc-300">
                        {entry.field}
                      </span>
                      <span className="text-zinc-500">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-400">
                      {entry.changedBy} changed it
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Comments ({bug.comments.length})
            </h4>

            {/* Add Comment */}
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {bug.comments.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))}
              {bug.comments.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface CommentProps {
  comment: BugComment;
}

function Comment({ comment }: CommentProps) {
  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {comment.author}
        </span>
        <span className="text-[10px] text-zinc-500">
          {formatRelativeTime(comment.timestamp)}
        </span>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
        {comment.content}
      </p>
    </div>
  );
}
