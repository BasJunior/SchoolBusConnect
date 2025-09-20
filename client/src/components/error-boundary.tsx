import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-800">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  We encountered an unexpected error. This has been logged and we'll fix it soon.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left bg-gray-100 p-3 rounded-lg mb-4">
                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                      Error Details (Development)
                    </summary>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.message}
                      </div>
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleRefresh} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                If this problem persists, please contact support.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
