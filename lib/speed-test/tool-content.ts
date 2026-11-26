import type { GuideFaq, GuideSection } from "@/components/seo/ToolGuide";

export const SPEED_TEST_DESCRIPTION =
  "Measure download, upload and latency against RunExe servers. Free Internet Speed Test — no signup.";

export const speedTestSections: GuideSection[] = [
  {
    heading: "What it does",
    body: "RunExe Internet Speed Test measures idle ping, then streams multi-connection download and upload transfers against runexe.tech API endpoints. It shows your download speed prominently, plus upload and unloaded/loaded latency.",
  },
  {
    heading: "Who it is for",
    list: [
      "Anyone who wants a quick, clear Mbps reading",
      "Developers checking network quality before demos or remote work",
      "People who care about latency under load, not just headline speed",
    ],
  },
  {
    heading: "How to use it",
    ordered: true,
    list: [
      "Open the tool — the test starts automatically.",
      "Watch download Mbps update live, then upload and latency appear.",
      "Press the circular button (or Space) to stop or run again.",
    ],
  },
  {
    heading: "How speed is measured",
    list: [
      "Ping: ten sequential requests; the first is discarded as warmup. Idle ping uses the minimum; jitter is the mean absolute difference between consecutive samples.",
      "Download: four parallel streams of incompressible random bytes for about eight seconds. Early TCP slow-start samples are excluded from the final average.",
      "Upload: three parallel 2 MB chunk posts for about eight seconds, timed with upload progress events.",
      "Loaded latency pings run during download and upload to estimate delay under load.",
    ],
  },
  {
    heading: "Privacy",
    body: "Measurements hit RunExe API routes on this site (server-assisted). Your public IP may be read from request headers to show approximate ISP and location; that lookup is ephemeral and is not stored as a results history on our servers.",
  },
  {
    heading: "Limitations",
    list: [
      "Results reflect the path to RunExe’s hosting region, not every ISP peering path or a CDN edge near you.",
      "Browser, VPN, Wi-Fi congestion and CPU load can change numbers between runs.",
      "Upload chunk size is capped for serverless payload limits; extremely fast links may be constrained by that design.",
      "ISP enrichment depends on a short third-party lookup and may be empty on localhost or when the lookup times out.",
    ],
  },
];

export const speedTestFaq: GuideFaq[] = [
  {
    q: "What unit is shown?",
    a: "Megabits per second (Mbps), the standard network marketing unit. Divide by 8 for approximate megabytes per second (MB/s).",
  },
  {
    q: "Why do results vary by server?",
    a: "Throughput and latency depend on routing to the specific host that serves this site. A test against a distant region or a congested path will differ from a nearby CDN speed test.",
  },
  {
    q: "What is loaded latency?",
    a: "Loaded latency is ping measured while download or upload is running. A large gap versus unloaded ping often means bufferbloat — excess delay when the link is busy.",
  },
  {
    q: "Do you store my IP or results on servers?",
    a: "No permanent result store. IP/geo headers are only used for the live client line under the metrics.",
  },
  {
    q: "Is this tool free?",
    a: "Yes. No signup required. The measurement API is part of the free RunExe tools set.",
  },
];
