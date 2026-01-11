import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className }) => {
  return (
    <div className={cn("bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">{value}</h3>
          {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
        </div>
        {icon && <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
};
