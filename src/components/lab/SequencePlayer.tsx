import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, RotateCcw, SkipBack } from "lucide-react";
import { MermaidDiagram } from "./MermaidDiagram";

export interface SequenceStep {
  /** Friendly title shown in the side panel */
  title: string;
  /** Didactic explanation */
  description: string;
  /** Optional technical note (request URL, header, etc.) */
  technical?: string;
  /** Optional callback when this step becomes active (for live demo execution) */
  onActivate?: () => void | Promise<void>;
  /** Action button label, if user can trigger something extra */
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
}

interface Props {
  chart: string;
  steps: SequenceStep[];
  intervalMs?: number;
  onStep?: (index: number) => void;
}

export function SequencePlayer({ chart, steps, intervalMs = 2200, onStep }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    onStep?.(index);
    void steps[index]?.onActivate?.();
  }, [index]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setTimeout(() => {
      setIndex((i) => (i + 1 < steps.length ? i + 1 : (setPlaying(false), i)));
    }, intervalMs);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, index, intervalMs, steps.length]);

  const reset = () => {
    setPlaying(false);
    setIndex(0);
  };

  const current = steps[index];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <MermaidDiagram chart={chart} highlightStep={index + 1} />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="ml-1">{playing ? "Pausar" : "Reproduzir"}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={index >= steps.length - 1}
        >
          <SkipForward className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          Passo {index + 1} de {steps.length}
        </span>
      </div>

      {current && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <h4 className="font-semibold text-primary">{current.title}</h4>
          <p className="text-sm text-muted-foreground">{current.description}</p>
          {current.technical && (
            <pre className="text-xs bg-muted p-2 rounded overflow-auto whitespace-pre-wrap">
              {current.technical}
            </pre>
          )}
          {current.actionLabel && current.onAction && (
            <Button size="sm" variant="secondary" onClick={current.onAction}>
              {current.actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
