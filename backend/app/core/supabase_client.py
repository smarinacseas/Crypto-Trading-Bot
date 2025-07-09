"""
Supabase client configuration for the crypto trading bot.
This provides direct database access through Supabase's Python SDK.
"""
import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class SupabaseClient:
    """Singleton Supabase client wrapper."""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance."""
        if cls._instance is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            
            if not url or not key:
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
                )
            
            cls._instance = create_client(url, key)
        
        return cls._instance
    
    @classmethod
    def get_service_client(cls) -> Client:
        """Get Supabase client with service role key for admin operations."""
        url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not service_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
            )
        
        return create_client(url, service_key)

# Convenience functions
def get_supabase() -> Client:
    """Get the default Supabase client."""
    return SupabaseClient.get_client()

def get_supabase_admin() -> Client:
    """Get Supabase client with admin privileges."""
    return SupabaseClient.get_service_client()

# Test connection function
async def test_supabase_connection() -> bool:
    """Test the Supabase connection."""
    try:
        client = get_supabase()
        # Try a simple query to test connection
        result = client.table('auth.users').select("id").limit(1).execute()
        return True
    except Exception as e:
        print(f"Supabase connection test failed: {e}")
        return False