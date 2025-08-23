#!/usr/bin/env python3
import requests
import json
from datetime import datetime

class SubscriptionTester:
    def __init__(self):
        self.base_url = "https://uninest-app.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.library_token = None
        
    def register_library_user(self):
        """Register a new library user for testing"""
        timestamp = str(int(datetime.now().timestamp()))
        
        library_data = {
            "name": "Test Library Subscription",
            "email": f"libsub{timestamp}@test.com",
            "password": "test123",
            "role": "library",
            "location": "Delhi",
            "bio": "Test library for subscription testing",
            "phone": f"876543{timestamp[-4:]}"
        }
        
        response = requests.post(f"{self.api_url}/auth/register", json=library_data)
        if response.status_code == 200:
            data = response.json()
            self.library_token = data['token']
            print(f"✅ Library user registered successfully")
            return True
        else:
            print(f"❌ Library registration failed: {response.text}")
            return False
    
    def create_library_profile(self):
        """Create library profile to trigger free trial"""
        if not self.library_token:
            return False
            
        library_profile_data = {
            "name": "Subscription Test Library",
            "description": "Library for testing subscription system",
            "location": "Mumbai, Maharashtra",
            "facilities": ["WiFi", "Air Conditioning", "Parking"],
            "total_seats": 30
        }
        
        headers = {'Authorization': f'Bearer {self.library_token}'}
        response = requests.post(f"{self.api_url}/libraries", json=library_profile_data, headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Library profile created successfully")
            return True
        else:
            print(f"❌ Library profile creation failed: {response.text}")
            return False
    
    def test_subscription_endpoints(self):
        """Test subscription-related endpoints"""
        if not self.library_token:
            return False
            
        headers = {'Authorization': f'Bearer {self.library_token}'}
        
        # Test my-subscription endpoint
        print("\n🔍 Testing my-subscription endpoint...")
        response = requests.get(f"{self.api_url}/my-subscription", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ my-subscription endpoint working")
            print(f"   Subscription: {data.get('subscription')}")
            print(f"   Plan: {data.get('plan')}")
            print(f"   Days Remaining: {data.get('days_remaining')}")
            print(f"   Is Trial: {data.get('is_trial')}")
            
            if data.get('is_trial'):
                print("✅ Free trial correctly detected")
            else:
                print("❌ Free trial not detected")
        else:
            print(f"❌ my-subscription failed: {response.text}")
            return False
        
        # Test dashboard stats
        print("\n🔍 Testing dashboard stats...")
        response = requests.get(f"{self.api_url}/dashboard/stats", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dashboard stats working")
            print(f"   Has Subscription: {data.get('has_subscription')}")
            print(f"   Subscription Data: {data.get('subscription')}")
        else:
            print(f"❌ Dashboard stats failed: {response.text}")
            return False
        
        return True

def main():
    print("🚀 Testing Subscription System Focus")
    print("="*50)
    
    tester = SubscriptionTester()
    
    # Register library user
    if not tester.register_library_user():
        return 1
    
    # Create library profile (should trigger free trial)
    if not tester.create_library_profile():
        return 1
    
    # Test subscription endpoints
    if not tester.test_subscription_endpoints():
        return 1
    
    print("\n✅ All subscription tests passed!")
    return 0

if __name__ == "__main__":
    exit(main())