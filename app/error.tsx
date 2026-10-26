"use client";

import styles from "./page.module.css";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={styles.page}>
      <p data-testid="home-error">Something went wrong. Please try again.</p>
      <button onClick={reset}>Retry</button>
    </main>
  );
}
