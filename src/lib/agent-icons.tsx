import {
  Bot, Palette, Zap, Flame, Eye, Music, MessageCircle,
  Waves, Diamond, Moon, Brush, Target, Sparkles, Crown, User,
  type LucideIcon
} from "lucide-react";

const AGENT_ICONS: Record<string, LucideIcon> = {
  "🦾": Bot,
  "🎨": Palette,
  "⚡": Zap,
  "🔥": Flame,
  "🔮": Eye,
  "🎪": Music,
  "💬": MessageCircle,
  "🌊": Waves,
  "💎": Diamond,
  "🌙": Moon,
  "👩‍🎨": Brush,
  "👩🎨": Brush,
  "🏹": Target,
  "✨": Sparkles,
  "👑": Crown,
};

export function AgentIcon({ emoji, size = 24, className = "" }: { emoji: string; size?: number; className?: string }) {
  const Icon = AGENT_ICONS[emoji] || User;
  return <Icon size={size} className={className} />;
}
