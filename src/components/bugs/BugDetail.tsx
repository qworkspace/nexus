'use client';

import { Bug, BugStatus, Severity } from '@/lib/bugs/types';
import { useState } from 'react';
import { X, Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BugDetailProps {
  bug: Bug;
  onClose: () => void;
  onUpdate: () => void;
}

export function BugDetail({ bug, onClose, onUpdate }: BugDetailProps) {
  const [status, setStatus] = useState<BugStatus>(bug.status);
  const [severity, setSeverity] = useState<Severity>(bug.severity);
  const [resolution, setResolution] = useState(bug.resolution || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/bugs/${bug.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          severity,
          resolution: resolution || undefined
        })
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update bug:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{bug.title}</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{bug.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              icon={Calendar}
              label="Created"
              value={format(new Date(bug.createdAt), 'PPpp')}
            />
            <InfoItem
              icon={Calendar}
              label="Updated"
              value={format(new Date(bug.updatedAt), 'PPpp')}
            />
            <InfoItem
              icon={Tag}
              label="Project"
              value={bug.project}
            />
            <InfoItem
              icon={Tag}
              label="Source"
              value={bug.source}
            />
            {bug.assignedTo && (
              <InfoItem
                icon={User}
                label="Assigned To"
                value={bug.assignedTo}
              />
            )}
            {bug.fixedAt && (
              <InfoItem
                icon={Calendar}
                label="Fixed At"
                value={format(new Date(bug.fixedAt), 'PPpp')}
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
              {bug.description}
            </div>
          </div>

          {/* Steps to Reproduce */}
          {bug.stepsToReproduce && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Steps to Reproduce
              </label>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                {bug.stepsToReproduce}
              </div>
            </div>
          )}

          {/* Expected vs Actual */}
          {(bug.expectedBehavior || bug.actualBehavior) && (
            <div className="grid grid-cols-2 gap-4">
              {bug.expectedBehavior && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Behavior
                  </label>
                  <div className="bg-green-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                    {bug.expectedBehavior}
                  </div>
                </div>
              )}
              {bug.actualBehavior && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Behavior
                  </label>
                  <div className="bg-red-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                    {bug.actualBehavior}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          {bug.logs && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logs
              </label>
              <div className="bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono overflow-x-auto max-h-64">
                {bug.logs}
              </div>
            </div>
          )}

          {/* Update Form */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Update Bug</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BugStatus)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                  <option value="in-progress">In Progress</option>
                  <option value="fixed">Fixed</option>
                  <option value="wont-fix">Won't Fix</option>
                  <option value="cannot-reproduce">Cannot Reproduce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Notes
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Add resolution notes..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
