import React from 'react';
import { cn } from '@/lib/utils'; // Assuming cn exists or we use clsx directly

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};
