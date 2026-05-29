import { ReactNode } from 'react'
import styles from './Badge.module.css'

type BadgeVariant = 'cyan' | 'purple' | 'lime' | 'red' | 'amber' | 'muted'

interface BadgeProps { variant?: BadgeVariant; children: ReactNode; className?: string }

export function Badge({ variant = 'cyan', children, className = '' }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
