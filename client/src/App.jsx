import React, { useState } from "react";
import "./index.css";

import Login from "./components/Login";
import Register from "./components/Register";
import ChatWindow from "./components/ChatWindow";
// import { authLogin } from "./api"; // <-- We don't need this here

export default function App() {
  // --- FIX 1 ---
  // Read the token from localStorage to stay logged in
  const [token, setToken] = useState(localStorage.getItem("token"));
  
  const [userTokens, setUserTokens] = useState(200000); // This is fine
  const [mode, setMode] = useState("login"); // login | register

  // --- FIX 2 ---
  // This function now correctly receives the *token* from Login.jsx
  async function handleLoginSuccess(newToken) {
    // We already have the token! Just save it.
    setToken(newToken);
    localStorage.setItem("token", newToken);
    
    // You could fetch user details *here* if needed, but
    // for now, just setting the token is all we need.
  }

  // --- FIX 3 ---
  // We'll define logout here and pass it down to ChatWindow
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    // No page reload needed, React will handle it
  };

  // 🔹 If not logged in: show login/register
  if (!token) {
    if (mode === "login") {
      return (
        <Login
          // --- FIX 4 ---
          // Pass our new handleLoginSuccess function
          onLoginSuccess={handleLoginSuccess}
          switchToRegister={() => setMode("register")}
        />
      );
    }

    return <Register switchToLogin={() => setMode("login")} />;
  }

  // 🔹 Once logged in → open Chat window
  return (
    <ChatWindow 
      token={token} 
      initialTokens={userTokens} 
      // --- FIX 5 ---
      // Pass the logout function as a prop
      onLogout={handleLogout} 
    />
  );
}