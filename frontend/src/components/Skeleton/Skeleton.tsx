import styles from "./Skeleton.module.css";

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.image} />
          <div className={styles.line} style={{ width: "60%" }} />
          <div className={styles.line} />
          <div className={styles.line} style={{ width: "40%" }} />
        </div>
      ))}
    </div>
  );
}
