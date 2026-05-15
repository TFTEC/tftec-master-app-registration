import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  code: string;
  language?: string;
  /** Title shown above the snippet */
  label?: string;
  /** Compact mode — smaller padding for inline snippets */
  compact?: boolean;
}

export function CopyableSnippet({ code, label, compact }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copiado para o clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Falha ao copiar — copie manualmente");
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
          <Button onClick={handleCopy} size="sm" variant="ghost" className="h-7 px-2 text-xs">
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-emerald-500" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </>
            )}
          </Button>
        </div>
      )}
      <div className="relative group">
        <pre
          className={`bg-muted/40 border border-border rounded-md overflow-auto leading-relaxed font-mono ${
            compact ? "p-2 text-[11px]" : "p-3 text-xs"
          }`}
        >
          <code>{code}</code>
        </pre>
        {!label && (
          <Button
            onClick={handleCopy}
            size="sm"
            variant="ghost"
            className="absolute top-1.5 right-1.5 h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition bg-background/90 backdrop-blur"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1 text-emerald-500" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
