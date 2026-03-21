import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './app/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
