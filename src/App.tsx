import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './app/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
