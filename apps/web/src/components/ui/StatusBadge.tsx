import React from 'react';

export type BadgeStatus = 'locked' | 'available' | 'passed' | 'in-progress';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig = {
  locked: {
    label: '잠금',
    className: 'bg-surface border-border text-text-tertiary',
  },
  available: {
    label: '시작 가능',
    className: 'bg-info-bg border-info text-info',
  },
  'in-progress': {
    label: '진행 중',
    className: 'bg-warning-bg border-warning text-warning',
  },
  passed: {
    label: '완료',
    className: 'bg-success-bg border-success text-success',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[13px] leading-5 font-normal transition-colors ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}











