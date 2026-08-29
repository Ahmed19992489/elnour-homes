import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-amber-500/10 p-4 text-amber-600">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">حدث خطأ غير متوقع</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            نعتذر عن هذا الخطأ. يمكنك إعادة تحميل الصفحة للمتابعة.
          </p>
          <Button
            className="mt-6 bg-[#24211d] text-white hover:bg-[#d5af58] hover:text-[#24211d]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة تحميل الصفحة
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
