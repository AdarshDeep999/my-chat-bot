import React, { useState } from "react";

export default function Register({ switchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // This body now correctly includes all three fields
        body: JSON.stringify({ username, email, password }),
      });

      if (r.ok) {
        setMsg("✅ Account created! Login now.");
      } else {
        // This will get the specific error from the server
        const errorData = await r.json();
        setMsg(`❌ ${errorData.message || "Registration failed"}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMsg("❌ Could not connect to the server.");
    }
  } // <--- This is the correct closing brace for handleRegister

  // This is the one and only return statement for the component
  return (
    <div className="min-h-screen w-full bg-[#050510] flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(120,30,255,0.25),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(0,200,255,0.25),transparent_60%)]" />
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/20 blur-3xl rounded-full -z-10 animate-pulse" />
      <div className="w-full max-w-md p-[2px] rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 shadow-lg">
        <div className="p-10 bg-[#0b0b15]/80 backdrop-blur-2xl rounded-3xl border border-white/10 text-white">
          <h1 className="text-4xl font-extrabold text-center mb-6">
            Create Account
          </h1>
          {/* This logic correctly shows the message. 
            I'll make it red if the message starts with ❌
          */}
          {msg && (
            <div
              className={`text-center mb-3 ${
                msg.startsWith("❌") ? "text-red-400" : "text-green-400"
              }`}
            >
              {msg}
            </div>
          )}
          <form onSubmit={handleRegister} className="space-y-5">
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required // Added required
            />
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Email address"
              type="email"
              value={email}
      
              onChange={(e) => setEmail(e.target.value)}
              required // Added required
            />
            <input
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Added required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold"
            >
              Register
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{" "}
            <span
              onClick={switchToLogin}
              className="text-indigo-400 cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
} // <--- This is the final closing brace for the Register component