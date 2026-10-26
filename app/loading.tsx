import styles from "./page.module.css";

export default function Loading() {
  return (
    <main className={styles.page} data-testid="home-loading">
      <section aria-label="Next match" className={styles.skeleton} />
      <section aria-label="Season record" className={styles.skeleton} />
      <section aria-label="Latest results" className={styles.skeleton} />
      <section aria-label="Mini league table" className={styles.skeleton} />
      <section aria-label="Squad teaser" className={styles.skeleton} />
    </main>
  );
}
