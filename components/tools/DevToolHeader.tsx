import "@/styles/dev-tools.css";

type Props = { title: string; lead: string; badges?: string[] };

export default function DevToolHeader({ title, lead, badges = ["Runs in your browser", "No signup"] }: Props) {
  return (
    <header className="dt-head">
      <div>
        <div className="dt-kicker">Free tool</div>
        <h1>{title}</h1>
        <p className="dt-lead">{lead}</p>
      </div>
      <div className="dt-badges">
        {badges.map((b) => (
          <span className="dt-badge" key={b}>
            {b}
          </span>
        ))}
      </div>
    </header>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
