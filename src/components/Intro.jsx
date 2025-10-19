// src/components/Intro.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Intro.css";

const Intro = () => {
  const navigate = useNavigate();
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = currentDate.toLocaleDateString("en-GB"); // DD/MM/YY
  const day = currentDate.toLocaleDateString("en-GB", { weekday: "long" });

  return (
    <div className="intro-container">
      <div className="intro-header">
        <div className="intro-datetime">
          <div className="time">{time}</div>
          <div className="date">{day} - {date}</div>
        </div>
        <div className="intro-buttons">
          <button onClick={() => navigate("/login")}>Login</button>
          <button onClick={() => navigate("/register")}>Register</button>
        </div>
      </div>
      <div className="intro-title">SecureMessage</div>
      <div className="intro-subtitle">
        Transfer Messages and Files Safely & Securely with Privacy
      </div>
    </div>
  );
};

export default Intro;
