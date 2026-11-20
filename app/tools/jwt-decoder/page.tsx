import JwtDecoderApp from "@/components/tools/JwtDecoderApp";
import JsonLd, { faqPage, graph, toolApp } from "@/components/seo/JsonLd";
import ToolGuide, { type GuideFaq, type GuideSection } from "@/components/seo/ToolGuide";
import { SITE_URL, pageMetadata } from "@/lib/seo/site";

const description =
  "Decode a JSON Web Token in your browser: read the header and payload and see exp, iat and nbf as dates. The token is never uploaded.";

export const metadata = pageMetadata({
  title: "JWT Decoder — Read Header, Payload & Expiry | RunExe",
  description,
  path: "/tools/jwt-decoder",
});

const sections: GuideSection[] = [
  {
    heading: "What it does",
    body: "Splits a JWT into its header, payload and signature, decodes the Base64URL parts and shows them as formatted JSON. Time claims (exp, iat, nbf) are shown as local and UTC dates, with a live status saying whether the token has expired.",
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Paste a token into the box, or press Load sample.",
      "Read the header and payload panels.",
      "Check the Claims table for dates and the expiry status.",
    ],
  },
  {
    heading: "Privacy",
    body: "Decoding happens in your browser tab. The token is not sent to any server, but treat real tokens as secrets anyway: anyone who has one can use it until it expires.",
  },
  {
    heading: "Limitations",
    list: [
      "The signature is not verified. A decoded token can still be forged, so always verify it on your server.",
      "Encrypted tokens (JWE, five parts) cannot be read without the key and are not supported.",
    ],
  },
];

const faq: GuideFaq[] = [
  {
    q: "Does this tool verify the JWT signature?",
    a: "No. It only decodes the token. Verifying a signature needs the secret or public key, and should be done by your server.",
  },
  {
    q: "What do exp, iat and nbf mean?",
    a: "exp is when the token expires, iat is when it was issued, and nbf is the time before which it must not be accepted. All three are Unix timestamps in seconds.",
  },
  {
    q: "Is my token sent anywhere?",
    a: "No. The token is decoded with JavaScript inside your browser tab.",
  },
  {
    q: "Is a JWT encrypted?",
    a: "A normal signed JWT (JWS) is only encoded, so anyone can read its payload. Do not put secrets in a JWT payload.",
  },
];

const appLd = toolApp("jwt-decoder", {
  description,
  category: "DeveloperApplication",
  features: ["Decode JWT header and payload", "Readable exp, iat and nbf dates", "Live expiry status", "Copy header or payload"],
});

export default function JwtDecoderPage() {
  return (
    <>
      <JsonLd data={graph(appLd, faqPage(`${SITE_URL}/tools/jwt-decoder`, faq))} />
      <JwtDecoderApp />
      <ToolGuide
        tool="jwt-decoder"
        intro="A free, in-browser JSON Web Token decoder from RunExe Technology."
        sections={sections}
        faq={faq}
      />
    </>
  );
}
