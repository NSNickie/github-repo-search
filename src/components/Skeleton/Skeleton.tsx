import styles from './Skeleton.module.css';

/** Placeholder cards shown during the very first load of a search. */
export function Skeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.card}>
          <div className={styles.row}>
            <span className={`${styles.block} ${styles.avatar}`} />
            <span className={`${styles.block} ${styles.title}`} />
          </div>
          <span className={`${styles.block} ${styles.line}`} />
          <span className={`${styles.block} ${styles.lineShort}`} />
        </li>
      ))}
    </ul>
  );
}
