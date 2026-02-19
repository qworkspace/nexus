import {
  // Navigation & Layout
  Building2, LayoutGrid, GitBranch, Calendar, Link, Inbox,
  Gauge, Hammer, MessageSquare, Brain, DollarSign, ScrollText,
  Menu, X, FileText, Activity,
  
  // Status & Indicators
  Circle, Check, CheckCircle, CheckSquare, Square,
  XCircle, AlertTriangle, HelpCircle,
  ChevronRight, ChevronDown, Play,
  TrendingUp, TrendingDown, ArrowRight,
  
  // Analytics & Data
  BarChart3, Flame,
  
  // Models & AI
  Bot, Sparkles, Zap, Eye,
  
  // Actions & Tools
  RefreshCw, Code, Target, BookOpen, Clock,
  
  // Communication
  Smartphone, Monitor, Users, Palette,
  
  // Resources
  Folder, Droplets,
  
  type LucideIcon
} from "lucide-react";

// Status indicator presets
export const StatusCircle = ({ 
  status, 
  size = 8, 
  className = "" 
}: { 
  status: 'online' | 'busy' | 'error' | 'warning' | 'offline';
  size?: number;
  className?: string;
}) => {
  const colorMap = {
    online: "fill-green-500 text-zinc-600",
    busy: "fill-blue-500 text-zinc-600",
    error: "fill-red-500 text-red-500",
    warning: "fill-yellow-500 text-yellow-500",
    offline: "fill-zinc-500 text-zinc-500",
  };
  
  return <Circle size={size} className={`${colorMap[status]} ${className}`} />;
};

// Model icon mapping
export const MODEL_ICONS: Record<string, LucideIcon> = {
  "opus": Brain,
  "sonnet": Sparkles,
  "haiku": Zap,
  "flash": Eye,
  "gpt": Bot,
  "default": Bot,
};

export function ModelIcon({ 
  model, 
  size = 16, 
  className = "" 
}: { 
  model: string;
  size?: number;
  className?: string;
}) {
  const modelKey = model.toLowerCase();
  const Icon = MODEL_ICONS[modelKey] || MODEL_ICONS.default;
  return <Icon size={size} className={className} />;
}

// Meeting type icons
export const MEETING_ICONS: Record<string, LucideIcon> = {
  "standup": Users,
  "sync-content": Palette,
  "sync-engineering": Code,
  "allhands": Building2,
  "default": Calendar,
};

export function MeetingIcon({
  type,
  size = 16,
  className = ""
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const Icon = MEETING_ICONS[type] || MEETING_ICONS.default;
  return <Icon size={size} className={className} />;
}

// Trend indicator
export function TrendIcon({
  trend,
  size = 16,
  className = ""
}: {
  trend: 'improving' | 'declining' | 'stable';
  size?: number;
  className?: string;
}) {
  const icons = {
    improving: TrendingUp,
    declining: TrendingDown,
    stable: ArrowRight,
  };
  
  const Icon = icons[trend];
  return <Icon size={size} className={className} />;
}

// Channel icons
export function ChannelIcon({
  channel,
  size = 16,
  className = ""
}: {
  channel: string;
  size?: number;
  className?: string;
}) {
  const Icon = channel === 'telegram' ? Smartphone : Monitor;
  return <Icon size={size} className={className} />;
}

// Export individual icons for direct use
export {
  Building2, LayoutGrid, GitBranch, Calendar, Link, Inbox,
  Gauge, Hammer, MessageSquare, Brain, DollarSign, ScrollText,
  Menu, X, FileText, Activity, Circle, Check, CheckCircle,
  XCircle, AlertTriangle, HelpCircle, ChevronRight, ChevronDown,
  Play, TrendingUp, TrendingDown, ArrowRight, BarChart3, Flame,
  Bot, Sparkles, Zap, Eye, RefreshCw, Code, Target, BookOpen,
  Clock, Smartphone, Monitor, Users, Palette, Folder, Droplets,
  CheckSquare, Square
};
