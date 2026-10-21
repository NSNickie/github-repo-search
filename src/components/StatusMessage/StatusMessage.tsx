import type { ReactNode } from 'react';
import styles from './StatusMessage.module.css';

interface StatusMessageProps {
  tone?: 'neutral' | 'error';
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

/** Centered panel for empty, idle and error states. */
export function StatusMessage({ tone = 'neutral', title, children, action }: StatusMessageProps) {
  return (
    <section
      className={`${styles.panel} ${tone === 'error' ? styles.error : ''}`}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <h2 className={styles.title}>{title}</h2>
      {children && <div className={styles.body}>{children}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}

/** Inline warning bar, e.g. for incomplete results. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className={styles.notice} role="status">
      {children}
    </p>
  );
}
