import React from 'react';
import styles from './StatusBadge.module.css';

export type BadgeStatus = 'locked' | 'available' | 'passed' | 'in-progress';

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig = {
  locked: {
    label: '잠금',
    className: styles.locked,
  },
  available: {
    label: '시작 가능',
    className: styles.available,
  },
  'in-progress': {
    label: '진행 중',
    className: styles.inProgress,
  },
  passed: {
    label: '완료',
    className: styles.passed,
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`${styles.badge} ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}










