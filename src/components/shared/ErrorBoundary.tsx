import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-mono">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-red-200 overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <h2 className="text-red-700 font-bold">React Application Crashed</h2>
            </div>
            <div className="p-6 overflow-auto">
              <p className="text-sm font-bold text-slate-800 mb-2">Error Message:</p>
              <pre className="bg-slate-900 text-red-400 p-4 rounded-lg text-xs whitespace-pre-wrap overflow-x-auto mb-4">
                {this.state.error?.toString()}
              </pre>
              
              <p className="text-sm font-bold text-slate-800 mb-2">Component Stack:</p>
              <pre className="bg-slate-100 text-slate-600 p-4 rounded-lg text-[10px] whitespace-pre-wrap overflow-x-auto">
                {this.state.errorInfo?.componentStack}
              </pre>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
