import { Component, ErrorInfo, ReactNode } from "react"

import { ErrorDetails } from "./ErrorDetails"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Catches render errors anywhere below it and shows ErrorDetails instead of a blank screen.
 * Only class components can be error boundaries.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null })
  }

  shouldComponentUpdate(_nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
    return nextState.error !== this.state.error
  }

  render() {
    return this.state.error ? (
      <ErrorDetails
        onReset={this.resetError}
        error={this.state.error}
        errorInfo={this.state.errorInfo}
      />
    ) : (
      this.props.children
    )
  }
}
