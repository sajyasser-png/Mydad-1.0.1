import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
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
        <div className="min-h-screen flex items-center justify-center bg-[#fdf8ee] dark:bg-[#0c0a09] p-4 text-center" dir="rtl">
          <div className="max-w-md w-full p-6 sm:p-8 bg-white/95 dark:bg-[#171412]/95 rounded-2xl shadow-xl border border-red-200/70 dark:border-red-900/50">
            <h1 className="text-xl font-bold text-red-700 dark:text-red-400 mb-3">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-sm text-amber-950/80 dark:text-amber-100/80 mb-5 leading-relaxed">
              نعتذر عن هذا الخلل. يرجى محاولة إعادة تحميل الصفحة.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
            {import.meta.env.DEV && (
              <pre className="mt-5 p-3.5 bg-amber-50/70 dark:bg-black/30 rounded-xl text-left text-xs overflow-auto max-h-40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
