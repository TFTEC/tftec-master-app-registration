import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    themeVariables: {
      background: "transparent",
      primaryColor: "#1e293b",
      primaryTextColor: "#e2e8f0",
      primaryBorderColor: "#3b82f6",
      lineColor: "#64748b",
      secondaryColor: "#334155",
      tertiaryColor: "#0f172a",
    },
    fontFamily: "ui-sans-serif, system-ui",
  });
  initialized = true;
}

interface Props {
  chart: string;
  className?: string;
  /** Highlight a 1-indexed message line in sequence diagrams */
  highlightStep?: number;
}

export function MermaidDiagram({ chart, className, highlightStep }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    ensureInit();
    let cancelled = false;
    mermaid
      .render(idRef.current, chart)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setErr("");
        }
      })
      .catch((e) => !cancelled && setErr(String(e?.message || e)));
    return () => {
      cancelled = true;
    };
  }, [chart]);

  // Highlight a sequence message by index
  useEffect(() => {
    if (!ref.current || !highlightStep) return;
    const messages = ref.current.querySelectorAll<SVGElement>(
      "g.messageText, line.messageLine0, line.messageLine1, path.messageLine0, path.messageLine1"
    );
    messages.forEach((el) => el.classList.remove("mermaid-active"));
    // Heuristic: each message has both a line and a text. Group by parent index.
    const lines = ref.current.querySelectorAll<SVGElement>(
      "line.messageLine0, line.messageLine1, path.messageLine0, path.messageLine1"
    );
    const target = lines[highlightStep - 1];
    if (target) target.classList.add("mermaid-active");
  }, [svg, highlightStep]);

  if (err) {
    return (
      <pre className="text-xs text-destructive p-3 bg-destructive/10 rounded">
        Mermaid error: {err}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("mermaid-container w-full overflow-auto", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
