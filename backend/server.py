from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, File, UploadFile, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import razorpay
import json
import socketio
from fastapi.responses import JSONResponse
import re

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Password setup
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default_secret')
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.environ.get('RAZORPAY_KEY_ID'),
    os.environ.get('RAZORPAY_KEY_SECRET', '')
))

# Socket.IO setup
sio = socketio.AsyncServer(cors_allowed_origins="*")

# FastAPI app
app = FastAPI(title="UniNest API", description="Student & Library Platform")
api_router = APIRouter(prefix="/api")

# Phone number validation
def validate_indian_phone(phone: str) -> bool:
    """Validate Indian phone number format"""
    pattern = r'^[6-9]\d{9}$'  # Indian mobile numbers start with 6-9 and have 10 digits
    return bool(re.match(pattern, phone))

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm="HS256")

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def create_free_trial_subscription(library_id: str, user_id: str):
    """Create a 3-month free trial subscription for new library users"""
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=90)  # 3 months = 90 days
    
    trial_subscription = LibrarySubscription(
        library_id=library_id,
        plan_id="trial",  # Special trial plan ID
        start_date=start_date,
        end_date=end_date,
        status="active",
        is_trial=True,
        payment_id="trial_period",
        order_id="trial_period"
    )
    
    await db.library_subscriptions.insert_one(trial_subscription.dict())
    return trial_subscription

# --- MODELS ---

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # "student" or "library"
    location: str
    bio: Optional[str] = ""
    phone: str  # Made mandatory
    
    def validate_phone(cls, v):
        if not validate_indian_phone(v):
            raise ValueError('Phone number must be a valid 10-digit Indian mobile number')
        return v

class UserLogin(BaseModel):
    identifier: str  # Can be email or phone
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    role: str
    location: str
    bio: str
    phone: str
    profile_image: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    location: str
    bio: str
    phone: str
    profile_image: str

# Book Models
class BookCreate(BaseModel):
    title: str
    author: str
    subject: str
    price: float
    condition: str  # "excellent", "good", "fair", "poor"
    description: str
    image_url: Optional[str] = ""

class Book(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author: str
    subject: str
    price: float
    condition: str
    description: str
    image_url: str
    seller_id: str
    status: str = "available"  # "available", "sold", "reserved"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    price: Optional[float] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None

# Library Models
class LibraryCreate(BaseModel):
    name: str
    description: str
    location: str
    facilities: List[str]
    total_seats: int

class Library(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: str
    facilities: List[str]
    total_seats: int
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TimeSlotCreate(BaseModel):
    library_id: str
    date: str
    start_time: str
    end_time: str
    available_seats: int

class TimeSlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    library_id: str
    date: str
    start_time: str
    end_time: str
    available_seats: int
    booked_seats: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    library_id: str
    time_slot_id: str
    date: str
    start_time: str
    end_time: str
    seats_requested: int = 1

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    library_id: str
    time_slot_id: str
    date: str
    start_time: str
    end_time: str
    seats_booked: int = 1
    status: str = "confirmed"  # "confirmed", "cancelled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subscription Models
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price: int  # in paise
    seat_limit: int
    duration: int = 30  # days
    features: List[str]

class LibrarySubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    library_id: str
    plan_id: str
    start_date: datetime
    end_date: datetime
    status: str = "active"  # "active", "expired", "cancelled"
    payment_id: Optional[str] = ""
    order_id: Optional[str] = ""
    is_trial: bool = False  # True if this is a free trial period

# Competition Models
class CompetitionCreate(BaseModel):
    title: str
    category: str
    description: str
    deadline: str
    prizes: List[str]
    image_url: Optional[str] = ""
    registration_link: Optional[str] = ""

class Competition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    description: str
    deadline: str
    prizes: List[str]
    image_url: str
    registration_link: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompetitionRegistration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    competition_id: str
    student_id: str
    registration_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Notes Models
class NoteCreate(BaseModel):
    title: str
    subject: str
    description: str
    visibility: str = "public"  # "public", "friends"
    file_url: Optional[str] = ""

class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subject: str
    description: str
    visibility: str
    file_url: str
    uploader_id: str
    likes: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Social Models
class PostCreate(BaseModel):
    content: str
    post_type: str = "text"  # "text", "link"

class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    post_type: str
    creator_id: str
    likes: List[str] = []  # user IDs who liked
    comments: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    content: str

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Payment Models
class PaymentOrder(BaseModel):
    amount: int  # in paise
    plan_id: str

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# --- AUTH ENDPOINTS ---

@api_router.post("/auth/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    # Validate phone number
    if not validate_indian_phone(user_data.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format. Please enter a valid 10-digit Indian mobile number.")
    
    # Check if user exists by email
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Check if phone number is already used
    existing_phone = await db.users.find_one({"phone": user_data.phone})
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number is already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        location=user_data.location,
        bio=user_data.bio,
        phone=user_data.phone
    )
    
    # Hash password and store
    hashed_password = hash_password(user_data.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token({"user_id": user.id, "role": user.role})
    
    return {
        "token": token,
        "user": UserResponse(**user.dict()),
        "message": "User registered successfully"
    }

@api_router.post("/auth/login", response_model=Dict[str, Any])
async def login(user_data: UserLogin):
    # Determine if identifier is email or phone
    identifier = user_data.identifier
    query = {}
    
    if '@' in identifier:
        # Login with email
        query["email"] = identifier
    else:
        # Login with phone
        if not validate_indian_phone(identifier):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
        query["phone"] = identifier
    
    # Find user by email or phone
    user = await db.users.find_one(query)
    
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_jwt_token({"user_id": user["id"], "role": user["role"]})
    
    return {
        "token": token,
        "user": UserResponse(**{k: v for k, v in user.items() if k != "password"}),
        "message": "Login successful"
    }

@api_router.get("/auth/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in current_user.items() if k != "password"})

# --- DASHBOARD DATA ENDPOINT ---

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["role"] == "student":
            # Get student stats
            my_books_count = await db.books.count_documents({"seller_id": current_user["id"]})
            available_books_count = await db.books.count_documents({"status": "available"})
            my_notes_count = await db.notes.count_documents({"uploader_id": current_user["id"]})
            my_bookings_count = await db.bookings.count_documents({"student_id": current_user["id"]})
            competitions_count = await db.competitions.count_documents({})
            
            return {
                "role": "student",
                "my_books": my_books_count,
                "available_books": available_books_count,
                "my_notes": my_notes_count,
                "my_bookings": my_bookings_count,
                "competitions": competitions_count,
                "recent_activity": []
            }
        else:
            # Get library stats
            my_library = await db.libraries.find_one({"owner_id": current_user["id"]})
            library_id = my_library["id"] if my_library else None
            
            total_bookings = await db.bookings.count_documents({"library_id": library_id}) if library_id else 0
            time_slots_count = await db.time_slots.count_documents({"library_id": library_id}) if library_id else 0
            
            # Check subscription (including free trial)
            subscription = None
            if library_id:
                subscription = await db.library_subscriptions.find_one({
                    "library_id": library_id,
                    "status": "active",
                    "end_date": {"$gt": datetime.now(timezone.utc)}
                })
            
            return {
                "role": "library",
                "has_library": bool(my_library),
                "library_name": my_library["name"] if my_library else "",
                "total_bookings": total_bookings,
                "time_slots": time_slots_count,
                "has_subscription": bool(subscription),
                "subscription": subscription,
                "recent_activity": []
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

# --- BOOK MARKETPLACE ENDPOINTS ---

@api_router.post("/books", response_model=Book)
async def create_book(book_data: BookCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can add books")
    
    book = Book(**book_data.dict(), seller_id=current_user["id"])
    await db.books.insert_one(book.dict())
    return book

@api_router.get("/books", response_model=List[Book])
async def get_books(
    search: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status: str = Query("available")
):
    query = {"status": status}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    
    books = await db.books.find(query).to_list(100)
    return [Book(**book) for book in books]

@api_router.get("/books/my")
async def get_my_books(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their books")
    
    books = await db.books.find({"seller_id": current_user["id"]}).to_list(100)
    return [Book(**book) for book in books]

@api_router.get("/books/{book_id}", response_model=Book)
async def get_book(book_id: str):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return Book(**book)

@api_router.put("/books/{book_id}")
async def update_book(
    book_id: str,
    book_update: BookUpdate,
    current_user: dict = Depends(get_current_user)
):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this book")
    
    update_data = {k: v for k, v in book_update.dict().items() if v is not None}
    if update_data:
        await db.books.update_one({"id": book_id}, {"$set": update_data})
    
    return {"message": "Book updated successfully"}

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, current_user: dict = Depends(get_current_user)):
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this book")
    
    await db.books.delete_one({"id": book_id})
    return {"message": "Book deleted successfully"}

# --- LIBRARY SYSTEM ENDPOINTS ---

@api_router.post("/libraries", response_model=Library)
async def create_library(library_data: LibraryCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "library":
        raise HTTPException(status_code=403, detail="Only libraries can create library profiles")
    
    # Check if library already exists for this user
    existing = await db.libraries.find_one({"owner_id": current_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Library profile already exists")
    
    library = Library(**library_data.dict(), owner_id=current_user["id"])
    await db.libraries.insert_one(library.dict())
    
    # Create 3-month free trial subscription for new library
    await create_free_trial_subscription(library.id, current_user["id"])
    
    return library

@api_router.get("/libraries", response_model=List[Library])
async def get_libraries(location: Optional[str] = Query(None)):
    query = {}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    libraries = await db.libraries.find(query).to_list(100)
    return [Library(**library) for library in libraries]

@api_router.get("/libraries/my")
async def get_my_library(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "library":
        raise HTTPException(status_code=403, detail="Only libraries can view their library")
    
    library = await db.libraries.find_one({"owner_id": current_user["id"]})
    if not library:
        raise HTTPException(status_code=404, detail="Library profile not found")
    
    return Library(**library)

@api_router.post("/timeslots", response_model=TimeSlot)
async def create_timeslot(slot_data: TimeSlotCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "library":
        raise HTTPException(status_code=403, detail="Only libraries can create time slots")
    
    # Check if library belongs to user
    library = await db.libraries.find_one({"id": slot_data.library_id, "owner_id": current_user["id"]})
    if not library:
        raise HTTPException(status_code=403, detail="Library not found or not owned by user")
    
    # Check subscription
    subscription = await db.library_subscriptions.find_one({
        "library_id": slot_data.library_id,
        "status": "active",
        "end_date": {"$gt": datetime.now(timezone.utc)}
    })
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required to create time slots")
    
    time_slot = TimeSlot(**slot_data.dict())
    await db.time_slots.insert_one(time_slot.dict())
    return time_slot

@api_router.get("/timeslots/{library_id}")
async def get_library_timeslots(library_id: str):
    slots = await db.time_slots.find({"library_id": library_id}).to_list(100)
    return [TimeSlot(**slot) for slot in slots]

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can make bookings")
    
    # Check if slot exists and has availability
    slot = await db.time_slots.find_one({"id": booking_data.time_slot_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
    
    if (slot["booked_seats"] + booking_data.seats_requested) > slot["available_seats"]:
        raise HTTPException(status_code=400, detail="Not enough seats available")
    
    # Create booking
    booking = Booking(
        student_id=current_user["id"],
        library_id=booking_data.library_id,
        time_slot_id=booking_data.time_slot_id,
        date=booking_data.date,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        seats_booked=booking_data.seats_requested
    )
    
    await db.bookings.insert_one(booking.dict())
    
    # Update slot
    await db.time_slots.update_one(
        {"id": booking_data.time_slot_id},
        {"$inc": {"booked_seats": booking_data.seats_requested}}
    )
    
    return booking

@api_router.get("/bookings/my")
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        # For libraries, get bookings for their libraries
        libraries = await db.libraries.find({"owner_id": current_user["id"]}).to_list(100)
        library_ids = [lib["id"] for lib in libraries]
        query["library_id"] = {"$in": library_ids}
    
    bookings = await db.bookings.find(query).to_list(100)
    return [Booking(**booking) for booking in bookings]

# --- SUBSCRIPTION & PAYMENT ENDPOINTS ---

# Predefined subscription plans
SUBSCRIPTION_PLANS = [
    SubscriptionPlan(
        id="basic", 
        name="Basic Plan", 
        price=50000,  # ₹500
        seat_limit=20,
        features=["Up to 20 seats", "Basic booking management", "Email support"]
    ),
    SubscriptionPlan(
        id="premium", 
        name="Premium Plan", 
        price=150000,  # ₹1500
        seat_limit=100,
        features=["Up to 100 seats", "Advanced analytics", "Priority support", "Custom branding"]
    )
]

@api_router.get("/subscription-plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/create-payment-order", response_model=Dict[str, Any])
async def create_payment_order(order_data: PaymentOrder, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "library":
        raise HTTPException(status_code=403, detail="Only libraries can subscribe")
    
    # Find plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p.id == order_data.plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get library
    library = await db.libraries.find_one({"owner_id": current_user["id"]})
    if not library:
        raise HTTPException(status_code=404, detail="Library profile required to subscribe")
    
    # Create Razorpay order
    razor_order = razorpay_client.order.create({
        "amount": plan.price,
        "currency": "INR",
        "payment_capture": 1
    })
    
    # Store order info
    await db.payment_orders.insert_one({
        "order_id": razor_order["id"],
        "user_id": current_user["id"],
        "library_id": library["id"],
        "plan_id": order_data.plan_id,
        "amount": plan.price,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "order_id": razor_order["id"],
        "amount": razor_order["amount"],
        "currency": razor_order["currency"],
        "key": os.environ.get('RAZORPAY_KEY_ID'),
        "plan": plan.dict()
    }

@api_router.post("/verify-payment")
async def verify_payment(payment_data: PaymentVerification, current_user: dict = Depends(get_current_user)):
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': payment_data.razorpay_order_id,
            'razorpay_payment_id': payment_data.razorpay_payment_id,
            'razorpay_signature': payment_data.razorpay_signature
        })
        
        # Get order details
        order = await db.payment_orders.find_one({"order_id": payment_data.razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Create subscription
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=30)
        
        subscription = LibrarySubscription(
            library_id=order["library_id"],
            plan_id=order["plan_id"],
            start_date=start_date,
            end_date=end_date,
            payment_id=payment_data.razorpay_payment_id,
            order_id=payment_data.razorpay_order_id
        )
        
        await db.library_subscriptions.insert_one(subscription.dict())
        
        # Update order status
        await db.payment_orders.update_one(
            {"order_id": payment_data.razorpay_order_id},
            {"$set": {"status": "completed"}}
        )
        
        return {"message": "Payment verified and subscription activated successfully"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

@api_router.get("/my-subscription")
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "library":
        raise HTTPException(status_code=403, detail="Only libraries have subscriptions")
    
    library = await db.libraries.find_one({"owner_id": current_user["id"]})
    if not library:
        return {"subscription": None}
    
    subscription = await db.library_subscriptions.find_one({
        "library_id": library["id"],
        "status": "active"
    })
    
    if not subscription:
        return {"subscription": None}
    
    # Get plan details
    plan = next((p for p in SUBSCRIPTION_PLANS if p.id == subscription["plan_id"]), None)
    
    return {
        "subscription": LibrarySubscription(**subscription),
        "plan": plan.dict() if plan else None
    }

# --- COMPETITIONS ENDPOINTS ---

@api_router.post("/competitions", response_model=Competition)
async def create_competition(comp_data: CompetitionCreate):
    # For now, allow anyone to create competitions (in real app, only admin)
    competition = Competition(**comp_data.dict())
    await db.competitions.insert_one(competition.dict())
    return competition

@api_router.get("/competitions", response_model=List[Competition])
async def get_competitions(category: Optional[str] = Query(None)):
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    competitions = await db.competitions.find(query).to_list(100)
    return [Competition(**comp) for comp in competitions]

@api_router.post("/competitions/{competition_id}/register")
async def register_for_competition(competition_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can register for competitions")
    
    # Check if competition exists
    competition = await db.competitions.find_one({"id": competition_id})
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    # Check if already registered
    existing = await db.competition_registrations.find_one({
        "competition_id": competition_id,
        "student_id": current_user["id"]
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already registered for this competition")
    
    registration = CompetitionRegistration(
        competition_id=competition_id,
        student_id=current_user["id"]
    )
    
    await db.competition_registrations.insert_one(registration.dict())
    return {"message": "Registration successful"}

@api_router.get("/competitions/my")
async def get_my_competitions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their competitions")
    
    registrations = await db.competition_registrations.find({"student_id": current_user["id"]}).to_list(100)
    competition_ids = [reg["competition_id"] for reg in registrations]
    
    competitions = await db.competitions.find({"id": {"$in": competition_ids}}).to_list(100)
    return [Competition(**comp) for comp in competitions]

# --- NOTES SHARING ENDPOINTS ---

@api_router.post("/notes", response_model=Note)
async def create_note(note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can share notes")
    
    note = Note(**note_data.dict(), uploader_id=current_user["id"])
    await db.notes.insert_one(note.dict())
    return note

@api_router.get("/notes", response_model=List[Note])
async def get_notes(subject: Optional[str] = Query(None), search: Optional[str] = Query(None)):
    query = {"visibility": "public"}
    
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    notes = await db.notes.find(query).to_list(100)
    return [Note(**note) for note in notes]

@api_router.get("/notes/my")
async def get_my_notes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can view their notes")
    
    notes = await db.notes.find({"uploader_id": current_user["id"]}).to_list(100)
    return [Note(**note) for note in notes]

@api_router.post("/notes/{note_id}/like")
async def like_note(note_id: str, current_user: dict = Depends(get_current_user)):
    note = await db.notes.find_one({"id": note_id})
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await db.notes.update_one({"id": note_id}, {"$inc": {"likes": 1}})
    return {"message": "Note liked"}

# --- SOCIAL FEED ENDPOINTS ---

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can create posts")
    
    post = Post(**post_data.dict(), creator_id=current_user["id"])
    await db.posts.insert_one(post.dict())
    
    # Emit real-time update
    await sio.emit('new_post', post.dict())
    
    return post

@api_router.get("/posts", response_model=List[Post])
async def get_posts():
    posts = await db.posts.find().sort("created_at", -1).to_list(100)
    return [Post(**post) for post in posts]

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    likes = post.get("likes", [])
    if current_user["id"] in likes:
        likes.remove(current_user["id"])
    else:
        likes.append(current_user["id"])
    
    await db.posts.update_one({"id": post_id}, {"$set": {"likes": likes}})
    return {"message": "Post liked/unliked", "likes_count": len(likes)}

@api_router.post("/posts/{post_id}/comment")
async def add_comment(post_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "id": str(uuid.uuid4()),
        "content": comment_data.content,
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    comments = post.get("comments", [])
    comments.append(comment)
    
    await db.posts.update_one({"id": post_id}, {"$set": {"comments": comments}})
    return {"message": "Comment added", "comment": comment}

# --- MESSAGING ENDPOINTS ---

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    message = Message(
        sender_id=current_user["id"],
        **message_data.dict()
    )
    
    await db.messages.insert_one(message.dict())
    
    # Emit real-time message
    await sio.emit('new_message', message.dict(), room=message_data.receiver_id)
    
    return {"message": "Message sent successfully"}

@api_router.get("/messages/{user_id}")
async def get_conversation(user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]
    }).sort("created_at", 1).to_list(1000)
    
    return [Message(**msg) for msg in messages]

@api_router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    # Get unique users who have messaged with current user
    pipeline = [
        {"$match": {
            "$or": [
                {"sender_id": current_user["id"]},
                {"receiver_id": current_user["id"]}
            ]
        }},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {
                "$cond": [
                    {"$eq": ["$sender_id", current_user["id"]]},
                    "$receiver_id",
                    "$sender_id"
                ]
            },
            "last_message": {"$first": "$$ROOT"}
        }}
    ]
    
    conversations = await db.messages.aggregate(pipeline).to_list(100)
    
    # Get user details for each conversation
    result = []
    for conv in conversations:
        user = await db.users.find_one({"id": conv["_id"]})
        if user:
            result.append({
                "user": UserResponse(**{k: v for k, v in user.items() if k != "password"}),
                "last_message": Message(**conv["last_message"])
            })
    
    return result

# --- BASIC ENDPOINTS ---

@api_router.get("/")
async def root():
    return {"message": "UniNest API is running!", "status": "active"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router
app.include_router(api_router)

# Add Socket.IO support
app.mount("/socket.io", socketio.ASGIApp(sio))

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# --- SOCKET.IO EVENTS ---

@sio.event
async def connect(sid, environ):
    print(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    print(f"Client {sid} disconnected")

@sio.event
async def join_room(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)