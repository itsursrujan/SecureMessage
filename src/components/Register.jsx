// src/components/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config"; // ✅ Use the shared auth
import "./CSS/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // ✅ Register with Firebase
      await createUserWithEmailAndPassword(auth, email, password);

      // ✅ Save name + email to backend
      const response = await fetch("http://localhost:5000/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const result = await response.json();
      if (!result.success) {
        alert("Registered in Firebase but backend failed.");
        return;
      }

      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
      alert(error.message);
    }
  };

  return (
    <div className="register-container">
      <h1 className="title">SecureMessage</h1>
      <div className="register-card">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value.trim())}
          />
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
          <div className="profile-placeholder" />
          <button type="submit">Register</button>
        </form>
        <p onClick={() => navigate("/login")} className="nav-link">
          Already Registered? Login
        </p>
      </div>
    </div>
  );
};

export default Register;
