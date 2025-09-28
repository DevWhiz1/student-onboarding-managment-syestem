import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.core.config import settings
import json
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # For development, try to use a service account key file first
            if os.path.exists("firebase-service-account.json"):
                cred = credentials.Certificate("firebase-service-account.json")
                firebase_admin.initialize_app(cred)
                print("Firebase initialized with service account file")
            else:
                # Create credentials from environment variables
                private_key = settings.firebase_private_key
                if private_key and not private_key.startswith('-----BEGIN'):
                    # Fix the private key format if needed
                    private_key = private_key.replace('\\n', '\n')
                
                cred_dict = {
                    "type": "service_account",
                    "project_id": settings.firebase_project_id,
                    "private_key_id": settings.firebase_private_key_id,
                    "private_key": private_key,
                    "client_email": settings.firebase_client_email,
                    "client_id": settings.firebase_client_id,
                    "auth_uri": settings.firebase_auth_uri,
                    "token_uri": settings.firebase_token_uri,
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{settings.firebase_client_email}"
                }
                
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("Firebase initialized successfully")
        else:
            print("Firebase already initialized")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        print("Firebase initialization failed, but the app will continue without it")
        print("Please check your Firebase configuration or place firebase-service-account.json in the backend directory")

# Get Firestore database instance
def get_firestore_db():
    try:
        # Connect to the specific database named "students"
        # For named databases, we need to use the database ID
        return firestore.client(database_id="students")
    except ValueError as e:
        if "default Firebase app does not exist" in str(e):
            print("Firebase not initialized. Using mock database for development.")
            return None
        raise e
    except Exception as e:
        print(f"Error connecting to Firestore database 'students': {e}")
        print("Trying to connect to default database...")
        try:
            return firestore.client()
        except Exception as default_e:
            print(f"Error connecting to default database: {default_e}")
            print("Using mock database for development.")
            return None

# Get Firebase Auth instance
def get_firebase_auth():
    try:
        return auth
    except Exception as e:
        print(f"Firebase Auth not available: {e}")
        return None
