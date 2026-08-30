// src/App.jsx
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppRoutes from "./routes/AppRoutes"; // <-- Ini kunci utamanya!
import PullToRefresh from "./components/common/PullToRefresh";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <PullToRefresh />
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
