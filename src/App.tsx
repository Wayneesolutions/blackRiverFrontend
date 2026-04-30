import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { TrialExpiredToastProvider } from './contexts/TrialExpiredToastContext';
import { ChatProvider } from './contexts/ChatContext';
<<<<<<< HEAD
import { GlobalCallHandler } from './components/common/GlobalCallHandler';

=======
import { CallProvider } from './contexts/CreateCallContext';
>>>>>>> 724b0b032590eeadd3c3e9abafbca95b9ecdd1af
function App() {
  return (
    <ErrorBoundary>
      <ChatProvider>
<<<<<<< HEAD
        <TrialExpiredToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </Router>
          <GlobalCallHandler />
        </TrialExpiredToastProvider>
=======
        <CallProvider>
          <TrialExpiredToastProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Router>
          </TrialExpiredToastProvider>
        </CallProvider>
>>>>>>> 724b0b032590eeadd3c3e9abafbca95b9ecdd1af
      </ChatProvider>
    </ErrorBoundary>
  )
}

export default App
