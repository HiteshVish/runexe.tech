import type { HTMLAttributes } from "react";

export default function StepsExplainer() {
  return (
    <Card className="qr-steps" aria-label="How it works">
      <Step n={1} title="Choose type" detail="Pick URL, WiFi, UPI, WhatsApp, or more." />
      <Step n={2} title="Fill details" detail="Enter the fields for your QR payload." />
      <Step n={3} title="Download" detail="Save PNG or SVG, or copy the image." />
    </Card>
  );
}

function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

function Step({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div className="qr-step">
      <strong>
        {n}. {title}
      </strong>
      {detail}
    </div>
  );
}