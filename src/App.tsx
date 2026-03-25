import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { TrialExpiredToastProvider } from './contexts/TrialExpiredToastContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <ErrorBoundary>
      <ChatProvider>
        <TrialExpiredToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </Router>
        </TrialExpiredToastProvider>
      </ChatProvider>
    </ErrorBoundary>
  )
}

export default App
