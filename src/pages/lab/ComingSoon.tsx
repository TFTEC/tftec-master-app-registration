import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LabComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Construction className="w-8 h-8 text-primary" />
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Este módulo será entregue nos próximos PRs do laboratório. Enquanto isso, explore os módulos já disponíveis.
          </p>
          <div className="flex gap-2">
            <Link to="/lab"><Button variant="outline">Voltar ao Hub</Button></Link>
            <Link to="/lab/demo"><Button>Demo Interativa</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
