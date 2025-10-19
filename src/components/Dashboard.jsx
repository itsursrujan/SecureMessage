// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import ViewSendMessages from "./ViewSendMessages";
import "./CSS/Dashboard.css";

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }

    fetch("http://localhost:5000/get-users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const filtered = data.users.filter(
            (user) => user.email !== currentUser.email
          );
          setUsers(filtered);
        } else {
          alert("Failed to load users");
        }
      })
      .catch(() => alert("Error fetching users"));
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <div className="dashboard-container">
        <p style={{ margin: "auto", textAlign: "center", fontSize: "1.2rem" }}>
          Logging out... Redirecting
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <input
            type="text"
            placeholder="Search users by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <ul className="user-list">
          {filteredUsers.map((user) => (
            <li
              key={user.email}
              className={`user-item ${
                selectedUser?.email === user.email ? "active" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              {user.name} ({user.email})
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-panel">
        {selectedUser ? (
          <ViewSendMessages
            selectedUser={selectedUser}
            currentUser={currentUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <div className="placeholder-text">Select a user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 
