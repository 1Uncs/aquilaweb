import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  subtitle,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#0E1712] border border-[#1C2E24] rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#15241D] border border-[#1C2E24] flex items-center justify-center text-[#718579]">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-[#94A89D]">{subtitle}</p>}
        {description && <p className="text-[11px] text-[#718579]">{description}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 rounded-xl bg-[#15241D] hover:bg-[#1C2E24] border border-[#10B981]/30 text-xs font-semibold text-[#10B981] transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
