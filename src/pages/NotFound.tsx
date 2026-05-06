import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in">
      <div className="p-6 rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-6">Página não encontrada</p>
      <Link to="/">
        <Button className="btn-azure">
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
