import Login from "./components/login/Login";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DashBoard from "./components/dashboard/DashBoard";
import PostDetail from "./components/postdetail/PostDetail";
import { SnackbarProvider } from "notistack";

function App() {
  return (
    <SnackbarProvider
      maxSnack={1}
      autoHideDuration={2000}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Router>
        <Routes>
          <Route exact path="/" element={<Login />} />
          <Route exact path="/dashboard" element={<DashBoard />} />
          <Route path="/post/:postId" element={<PostDetail />} />
        </Routes>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
