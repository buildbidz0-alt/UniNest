import requests
import sys
import json
from datetime import datetime

class UniNestAPITester:
    def __init__(self, base_url="https://learnhive-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.student_token = None
        self.library_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.student_user = None
        self.library_user = None

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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

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

    def test_health_check(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING BASIC HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        success, _ = self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health endpoint
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        
        return success

    def test_phone_number_validation(self):
        """Test phone number validation during registration"""
        print("\n" + "="*50)
        print("TESTING PHONE NUMBER VALIDATION")
        print("="*50)
        
        base_data = {
            "name": "Test User",
            "email": "phonetest@test.com",
            "password": "test123",
            "role": "student",
            "location": "Mumbai",
            "bio": "Test user bio"
        }
        
        # Test invalid phone numbers (should fail with 400)
        invalid_phones = [
            ("98765", "Too short phone number"),
            ("1234567890", "Invalid start digit (1)"),
            ("2345678901", "Invalid start digit (2)"),
            ("abcd567890", "Non-numeric phone"),
            ("98765432101", "Too long phone number"),
            ("", "Empty phone number")
        ]
        
        for phone, description in invalid_phones:
            test_data = {**base_data, "phone": phone}
            success, response = self.run_test(
                f"Invalid Phone: {description}",
                "POST",
                "auth/register",
                400,
                data=test_data
            )
            if not success:
                print(f"   ⚠️  Expected validation failure for {description}")
        
        # Test valid phone numbers (should succeed with 200)
        valid_phones = [
            ("9876543210", "Valid phone starting with 9"),
            ("8765432109", "Valid phone starting with 8"),
            ("7654321098", "Valid phone starting with 7"),
            ("6543210987", "Valid phone starting with 6")
        ]
        
        for i, (phone, description) in enumerate(valid_phones):
            test_data = {**base_data, "phone": phone, "email": f"valid{i}@test.com"}
            success, response = self.run_test(
                f"Valid Phone: {description}",
                "POST",
                "auth/register",
                200,
                data=test_data
            )
            if success:
                print(f"   ✅ {description} registered successfully")
        
        # Test phone number uniqueness
        duplicate_data = {**base_data, "phone": "9876543210", "email": "duplicate@test.com"}
        success, response = self.run_test(
            "Duplicate Phone Number",
            "POST",
            "auth/register",
            400,
            data=duplicate_data
        )
        
        return True

    def test_student_registration(self):
        """Test student user registration"""
        print("\n" + "="*50)
        print("TESTING STUDENT REGISTRATION")
        print("="*50)
        
        # Use timestamp to ensure unique email/phone
        timestamp = str(int(datetime.now().timestamp()))
        
        student_data = {
            "name": "Test Student",
            "email": f"student{timestamp}@test.com",
            "password": "test123",
            "role": "student",
            "location": "Mumbai",
            "bio": "Test student bio",
            "phone": f"987654{timestamp[-4:]}"
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "auth/register",
            200,
            data=student_data
        )
        
        if success and 'token' in response:
            self.student_token = response['token']
            self.student_user = response['user']
            print(f"   Student Token: {self.student_token[:20]}...")
            return True
        return False

    def test_library_registration(self):
        """Test library user registration"""
        print("\n" + "="*50)
        print("TESTING LIBRARY REGISTRATION")
        print("="*50)
        
        # Use timestamp to ensure unique email/phone
        timestamp = str(int(datetime.now().timestamp()))
        
        library_data = {
            "name": "Test Library",
            "email": f"library{timestamp}@test.com",
            "password": "test123",
            "role": "library",
            "location": "Delhi",
            "bio": "Test library bio",
            "phone": f"876543{timestamp[-4:]}"
        }
        
        success, response = self.run_test(
            "Library Registration",
            "POST",
            "auth/register",
            200,
            data=library_data
        )
        
        if success and 'token' in response:
            self.library_token = response['token']
            self.library_user = response['user']
            print(f"   Library Token: {self.library_token[:20]}...")
            return True
        return False

    def test_authentication(self):
        """Test flexible login functionality (email or phone)"""
        print("\n" + "="*50)
        print("TESTING FLEXIBLE LOGIN SYSTEM")
        print("="*50)
        
        # Test student login with email
        student_login_email = {
            "identifier": "student@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Student Login with Email",
            "POST",
            "auth/login",
            200,
            data=student_login_email
        )
        
        if success and 'token' in response:
            self.student_token = response['token']
            self.student_user = response['user']
            print("   Student login with email successful")
        
        # Test student login with phone number
        student_login_phone = {
            "identifier": "9876543210",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Student Login with Phone",
            "POST",
            "auth/login",
            200,
            data=student_login_phone
        )
        
        if success and 'token' in response:
            print("   Student login with phone successful")
        
        # Test library login with email
        library_login_email = {
            "identifier": "library@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Library Login with Email",
            "POST",
            "auth/login",
            200,
            data=library_login_email
        )
        
        if success and 'token' in response:
            self.library_token = response['token']
            self.library_user = response['user']
            print("   Library login with email successful")
        
        # Test library login with phone
        library_login_phone = {
            "identifier": "9876543211",
            "password": "test123"
        }
        
        success, response = self.run_test(
            "Library Login with Phone",
            "POST",
            "auth/login",
            200,
            data=library_login_phone
        )
        
        if success and 'token' in response:
            print("   Library login with phone successful")
        
        # Test login with invalid credentials
        invalid_login = {
            "identifier": "student@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Login with Invalid Password",
            "POST",
            "auth/login",
            401,
            data=invalid_login
        )
        
        return success

    def test_profile_access(self):
        """Test profile access with tokens"""
        print("\n" + "="*50)
        print("TESTING PROFILE ACCESS")
        print("="*50)
        
        # Test student profile
        if self.student_token:
            success, response = self.run_test(
                "Student Profile Access",
                "GET",
                "auth/profile",
                200,
                token=self.student_token
            )
            if success:
                print(f"   Student Profile: {response.get('name')} ({response.get('role')})")
        
        # Test library profile
        if self.library_token:
            success, response = self.run_test(
                "Library Profile Access",
                "GET",
                "auth/profile",
                200,
                token=self.library_token
            )
            if success:
                print(f"   Library Profile: {response.get('name')} ({response.get('role')})")
        
        return success

    def test_book_marketplace(self):
        """Test book marketplace functionality"""
        print("\n" + "="*50)
        print("TESTING BOOK MARKETPLACE")
        print("="*50)
        
        if not self.student_token:
            print("❌ No student token available for book testing")
            return False
        
        # Test getting books (should work without auth)
        success, books = self.run_test(
            "Get All Books",
            "GET",
            "books",
            200
        )
        
        if success:
            print(f"   Found {len(books)} books")
        
        # Test adding a book (requires student auth)
        book_data = {
            "title": "Test Book",
            "author": "Test Author",
            "subject": "Computer Science",
            "price": 500.0,
            "condition": "good",
            "description": "A test book for API testing",
            "image_url": "https://example.com/book.jpg"
        }
        
        success, response = self.run_test(
            "Add Book (Student)",
            "POST",
            "books",
            200,
            data=book_data,
            token=self.student_token
        )
        
        if success:
            book_id = response.get('id')
            print(f"   Created book with ID: {book_id}")
            
            # Test getting specific book
            success, _ = self.run_test(
                "Get Specific Book",
                "GET",
                f"books/{book_id}",
                200
            )
        
        # Test library user trying to add book (should fail)
        if self.library_token:
            success, _ = self.run_test(
                "Add Book (Library - Should Fail)",
                "POST",
                "books",
                403,
                data=book_data,
                token=self.library_token
            )
        
        return success

    def test_subscription_plans(self):
        """Test subscription plans"""
        print("\n" + "="*50)
        print("TESTING SUBSCRIPTION PLANS")
        print("="*50)
        
        success, plans = self.run_test(
            "Get Subscription Plans",
            "GET",
            "subscription-plans",
            200
        )
        
        if success:
            print(f"   Found {len(plans)} subscription plans")
            for plan in plans:
                print(f"   - {plan.get('name')}: ₹{plan.get('price', 0)/100}")
        
        return success

    def test_competitions(self):
        """Test competitions functionality"""
        print("\n" + "="*50)
        print("TESTING COMPETITIONS")
        print("="*50)
        
        # Test getting competitions
        success, competitions = self.run_test(
            "Get Competitions",
            "GET",
            "competitions",
            200
        )
        
        if success:
            print(f"   Found {len(competitions)} competitions")
        
        # Test creating a competition (should work without specific auth in current implementation)
        comp_data = {
            "title": "Test Competition",
            "category": "Programming",
            "description": "A test programming competition",
            "deadline": "2024-12-31",
            "prizes": ["First Prize: ₹10000", "Second Prize: ₹5000"],
            "image_url": "https://example.com/comp.jpg",
            "registration_link": "https://example.com/register"
        }
        
        success, response = self.run_test(
            "Create Competition",
            "POST",
            "competitions",
            200,
            data=comp_data
        )
        
        if success:
            comp_id = response.get('id')
            print(f"   Created competition with ID: {comp_id}")
            
            # Test student registration for competition
            if self.student_token:
                success, _ = self.run_test(
                    "Register for Competition (Student)",
                    "POST",
                    f"competitions/{comp_id}/register",
                    200,
                    token=self.student_token
                )
        
        return success

    def test_notes_sharing(self):
        """Test notes sharing functionality"""
        print("\n" + "="*50)
        print("TESTING NOTES SHARING")
        print("="*50)
        
        if not self.student_token:
            print("❌ No student token available for notes testing")
            return False
        
        # Test getting notes
        success, notes = self.run_test(
            "Get All Notes",
            "GET",
            "notes",
            200
        )
        
        if success:
            print(f"   Found {len(notes)} notes")
        
        # Test creating a note
        note_data = {
            "title": "Test Notes",
            "subject": "Mathematics",
            "description": "Test notes for calculus",
            "visibility": "public",
            "file_url": "https://example.com/notes.pdf"
        }
        
        success, response = self.run_test(
            "Create Note (Student)",
            "POST",
            "notes",
            200,
            data=note_data,
            token=self.student_token
        )
        
        if success:
            note_id = response.get('id')
            print(f"   Created note with ID: {note_id}")
            
            # Test liking the note
            success, _ = self.run_test(
                "Like Note",
                "POST",
                f"notes/{note_id}/like",
                200,
                token=self.student_token
            )
        
        return success

    def test_social_feed(self):
        """Test social feed functionality"""
        print("\n" + "="*50)
        print("TESTING SOCIAL FEED")
        print("="*50)
        
        if not self.student_token:
            print("❌ No student token available for social testing")
            return False
        
        # Test getting posts
        success, posts = self.run_test(
            "Get All Posts",
            "GET",
            "posts",
            200
        )
        
        if success:
            print(f"   Found {len(posts)} posts")
        
        # Test creating a post
        post_data = {
            "content": "This is a test post from API testing!",
            "post_type": "text"
        }
        
        success, response = self.run_test(
            "Create Post (Student)",
            "POST",
            "posts",
            200,
            data=post_data,
            token=self.student_token
        )
        
        if success:
            post_id = response.get('id')
            print(f"   Created post with ID: {post_id}")
            
            # Test liking the post
            success, _ = self.run_test(
                "Like Post",
                "POST",
                f"posts/{post_id}/like",
                200,
                token=self.student_token
            )
            
            # Test adding comment
            comment_data = {"content": "Great post!"}
            success, _ = self.run_test(
                "Add Comment",
                "POST",
                f"posts/{post_id}/comment",
                200,
                data=comment_data,
                token=self.student_token
            )
        
        return success

    def test_messaging(self):
        """Test messaging functionality"""
        print("\n" + "="*50)
        print("TESTING MESSAGING")
        print("="*50)
        
        if not self.student_token or not self.library_token:
            print("❌ Need both student and library tokens for messaging testing")
            return False
        
        # Test sending message from student to library
        message_data = {
            "receiver_id": self.library_user['id'],
            "content": "Hello from student to library!"
        }
        
        success, _ = self.run_test(
            "Send Message (Student to Library)",
            "POST",
            "messages",
            200,
            data=message_data,
            token=self.student_token
        )
        
        if success:
            # Test getting conversation
            success, messages = self.run_test(
                "Get Conversation",
                "GET",
                f"messages/{self.library_user['id']}",
                200,
                token=self.student_token
            )
            
            if success:
                print(f"   Found {len(messages)} messages in conversation")
            
            # Test getting conversations list
            success, conversations = self.run_test(
                "Get Conversations List",
                "GET",
                "conversations",
                200,
                token=self.student_token
            )
            
            if success:
                print(f"   Found {len(conversations)} conversations")
        
        return success

def main():
    print("🚀 Starting UniNest API Testing")
    print("="*60)
    
    tester = UniNestAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Phone Number Validation", tester.test_phone_number_validation),
        ("Student Registration", tester.test_student_registration),
        ("Library Registration", tester.test_library_registration),
        ("Authentication", tester.test_authentication),
        ("Profile Access", tester.test_profile_access),
        ("Book Marketplace", tester.test_book_marketplace),
        ("Subscription Plans", tester.test_subscription_plans),
        ("Competitions", tester.test_competitions),
        ("Notes Sharing", tester.test_notes_sharing),
        ("Social Feed", tester.test_social_feed),
        ("Messaging", tester.test_messaging)
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
    print("\n" + "="*60)
    print("FINAL TEST RESULTS")
    print("="*60)
    print(f"📊 Tests Run: {tester.tests_run}")
    print(f"✅ Tests Passed: {tester.tests_passed}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed Test Categories: {', '.join(failed_tests)}")
    
    # Determine if backend is functional enough to proceed
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    
    if success_rate < 50:
        print(f"\n🚨 CRITICAL: Backend success rate is {success_rate:.1f}% - Too many failures to proceed with frontend testing")
        return 1
    elif success_rate < 80:
        print(f"\n⚠️  WARNING: Backend success rate is {success_rate:.1f}% - Some issues detected but proceeding with frontend testing")
        return 0
    else:
        print(f"\n✅ SUCCESS: Backend success rate is {success_rate:.1f}% - Backend is working well, proceeding with frontend testing")
        return 0

if __name__ == "__main__":
    sys.exit(main())