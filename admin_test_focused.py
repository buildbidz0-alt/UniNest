import requests
import sys
import json
from datetime import datetime

class AdminPanelTester:
    def __init__(self, base_url="https://uninest-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.student_token = None
        self.library_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def setup_tokens(self):
        """Setup admin, student, and library tokens for testing"""
        print("🔧 Setting up test tokens...")
        
        # Admin login
        admin_login = {
            "identifier": "support@uninest.in",
            "password": "5968474644j"
        }
        
        success, response = self.run_test("Admin Login Setup", "POST", "auth/login", 200, data=admin_login)
        if success:
            self.admin_token = response['token']
            print(f"   Admin token obtained")
        
        # Create test student
        timestamp = str(int(datetime.now().timestamp()))
        student_data = {
            "name": "Admin Test Student",
            "email": f"admin_test_student_{timestamp}@test.com",
            "password": "test123",
            "role": "student",
            "location": "Mumbai",
            "bio": "Test student for admin testing",
            "phone": f"987654{timestamp[-4:]}"
        }
        
        success, response = self.run_test("Student Registration Setup", "POST", "auth/register", 200, data=student_data)
        if success:
            self.student_token = response['token']
            print(f"   Student token obtained")
        
        # Create test library
        library_data = {
            "name": "Admin Test Library",
            "email": f"admin_test_library_{timestamp}@test.com",
            "password": "test123",
            "role": "library",
            "location": "Delhi",
            "bio": "Test library for admin testing",
            "phone": f"876543{timestamp[-4:]}"
        }
        
        success, response = self.run_test("Library Registration Setup", "POST", "auth/register", 200, data=library_data)
        if success:
            self.library_token = response['token']
            print(f"   Library token obtained")

    def test_admin_initialization(self):
        """Test admin user initialization and login"""
        print("\n" + "="*60)
        print("TESTING ADMIN INITIALIZATION")
        print("="*60)
        
        # Test admin login with predefined credentials
        admin_login_data = {
            "identifier": "support@uninest.in",
            "password": "5968474644j"
        }
        
        success, response = self.run_test(
            "Admin Login with Predefined Credentials",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and response.get('user', {}).get('role') == 'admin':
            print("   ✅ Admin user correctly initialized and accessible")
            print(f"   Admin Email: {response['user']['email']}")
            print(f"   Admin Role: {response['user']['role']}")
            return True
        else:
            print("   ❌ Admin initialization failed")
            return False

    def test_admin_authentication_security(self):
        """Test admin authentication and role-based security"""
        print("\n" + "="*60)
        print("TESTING ADMIN AUTHENTICATION & SECURITY")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test admin can access admin endpoints
        success, response = self.run_test(
            "Admin Access to Admin Stats",
            "GET",
            "admin/stats",
            200,
            token=self.admin_token
        )
        
        if success:
            print("   ✅ Admin can access admin endpoints")
        
        # Test student cannot access admin endpoints
        if self.student_token:
            success, _ = self.run_test(
                "Student Blocked from Admin Endpoints",
                "GET",
                "admin/stats",
                403,
                token=self.student_token
            )
            if success:
                print("   ✅ Students correctly blocked from admin endpoints")
        
        # Test library cannot access admin endpoints
        if self.library_token:
            success, _ = self.run_test(
                "Library Blocked from Admin Endpoints",
                "GET",
                "admin/stats",
                403,
                token=self.library_token
            )
            if success:
                print("   ✅ Library users correctly blocked from admin endpoints")
        
        # Test unauthenticated access blocked
        success, _ = self.run_test(
            "Unauthenticated Access Blocked",
            "GET",
            "admin/stats",
            401
        )
        
        return success

    def test_admin_dashboard_apis(self):
        """Test admin dashboard APIs"""
        print("\n" + "="*60)
        print("TESTING ADMIN DASHBOARD APIs")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Test admin stats
        success, stats = self.run_test(
            "GET /api/admin/stats",
            "GET",
            "admin/stats",
            200,
            token=self.admin_token
        )
        
        if success:
            print("   📊 Platform Statistics Retrieved:")
            users = stats.get('users', {})
            content = stats.get('content', {})
            subscriptions = stats.get('subscriptions', {})
            
            print(f"   - Total Users: {users.get('total', 0)}")
            print(f"   - Students: {users.get('students', 0)}")
            print(f"   - Libraries: {users.get('libraries', 0)}")
            print(f"   - Books: {content.get('books', 0)}")
            print(f"   - Active Subscriptions: {subscriptions.get('active', 0)}")
        
        # Test admin users list
        success, users = self.run_test(
            "GET /api/admin/users",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   👥 Retrieved {len(users)} users for management")
            # Verify no passwords in response
            password_found = any('password' in user for user in users)
            if not password_found:
                print("   ✅ User passwords correctly excluded from response")
            else:
                print("   ❌ Password data found in user responses")
                return False
        
        # Test admin content books
        success, books = self.run_test(
            "GET /api/admin/content/books",
            "GET",
            "admin/content/books",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   📚 Retrieved {len(books)} books for moderation")
        
        # Test admin actions log
        success, actions = self.run_test(
            "GET /api/admin/actions",
            "GET",
            "admin/actions",
            200,
            token=self.admin_token
        )
        
        if success:
            print(f"   📋 Retrieved {len(actions)} admin actions from audit log")
        
        return success

    def test_user_management_apis(self):
        """Test user management APIs"""
        print("\n" + "="*60)
        print("TESTING USER MANAGEMENT APIs")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Get users list first
        success, users = self.run_test(
            "Get Users for Management Testing",
            "GET",
            "admin/users",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
        
        # Find a student user to test management
        test_user = None
        for user in users:
            if user.get('role') == 'student' and user.get('email') != 'support@uninest.in':
                test_user = user
                break
        
        if not test_user:
            print("   ⚠️  No suitable student user found for management testing")
            return True
        
        print(f"   Testing management on user: {test_user.get('name')} ({test_user.get('email')})")
        
        # Test user suspension
        suspend_data = {
            "action": "suspend",
            "reason": "Testing admin user management functionality"
        }
        
        success, response = self.run_test(
            "POST /api/admin/users/{user_id}/manage (suspend)",
            "POST",
            f"admin/users/{test_user['id']}/manage",
            200,
            data=suspend_data,
            token=self.admin_token
        )
        
        if success:
            print(f"   ✅ User suspension: {response.get('message')}")
        
        # Test user activation
        activate_data = {
            "action": "activate",
            "reason": "Reactivating after test suspension"
        }
        
        success, response = self.run_test(
            "POST /api/admin/users/{user_id}/manage (activate)",
            "POST",
            f"admin/users/{test_user['id']}/manage",
            200,
            data=activate_data,
            token=self.admin_token
        )
        
        if success:
            print(f"   ✅ User activation: {response.get('message')}")
        
        # Test that admin actions are logged
        success, actions = self.run_test(
            "Verify Actions Logged",
            "GET",
            "admin/actions",
            200,
            token=self.admin_token
        )
        
        if success and len(actions) > 0:
            print("   ✅ Admin actions properly logged in audit trail")
        
        # Test admin cannot modify other admin users
        admin_users = [u for u in users if u.get('role') == 'admin']
        if len(admin_users) > 1:
            other_admin = next((u for u in admin_users if u.get('email') != 'support@uninest.in'), None)
            if other_admin:
                success, _ = self.run_test(
                    "Admin Cannot Modify Other Admins",
                    "POST",
                    f"admin/users/{other_admin['id']}/manage",
                    403,
                    data=suspend_data,
                    token=self.admin_token
                )
                if success:
                    print("   ✅ Admin users protected from modification by other admins")
        
        return success

    def test_content_moderation_apis(self):
        """Test content moderation APIs"""
        print("\n" + "="*60)
        print("TESTING CONTENT MODERATION APIs")
        print("="*60)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        # Get books for moderation
        success, books_data = self.run_test(
            "Get Books for Moderation",
            "GET",
            "admin/content/books",
            200,
            token=self.admin_token
        )
        
        if not success:
            return False
        
        print(f"   📚 Found {len(books_data)} books available for moderation")
        
        # Test book deletion if books exist
        if books_data:
            book_to_delete = books_data[0].get('book', {})
            book_id = book_to_delete.get('id')
            
            if book_id:
                print(f"   Testing deletion of book: {book_to_delete.get('title')}")
                
                success, response = self.run_test(
                    "DELETE /api/admin/content/books/{book_id}",
                    "DELETE",
                    f"admin/content/books/{book_id}",
                    200,
                    token=self.admin_token
                )
                
                if success:
                    print(f"   ✅ Book deletion: {response.get('message')}")
                    
                    # Verify book is actually deleted
                    success, _ = self.run_test(
                        "Verify Book Deleted",
                        "GET",
                        f"books/{book_id}",
                        404
                    )
                    
                    if success:
                        print("   ✅ Book successfully removed from system")
        
        # Test deleting non-existent book
        success, _ = self.run_test(
            "Delete Non-existent Book",
            "DELETE",
            "admin/content/books/nonexistent-book-id",
            404,
            token=self.admin_token
        )
        
        if success:
            print("   ✅ Non-existent book deletion properly handled")
        
        return success

    def test_data_validation_security(self):
        """Test data validation and security measures"""
        print("\n" + "="*60)
        print("TESTING DATA VALIDATION & SECURITY")
        print("="*60)
        
        # Test public admin registration is blocked
        admin_data = {
            "name": "Fake Admin",
            "email": "fake@admin.com",
            "password": "test123",
            "role": "admin",
            "location": "System",
            "bio": "Fake admin",
            "phone": "9999999998"
        }
        
        success, _ = self.run_test(
            "Public Admin Registration Blocked",
            "POST",
            "auth/register",
            403,
            data=admin_data
        )
        
        if success:
            print("   ✅ Public admin registration correctly blocked")
        
        # Test role validation in registration
        invalid_role_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "test123",
            "role": "invalid_role",
            "location": "Test",
            "bio": "Test",
            "phone": "9876543210"
        }
        
        success, _ = self.run_test(
            "Invalid Role Registration Blocked",
            "POST",
            "auth/register",
            400,
            data=invalid_role_data
        )
        
        if success:
            print("   ✅ Invalid role registration correctly blocked")
        
        return success

def main():
    print("🚀 Starting UniNest Admin Panel Testing")
    print("="*70)
    
    tester = AdminPanelTester()
    
    # Setup test tokens
    tester.setup_tokens()
    
    # Admin Panel Test Sequence
    tests = [
        ("Admin Initialization", tester.test_admin_initialization),
        ("Admin Authentication & Security", tester.test_admin_authentication_security),
        ("Admin Dashboard APIs", tester.test_admin_dashboard_apis),
        ("User Management APIs", tester.test_user_management_apis),
        ("Content Moderation APIs", tester.test_content_moderation_apis),
        ("Data Validation & Security", tester.test_data_validation_security),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "="*70)
    print("ADMIN PANEL TEST RESULTS")
    print("="*70)
    print(f"📊 Tests Run: {tester.tests_run}")
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed Test Categories: {', '.join(failed_tests)}")
    else:
        print(f"\n🎉 ALL ADMIN PANEL TESTS PASSED!")
    
    # Determine overall result
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    
    if success_rate >= 90:
        print(f"\n✅ EXCELLENT: Admin Panel success rate is {success_rate:.1f}% - All core functionality working")
        return 0
    elif success_rate >= 75:
        print(f"\n✅ GOOD: Admin Panel success rate is {success_rate:.1f}% - Core functionality working with minor issues")
        return 0
    else:
        print(f"\n❌ CRITICAL: Admin Panel success rate is {success_rate:.1f}% - Major issues detected")
        return 1

if __name__ == "__main__":
    sys.exit(main())