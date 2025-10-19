from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from encryption import encrypt_message, decrypt_message
import os, csv, base64
from datetime import datetime
import joblib

app = Flask(__name__)
CORS(app)

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MESSAGE_CSV = os.path.join(BASE_DIR, "message_log.csv")
USERS_CSV = os.path.join(BASE_DIR, "users.csv")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
SPAM_MODEL_PATH = os.path.join(BASE_DIR, "spam_classifier.joblib")

# --- Load Spam Classifier ---
spam_model = joblib.load(SPAM_MODEL_PATH)

# --- Ensure upload directory exists ---
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 10

# --- Register user helper ---
def register_user(name, email):
    if not os.path.exists(USERS_CSV):
        with open(USERS_CSV, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["Name", "Email"])

    with open(USERS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if any(row["Email"].strip().lower() == email.lower() for row in reader):
            return  # Already exists

    with open(USERS_CSV, "a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow([name, email])


# --- 📩 Send Message or File ---
@app.route("/send-message", methods=["POST"])
def send_message():
    try:
        data = request.get_json()
        sender = (data.get("sender") or "").strip().lower()
        receiver = (data.get("receiver") or "").strip().lower()
        message = (data.get("message") or "").strip()
        filename = (data.get("filename") or "").strip()

        if not sender or not receiver or not message:
            return jsonify({"success": False, "error": "Missing fields"}), 400

        now = datetime.now()
        is_file = bool(filename)
        short_message = ""

        if is_file:
            base64_data = message.split(",")[-1]
            file_bytes = base64.b64decode(base64_data)

            if len(file_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
                return jsonify({"success": False, "error": "File too large (max 10MB)"}), 400

            safe_name = f"{now.strftime('%Y%m%d%H%M%S')}_{filename}"
            file_path = os.path.join(UPLOAD_DIR, safe_name)

            with open(file_path, "wb") as f:
                f.write(file_bytes)

            short_message = encrypt_message(safe_name)
            filename_to_save = safe_name
            classification = "Not Spam"
        else:
            short_message = encrypt_message(message)
            filename_to_save = ""

            # --- Predict spam status ---
            try:
                classification = spam_model.predict([message])[0]
            except:
                classification = "Unknown"

        write_header = not os.path.exists(MESSAGE_CSV)
        with open(MESSAGE_CSV, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow([
                    "Date", "Time", "Sender", "Receiver",
                    "EncryptedMessage", "IsFile", "Filename", "SpamStatus"
                ])
            writer.writerow([
                now.strftime("%Y-%m-%d"),
                now.strftime("%H:%M:%S"),
                sender,
                receiver,
                short_message,
                "yes" if is_file else "no",
                filename_to_save,
                classification
            ])

        print(f"[Send ✅] {sender} ➡ {receiver} ({'file' if is_file else 'text'})")
        return jsonify({"success": True}), 200

    except Exception as e:
        print(f"[Send ❌] {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# --- 👤 Register Name + Email ---
@app.route("/register-user", methods=["POST"])
def register_user_api():
    try:
        data = request.get_json()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip().lower()

        if not name or not email:
            return jsonify({"success": False, "error": "Missing fields"}), 400

        register_user(name, email)
        print(f"[Register ✅] {name} - {email}")
        return jsonify({"success": True}), 200
    except Exception as e:
        print(f"[Register ❌] {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# --- 👥 Get All Users ---
@app.route("/get-users", methods=["GET"])
def get_users():
    try:
        if not os.path.exists(USERS_CSV):
            return jsonify({"success": True, "users": []})

        users = []
        with open(USERS_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                users.append({"name": row["Name"], "email": row["Email"].lower()})

        return jsonify({"success": True, "users": users})
    except Exception as e:
        print(f"[Users ❌] {e}")
        return jsonify({"success": False, "error": str(e)})


# --- 💬 Get Conversation Between Two Users ---
@app.route("/get-conversation", methods=["POST"])
def get_conversation():
    try:
        data = request.get_json()
        user1 = (data.get("user1") or "").strip().lower()
        user2 = (data.get("user2") or "").strip().lower()

        if not user1 or not user2:
            return jsonify({"success": False, "error": "Missing user emails"}), 400

        if not os.path.exists(MESSAGE_CSV):
            return jsonify({"success": True, "messages": []})

        messages = []
        with open(MESSAGE_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                s = row["Sender"].strip().lower()
                r = row["Receiver"].strip().lower()
                if (s == user1 and r == user2) or (s == user2 and r == user1):
                    decrypted = decrypt_message(row["EncryptedMessage"])
                    messages.append({
                        "date": row["Date"],
                        "time": row["Time"],
                        "sender": s,
                        "receiver": r,
                        "message": f"📎 {row['Filename']}" if row["IsFile"] == "yes" else decrypted,
                        "isFile": row["IsFile"] == "yes",
                        "filename": row["Filename"] if row["IsFile"] == "yes" else "",
                        "spamStatus": row.get("SpamStatus", "Not Spam")
                    })

        messages.sort(key=lambda m: (m["date"], m["time"]))
        return jsonify({"success": True, "messages": messages})
    except Exception as e:
        print(f"[Conversation ❌] {e}")
        return jsonify({"success": False, "error": str(e)})


# --- 📁 Serve Uploaded Files ---
@app.route("/uploads/<filename>", methods=["GET"])
def serve_file(filename):
    try:
        return send_from_directory(UPLOAD_DIR, filename, as_attachment=True)
    except Exception as e:
        print(f"[Serve File ❌] {e}")
        return jsonify({"success": False, "error": str(e)})


# --- 🪵 Optional: Return Raw Encrypted Messages ---
@app.route("/get-messages", methods=["GET"])
def get_messages():
    try:
        if not os.path.exists(MESSAGE_CSV):
            return jsonify({"success": True, "messages": []})

        messages = []
        with open(MESSAGE_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                messages.append({
                    "date": row["Date"],
                    "time": row["Time"],
                    "sender": row["Sender"],
                    "receiver": row["Receiver"],
                    "encrypted_message": row["EncryptedMessage"]
                })

        return jsonify({"success": True, "messages": messages})
    except Exception as e:
        print(f"[Get Messages ❌] {e}")
        return jsonify({"success": False, "error": str(e)})


# --- 🤖 Standalone ML Classification Endpoint ---
@app.route("/classify-message", methods=["POST"])
def classify_message():
    try:
        data = request.get_json()
        text = (data.get("text") or "").strip()
        if not text:
            return jsonify({"success": False, "error": "Empty message"}), 400

        prediction = spam_model.predict([text])[0]
        return jsonify({"success": True, "classification": prediction})
    except Exception as e:
        print(f"[Spam Classification ❌] {e}")
        return jsonify({"success": False, "error": str(e)})


# --- 🟢 Run Flask App ---
if __name__ == "__main__":
    app.run(debug=True)
