import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-amber-600" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-2">404</h1>

          <h2 className="text-xl font-semibold mb-4">
            الصفحة غير موجودة
          </h2>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            عذراً، الصفحة التي تبحث عنها غير موجودة.
            <br />
            قد تكون تم نقلها أو حذفها.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="px-6 py-2.5"
            >
              <Home className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
