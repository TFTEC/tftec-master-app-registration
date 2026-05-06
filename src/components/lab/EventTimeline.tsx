import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventKind = "request" | "response" | "event" | "error" | "info";

export interface TimelineEvent {
  id: string;
  ts: number;
  actor: string;
  kind: EventKind;
  title: string;
  detail?: string;
  data?: unknown;
}

const kindStyles: Record<EventKind, string> = {
  request: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  response: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  event: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  error: "border-destructive/50 bg-destructive/10 text-destructive",
  info: "border-muted bg-muted/40 text-muted-foreground",
};

interface Props {
  events: TimelineEvent[];
  onClear?: () => void;
  className?: string;
  title?: string;
}

export function EventTimeline({ events, onClear, className, title = "Timeline ao vivo" }: Props) {
  const [kindFilter, setKindFilter] = useState<EventKind | "all">("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const actors = useMemo(() => Array.from(new Set(events.map((e) => e.actor))), [events]);
  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (kindFilter === "all" || e.kind === kindFilter) &&
          (actorFilter === "all" || e.actor === actorFilter)
      ),
    [events, kindFilter, actorFilter]
  );

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{title} <span className="text-muted-foreground font-normal">({filtered.length})</span></span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={exportJson} title="Exportar JSON">
              <Download className="w-4 h-4" />
            </Button>
            {onClear && (
              <Button size="icon" variant="ghost" onClick={onClear} title="Limpar">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
        <div className="flex flex-wrap gap-1 pt-2 items-center text-xs">
          <Filter className="w-3 h-3 text-muted-foreground" />
          {(["all", "request", "response", "event", "error"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={cn(
                "px-2 py-0.5 rounded border text-xs",
                kindFilter === k ? "border-primary text-primary" : "border-muted text-muted-foreground hover:border-foreground"
              )}
            >
              {k}
            </button>
          ))}
          {actors.length > 0 && (
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-background border border-muted rounded px-2 py-0.5 ml-2 text-xs"
            >
              <option value="all">todos atores</option>
              {actors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto font-mono text-xs space-y-1 max-h-[60vh]">
        {filtered.length === 0 && (
          <p className="text-muted-foreground italic">Nenhum evento ainda. Inicie o cenário ao lado.</p>
        )}
        {filtered.map((e) => {
          const time = new Date(e.ts).toLocaleTimeString();
          const isOpen = expanded[e.id];
          return (
            <div
              key={e.id}
              className={cn("border-l-2 pl-2 py-1 rounded-sm hover:bg-muted/40 cursor-pointer", kindStyles[e.kind])}
              onClick={() => setExpanded((s) => ({ ...s, [e.id]: !s[e.id] }))}
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{time}</span>
                <Badge variant="outline" className="h-4 text-[10px] px-1">{e.kind}</Badge>
                <span className="text-foreground/80">{e.actor}</span>
                <span className="truncate">{e.title}</span>
              </div>
              {e.detail && !isOpen && (
                <div className="text-muted-foreground truncate pl-1">{e.detail}</div>
              )}
              {isOpen && (
                <div className="mt-1 space-y-1">
                  {e.detail && <div className="text-muted-foreground whitespace-pre-wrap">{e.detail}</div>}
                  {e.data !== undefined && (
                    <pre className="bg-background/60 p-2 rounded overflow-auto max-h-48">
                      {typeof e.data === "string" ? e.data : JSON.stringify(e.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function makeEvent(
  actor: string,
  kind: EventKind,
  title: string,
  detail?: string,
  data?: unknown
): TimelineEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    actor,
    kind,
    title,
    detail,
    data,
  };
}
