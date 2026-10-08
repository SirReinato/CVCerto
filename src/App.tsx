import { GlobalStyle } from "./theme/GlobalStyle";
import AppRoutes from "./rotas/AppRoutes";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <GlobalStyle />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;