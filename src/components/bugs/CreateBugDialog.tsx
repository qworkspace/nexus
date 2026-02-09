"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateBugInput, Project, Severity, BugSource } from '@/lib/bugs';
import { Bug as BugIcon, Plus } from 'lucide-react';

interface CreateBugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBug: (bug: CreateBugInput) => Promise<void>;
  isCreating?: boolean;
}

export function CreateBugDialog({
  open,
  onOpenChange,
  onCreateBug,
  isCreating = false,
}: CreateBugDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [project, setProject] = useState<Project>('mission-control');
  const [severity, setSeverity] = useState<Severity>('medium');
  const [source, setSource] = useState<BugSource>('manual');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return;
    }

    await onCreateBug({
      title: title.trim(),
      description: description.trim(),
      project,
      severity,
      source,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setProject('mission-control');
    setSeverity('medium');
    setSource('manual');
  };

  const projects: Project[] = ['cryptomon', 'mission-control', 'content-pipeline', 'cohera', 'q-system'];
  const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
  const sources: BugSource[] = ['testing', 'manual', 'build', 'console', 'user'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BugIcon className="h-5 w-5" />
            Create New Bug
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the bug"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the bug, including steps to reproduce"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={4}
              required
            />
          </div>

          {/* Project, Severity, Source */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <select
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value as Project)}
                disabled={isCreating}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                required
              >
                {projects.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="severity">Severity *</Label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                disabled={isCreating}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                required
              >
                {severities.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="source">Source *</Label>
              <select
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value as BugSource)}
                disabled={isCreating}
                className="w-full mt-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                required
              >
                {sources.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !title.trim() || !description.trim()}
            >
              {isCreating ? (
                <>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bug
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
