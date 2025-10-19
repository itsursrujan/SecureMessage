// src/components/ViewSendMessages.jsx
import React, { useEffect, useState, useRef } from "react";
import "./CSS/ViewSendMessages.css";

const ViewSendMessages = ({ selectedUser, currentUser, onBack }) => {
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    fetch("http://localhost:5000/get-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user1: currentUser.email,
        user2: selectedUser.email,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const updatedMessages = data.messages.map((msg) => ({
            ...msg,
            spamStatus: msg.spamStatus || "Not Spam",
          }));
          setMessages(updatedMessages);
        } else {
          alert("Failed to load conversation");
        }
      })
      .catch(() => alert("Error loading messages"));
  }, [selectedUser, currentUser]);

  const handleSend = async () => {
    if (!newMessage.trim() && !file) return;

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Max 10MB allowed.");
        setFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        const payload = {
          sender: currentUser.email,
          receiver: selectedUser.email,
          message: base64Data,
          filename: file.name,
        };

        const res = await fetch("http://localhost:5000/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [
            ...prev,
            {
              sender: currentUser.email,
              receiver: selectedUser.email,
              message: `📎 ${file.name}`,
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString(),
              isFile: true,
              filename: file.name,
              spamStatus: "Not Spam",
            },
          ]);
          scrollToBottom();
        } else {
          alert("Failed to send file");
        }

        setFile(null);
      };

      reader.readAsDataURL(file);
    } else {
      let isSpam = false;
      try {
        const classifyRes = await fetch("http://localhost:5000/classify-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newMessage.trim() }),
        });
        const classifyData = await classifyRes.json();
        if (classifyData.success && classifyData.classification === "spam") {
          const proceed = window.confirm("\u26a0\ufe0f This message looks like spam. Do you still want to send it?");
          if (!proceed) return;
          isSpam = true;
        }
      } catch {
        alert("Spam check failed. Sending message anyway...");
      }

      const payload = {
        sender: currentUser.email,
        receiver: selectedUser.email,
        message: newMessage.trim(),
      };

      const res = await fetch("http://localhost:5000/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: currentUser.email,
            receiver: selectedUser.email,
            message: newMessage.trim(),
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString(),
            isFile: false,
            filename: "",
            spamStatus: isSpam ? "spam" : "Not Spam",
          },
        ]);
        scrollToBottom();
      } else {
        alert("Failed to send message");
      }

      setNewMessage("");
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(scrollToBottom, [messages]);

  const renderMessage = (msg) => {
    if (msg.isFile && msg.filename) {
      return (
        <a
          href={`http://localhost:5000/uploads/${msg.filename}`}
          target="_blank"
          rel="noopener noreferrer"
          className="file-link"
        >
          📎 {msg.filename}
        </a>
      );
    }

    return (
      <>
        <p>{msg.message}</p>
        {msg.sender !== currentUser.email &&
          msg.spamStatus?.toLowerCase() === "spam" && (
            <span className="spam-warning">⚠️ Marked as Spam</span>
          )}
      </>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <div className="chat-user">
          <p>{selectedUser.name}</p>
          <p>{selectedUser.email}</p>
        </div>
      </div>

      <div className="chat-body" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${
              msg.sender === currentUser.email ? "sent" : "received"
            } ${msg.sender !== currentUser.email && msg.spamStatus?.toLowerCase() === "spam" ? "spam-message" : ""}`}
          >
            {renderMessage(msg)}
            <span className="chat-time">{msg.date} {msg.time}</span>
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <label className="file-btn">
          +File
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />
        </label>
        <input
          type="text"
          placeholder="message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button className="send-btn" onClick={handleSend}>▶</button>
      </div>
    </div>
  );
};

export default ViewSendMessages;