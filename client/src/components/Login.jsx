import React, { useState } from "react";
// import { login } from "../api"; // Not needed

export default function Login({ onLoginSuccess, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    
    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json(); 
        if (data.token) {
          // This correctly calls App.jsx with the token
          onLoginSuccess(data.token);
        } else {
          setMsg("❌ Login successful, but no token received.");
        }
      } else {
        const errorData = await response.json(); 
        setMsg(`❌ ${errorData.message || "Login failed"}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setMsg("❌ Could not connect to the server.");
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#050510] flex items-center justify-center relative overflow-hidden p-4">
      {/* ... (rest of your beautiful UI) ... */}
      <div className="w-full max-w-md p-[2px] rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-lg">
        <div className="p-10 bg-[#0b0b15]/80 backdrop-blur-2xl rounded-3xl border border-white/10 text-white">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Welcome Back
          </h1>
          
          {msg && (
            <div
              className={`text-center mb-3 ${
                msg.startsWith("❌") ? "text-red-400" : "text-green-400"
              }`}
            >
              {msg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off" 
            />
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Password"
              type="password"
              value={password}
              // --- FIX ---
              onChange={(e) => setPassword(e.target.value)} // Was e.targe.value
              required
              autoComplete="off" 
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold"
            >
              Login
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{" "}
            <span
              onClick={switchToRegister}
              className="text-indigo-400 cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}