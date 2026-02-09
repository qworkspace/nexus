'use client';

import { Bug, BugStatus } from '@/lib/bugs/types';
import { useState } from 'react';
import { BugDetail } from './BugDetail';
import { formatDistanceToNow } from 'date-fns';

interface BugListProps {
  bugs: Bug[];
  onUpdate: () => void;
}

export function BugList({ bugs, onUpdate }: BugListProps) {
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);

  if (bugs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No bugs found</p>
        <p className="text-sm mt-1">All clear! 🎉</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bugs.map((bug) => (
              <BugRow
                key={bug.id}
                bug={bug}
                onClick={() => setSelectedBug(bug)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {selectedBug && (
        <BugDetail
          bug={selectedBug}
          onClose={() => setSelectedBug(null)}
          onUpdate={() => {
            setSelectedBug(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

interface BugRowProps {
  bug: Bug;
  onClick: () => void;
}

function BugRow({ bug, onClick }: BugRowProps) {
  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-900">
        {bug.id}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="max-w-md truncate">{bug.title}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <ProjectBadge project={bug.project} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <SeverityBadge severity={bug.severity} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm">
        <StatusBadge status={bug.status} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
      </td>
    </tr>
  );
}

function ProjectBadge({ project }: { project: string }) {
  const colors: Record<string, string> = {
    cryptomon: 'bg-purple-100 text-purple-800',
    'mission-control': 'bg-blue-100 text-blue-800',
    'content-pipeline': 'bg-green-100 text-green-800',
    cohera: 'bg-orange-100 text-orange-800',
    'q-system': 'bg-pink-100 text-pink-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[project] || 'bg-gray-100 text-gray-800'}`}>
      {project}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  return (
    <span className={`px-2 py-1 rounded border text-xs font-medium ${colors[severity]}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: BugStatus }) {
  const colors: Record<BugStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    fixed: 'bg-green-100 text-green-800',
    'wont-fix': 'bg-gray-100 text-gray-800',
    'cannot-reproduce': 'bg-orange-100 text-orange-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.replace('-', ' ')}
    </span>
  );
}
