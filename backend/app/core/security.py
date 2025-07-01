from cryptography.fernet import Fernet
from .config import settings
import base64

def get_encryption_key():
    """Get or generate encryption key for API keys"""
    key = settings.ENCRYPTION_KEY.encode()
    # Ensure key is 32 bytes for Fernet
    if len(key) < 32:
        key = key.ljust(32, b'0')
    elif len(key) > 32:
        key = key[:32]
    return base64.urlsafe_b64encode(key)

def encrypt_api_key(api_key: str) -> str:
    """Encrypt API key for secure storage"""
    f = Fernet(get_encryption_key())
    encrypted_key = f.encrypt(api_key.encode())
    return encrypted_key.decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt API key for use"""
    f = Fernet(get_encryption_key())
    decrypted_key = f.decrypt(encrypted_key.encode())
    return decrypted_key.decode()