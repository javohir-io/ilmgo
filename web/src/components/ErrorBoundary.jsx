import { Component } from 'react'

/**
 * Wrap every WebGL / lazy piece. `fallback` is a node or (error, reset) => node.
 * A failed 3D scene must degrade to CSS, never white-screen the page.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error) {
    console.warn(`[ilmgo] ${this.props.label || 'component'} failed, using fallback:`, error)
    this.props.onError?.(error)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const { fallback = null } = this.props
    return typeof fallback === 'function' ? fallback(error, this.reset) : fallback
  }
}
