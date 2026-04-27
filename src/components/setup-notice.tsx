type Props = {
  title: string;
  detail?: string;
};

export function SetupNotice({ title, detail }: Props) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>
        Connect a private Vercel Blob store to this project and add `BLOB_READ_WRITE_TOKEN` before using the live
        scheduler.
      </p>
      {detail ? <p className="small">{detail}</p> : null}
    </section>
  );
}
