import styles from "./JsonPayloadBlock.module.css";

export type JsonPayloadBlockProps = {
  label: string;
  data?: unknown;
};

export function JsonPayloadBlock({ label, data }: JsonPayloadBlockProps) {
  return (
    <div>
      <p className={styles.label}>{label}</p>
      {data === undefined ? (
        <p className={styles.empty}>—</p>
      ) : (
        <pre className={styles.root}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
