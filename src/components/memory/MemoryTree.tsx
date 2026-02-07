"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MemoryFile {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  children?: MemoryFile[];
  content?: string;
}

interface MemoryTreeProps {
  files: MemoryFile[];
  selectedFile: string | null;
  onSelectFile: (file: MemoryFile) => void;
  searchTerm?: string;
}

export function MemoryTree({ files, selectedFile, onSelectFile, searchTerm = "" }: MemoryTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["memory"]));

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filterFiles = (files: MemoryFile[], term: string): MemoryFile[] => {
    if (!term) return files;

    return files.reduce((acc: MemoryFile[], file) => {
      const matchesSearch = file.name.toLowerCase().includes(term.toLowerCase());
      const matchingChildren = file.children ? filterFiles(file.children, term) : [];

      if (matchesSearch || matchingChildren.length > 0) {
        acc.push({
          ...file,
          children: matchingChildren.length > 0 ? matchingChildren : file.children,
        });
      }
      return acc;
    }, []);
  };

  const filteredFiles = filterFiles(files, searchTerm);

  const renderFile = (file: MemoryFile, level: number = 0) => {
    const isExpanded = expandedFolders.has(file.id);
    const isSelected = selectedFile === file.id;
    const hasMatchingChildren = file.children && file.children.length > 0;

    return (
      <div key={file.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
            isSelected ? "bg-zinc-900 text-white" : "hover:bg-zinc-100",
            searchTerm && file.name.toLowerCase().includes(searchTerm.toLowerCase())
              ? "bg-yellow-50 hover:bg-yellow-100"
              : ""
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (file.type === "folder") {
              toggleFolder(file.id);
            } else {
              onSelectFile(file);
            }
          }}
        >
          {file.type === "folder" ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">{file.name}</span>
              {hasMatchingChildren && (
                <span className="text-xs text-zinc-400">({file.children?.length})</span>
              )}
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileText className="w-4 h-4" />
              <span className="text-sm">{file.name}</span>
            </>
          )}
        </div>
        {file.type === "folder" && isExpanded && file.children && (
          <div>{file.children.map((child) => renderFile(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {filteredFiles.map((file) => renderFile(file))}
    </div>
  );
}
