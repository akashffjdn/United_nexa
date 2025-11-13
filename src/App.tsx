import AppRouter from './router/AppRouter'

function App() {
  // This component is the main entry point.
  // It renders the AppRouter, which in turn decides
  // which "page" component to show based on the URL.
  return <AppRouter />
}

export default App