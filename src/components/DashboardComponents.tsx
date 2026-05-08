import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

// ─── Stats Card Component ────────────────────────────────────────────────────
interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  bgColor?: string;
  textColor?: string;
  iconBgColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  bgColor = 'bg-blue-50',
  textColor = 'text-blue-600',
  iconBgColor = 'bg-blue-100'
}) => (
  <div className={`${bgColor} rounded-2xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-all`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-gray-500 text-sm font-semibold mb-1">{title}</p>
        <h3 className={`text-3xl font-bold ${textColor} mb-2`}>{value}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className={`${iconBgColor} p-3 rounded-xl`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-1">
        {trend === 'up' ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trendValue}
        </span>
      </div>
    )}
  </div>
);

// ─── Activity Card Component ────────────────────────────────────────────────
interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  actionLabel?: string;
  onAction?: () => void;
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
  emptyMessage?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', badge: 'bg-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100' },
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  title,
  activities,
  emptyMessage = 'Sin actividades'
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
    {activities.length === 0 ? (
      <p className="text-gray-400 text-center py-8">{emptyMessage}</p>
    ) : (
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const colors = colorMap[activity.color];
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className={`p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all ${
                idx !== activities.length - 1 ? 'border-b-2' : ''
              }`}
            >
              <div className="flex gap-4">
                <div className={`${colors.badge} p-2.5 rounded-lg h-fit`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{activity.timestamp}</span>
                  </div>
                  {activity.actionLabel && (
                    <button
                      onClick={activity.onAction}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                      {activity.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// ─── Progress Card Component ────────────────────────────────────────────────
interface ProgressCardProps {
  title: string;
  value: number;
  target: number;
  unit?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple';
  icon?: LucideIcon;
  showLabel?: boolean;
}

const progressColorMap = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  target,
  unit = '',
  color = 'blue',
  icon: Icon,
  showLabel = true
}) => {
  const percentage = (value / target) * 100;
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      <div className="flex items-end justify-between mb-3">
        <span className="text-2xl font-bold text-gray-900">
          {value}{unit}
        </span>
        <span className="text-xs text-gray-400">{target}{unit}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`${progressColorMap[color]} h-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-3">{Math.round(percentage)}% completado</p>
      )}
    </div>
  );
};

// ─── Info Panel Component ────────────────────────────────────────────────────
interface InfoPanelProps {
  title: string;
  subtitle?: string;
  items: Array<{ label: string; value: string | React.ReactNode }>;
  bgColor?: string;
  borderColor?: string;
  icon?: LucideIcon;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  title,
  subtitle,
  items,
  bgColor = 'bg-white',
  borderColor = 'border-gray-100',
  icon: Icon
}) => (
  <div className={`${bgColor} rounded-2xl p-6 shadow-sm border ${borderColor}`}>
    <div className="flex items-center gap-3 mb-4">
      {Icon && <Icon className="w-5 h-5 text-gray-600" />}
      <div>
        <h3 className="font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
          <span className="text-sm text-gray-600">{item.label}</span>
          <span className="font-semibold text-gray-900">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Quick Action Button ────────────────────────────────────────────────────
interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  success: 'bg-green-100 text-green-700 hover:bg-green-200',
};

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  fullWidth = false
}) => (
  <button
    onClick={onClick}
    className={`${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

// ─── Metric Badge Component ────────────────────────────────────────────────
interface MetricBadgeProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const badgeSizeMap = {
  sm: 'text-xs px-3 py-2',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

const badgeColorMap = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  size = 'md'
}) => (
  <div
    className={`${badgeColorMap[color]} ${badgeSizeMap[size]} rounded-xl border font-semibold inline-flex items-center gap-2`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    <span>{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

// ─── Empty State Component ────────────────────────────────────────────────
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction
}) => (
  <div className="text-center py-12">
    <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-600" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
