import { GlobalStyle } from "./theme/GlobalStyle";
import AppRoutes from "./rotas/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./presentation/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GlobalStyle />
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;