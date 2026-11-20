import type { ToolIconName } from "@/lib/seo/site";

const PATHS: Record<ToolIconName, React.ReactNode> = {
  invoice: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </>
  ),
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </>
  ),
  braces: <path d="M16 18 22 12 16 6M8 6 2 12 8 18" />,
  base64: (
    <>
      <path d="M4 7V5h16v2M9 19h6M12 5v14" />
      <path d="M3 13h3M18 13h3" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 11v3a8 8 0 0 1-1.5 4.7" />
      <path d="M8.5 8.6A4 4 0 0 1 16 11v2.5a12 12 0 0 1-.6 3.7" />
      <path d="M5 12.5V11a7 7 0 0 1 12.7-4" />
      <path d="M19 11v1.5c0 2-.4 4-1.1 5.8M6.5 17a10 10 0 0 0 1.4-4.6" />
    </>
  ),
  hash: <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
};

export default function ToolIcon({ name }: { name: ToolIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
