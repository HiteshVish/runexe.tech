export default function EmptyState() {
  return (
    <div className="ic-empty" role="region" aria-label="How to use">
      <ol className="ic-steps">
        <li>
          <b>Step 1</b>
          Upload one or more JPG, PNG or WebP images (drag, paste, or browse).
        </li>
        <li>
          <b>Step 2</b>
          Pick quality or a target file size, resize if needed, and choose output format.
        </li>
        <li>
          <b>Step 3</b>
          Preview the result and download — or grab everything as a ZIP.
        </li>
      </ol>
    </div>
  );
}