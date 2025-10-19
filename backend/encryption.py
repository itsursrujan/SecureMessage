import os
import zlib
from cryptography.fernet import Fernet

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(BASE_DIR, "secret.key")

def load_or_create_key():
    if not os.path.exists(KEY_PATH):
        key = Fernet.generate_key()
        with open(KEY_PATH, "wb") as f:
            f.write(key)
        print("[Encryption] 🔐 New secret.key generated.")
    else:
        with open(KEY_PATH, "rb") as f:
            key = f.read()
    return Fernet(key)

fernet = load_or_create_key()

def encrypt_message(message: str) -> str:
    try:
        compressed = zlib.compress(message.encode())
        encrypted = fernet.encrypt(compressed)
        return encrypted.decode()
    except Exception as e:
        print("[Encrypt ❌]", e)
        return ""

def decrypt_message(token: str) -> str:
    try:
        decrypted = fernet.decrypt(token.encode())
        decompressed = zlib.decompress(decrypted)
        return decompressed.decode()
    except Exception as e:
        print("[Decrypt ❌]", e)
        return "[Decryption Failed]"
