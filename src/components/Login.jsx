// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import "./CSS/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // ✅ Firebase sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      localStorage.setItem("currentUser", JSON.stringify({ email: user.email }));
      alert("Login Successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Invalid email or password.");
    }
  };

  return (
    <div className="login-container">
      <h1 className="title">SecureMessage</h1>
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        <p onClick={() => navigate("/register")} className="nav-link">
          New Here? Register
        </p>
      </div>
    </div>
  );
};

export default Login;
