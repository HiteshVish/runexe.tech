"use client";

function charClass(c: string): "pwd-letter" | "pwd-digit" | "pwd-symbol" {
  if (/[0-9]/.test(c)) return "pwd-digit";
  if (/[a-zA-Z]/.test(c)) return "pwd-letter";
  return "pwd-symbol";
}

export default function PasswordDisplay({
  value,
  hidden,
}: {
  value: string;
  hidden: boolean;
}) {
  if (hidden) {
    return (
      <div className="pwd-display" aria-label="Generated password hidden">
        {"•".repeat(Math.min(value.length, 48))}
      </div>
    );
  }
  return (
    <div className="pwd-display" aria-label="Generated password">
      {[...value].map((c, i) => (
        <span key={`${i}-${c}`} className={charClass(c)}>
          {c}
        </span>
      ))}
    </div>
  );
}