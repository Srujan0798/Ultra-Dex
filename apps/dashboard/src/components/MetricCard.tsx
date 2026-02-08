import { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  accentClass?: string;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  accentClass = 'text-purple-500',
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-8 w-8 ${accentClass}`} />
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-gray-400">{label}</p>
        {trend ? <span className="text-xs text-gray-500">{trend}</span> : null}
      </div>
    </div>
  );
}
