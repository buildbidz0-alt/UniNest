import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  User, 
  BookOpen, 
  Building2, 
  Calendar, 
  Trophy, 
  FileText, 
  MessageCircle, 
  Home,
  Plus,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  Star,
  MapPin,
  Clock,
  IndianRupee,
  Heart,
  Send,
  Filter
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Textarea } from './components/ui/textarea';
import { useToast } from './hooks/use-toast';
import { Toaster } from './components/ui/toaster';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// Socket connection
let socket;

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Initialize socket connection
      socket = io(BACKEND_URL);
      
      // Verify token and get user
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    // Initialize socket
    socket = io(BACKEND_URL);
    
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    const { token: newToken, user: newUser } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    
    // Initialize socket
    socket = io(BACKEND_URL);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// API Helper with auth
const apiRequest = (token) => {
  const instance = axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return instance;
};

// Login Page
function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    location: '',
    bio: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast({ title: "Login successful!" });
      } else {
        await register(formData);
        toast({ title: "Registration successful!" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">UniNest</h2>
          <p className="text-gray-600 mt-2">Your student community platform</p>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Welcome back to UniNest' : 'Join the UniNest community'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <Input
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="library">Library</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Phone (optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </>
              )}
              
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
              
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />

              {!isLogin && (
                <Textarea
                  placeholder="Bio (optional)"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={3}
                />
              )}

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Navigation Header
function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [notifications] = useState([]);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/books') return 'Book Marketplace';
    if (path === '/libraries') return 'Library Booking';
    if (path === '/competitions') return 'Competitions';
    if (path === '/notes') return 'Notes Sharing';
    if (path === '/social') return 'Social Feed';
    if (path === '/messages') return 'Messages';
    if (path === '/subscription') return 'Subscription';
    return 'UniNest';
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onMenuToggle} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

// Sidebar Navigation
function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const studentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Books', href: '/books', icon: BookOpen },
    { name: 'Libraries', href: '/libraries', icon: Building2 },
    { name: 'Competitions', href: '/competitions', icon: Trophy },
    { name: 'Notes', href: '/notes', icon: FileText },
    { name: 'Social Feed', href: '/social', icon: MessageCircle },
    { name: 'Messages', href: '/messages', icon: Send }
  ];

  const libraryNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Library', href: '/libraries', icon: Building2 },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Subscription', href: '/subscription', icon: Star }
  ];

  const navigation = user?.role === 'student' ? studentNavigation : libraryNavigation;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}
      
      <nav className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="p-4">
          <div className="flex items-center justify-between lg:justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UniNest</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

// Dashboard Component
function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const api = apiRequest(token);
      
      if (user.role === 'student') {
        // Fetch student dashboard data
        const [booksRes, notesRes, postsRes] = await Promise.all([
          api.get('/books?search=&status=available'),
          api.get('/notes'),
          api.get('/posts')
        ]);
        
        setStats({
          availableBooks: booksRes.data.length,
          totalNotes: notesRes.data.length,
          totalPosts: postsRes.data.length
        });
      } else {
        // Fetch library dashboard data
        const bookingsRes = await api.get('/bookings/my');
        const subscriptionRes = await api.get('/my-subscription');
        
        setStats({
          totalBookings: bookingsRes.data.length,
          hasSubscription: !!subscriptionRes.data.subscription
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here's what's happening in your UniNest community</p>
      </div>

      {user?.role === 'student' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Available Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.availableBooks || 0}</div>
              <p className="text-sm text-gray-600">Ready to purchase</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Shared Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalNotes || 0}</div>
              <p className="text-sm text-gray-600">Study materials</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Community Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalPosts || 0}</div>
              <p className="text-sm text-gray-600">Social interactions</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalBookings || 0}</div>
              <p className="text-sm text-gray-600">Seat reservations</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">
                {stats.hasSubscription ? 'Active' : 'Inactive'}
              </div>
              <p className="text-sm text-gray-600">Current plan status</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.role === 'student' ? (
              <>
                <Link to="/books">
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Books
                  </Button>
                </Link>
                <Link to="/libraries">
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Book Library Seat
                  </Button>
                </Link>
                <Link to="/competitions">
                  <Button className="w-full justify-start" variant="outline">
                    <Trophy className="h-4 w-4 mr-2" />
                    Join Competition
                  </Button>
                </Link>
                <Link to="/social">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Social Feed
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/libraries">
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Library
                  </Button>
                </Link>
                <Link to="/bookings">
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Bookings
                  </Button>
                </Link>
                <Link to="/subscription">
                  <Button className="w-full justify-start" variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slots
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Book Marketplace Component
function BookMarketplace() {
  const { user, token } = useAuth();
  const [books, setBooks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    subject: '',
    price: '',
    condition: 'good',
    description: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBooks();
  }, [searchTerm, selectedSubject]);

  const fetchBooks = async () => {
    try {
      const api = apiRequest(token);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);
      
      const response = await api.get(`/books?${params}`);
      setBooks(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch books",
        variant: "destructive"
      });
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const api = apiRequest(token);
      const bookData = {
        ...newBook,
        price: parseFloat(newBook.price)
      };
      
      const response = await api.post('/books', bookData);
      setBooks([response.data, ...books]);
      setNewBook({
        title: '',
        author: '',
        subject: '',
        price: '',
        condition: 'good',
        description: '',
        image_url: ''
      });
      setShowAddForm(false);
      toast({ title: "Book added successfully!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add book",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Book marketplace is only available for students.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book Marketplace</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Subjects</SelectItem>
            <SelectItem value="Mathematics">Mathematics</SelectItem>
            <SelectItem value="Physics">Physics</SelectItem>
            <SelectItem value="Chemistry">Chemistry</SelectItem>
            <SelectItem value="Computer Science">Computer Science</SelectItem>
            <SelectItem value="Biology">Biology</SelectItem>
            <SelectItem value="English">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add Book Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Book</CardTitle>
            <CardDescription>Share your book with the community</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Book Title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  required
                />
                <Input
                  placeholder="Author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Subject"
                  value={newBook.subject}
                  onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                  required
                />
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={newBook.price}
                  onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                  required
                />
                <Select value={newBook.condition} onValueChange={(value) => setNewBook({...newBook, condition: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="Image URL (optional)"
                value={newBook.image_url}
                onChange={(e) => setNewBook({...newBook, image_url: e.target.value})}
              />
              
              <Textarea
                placeholder="Description"
                value={newBook.description}
                onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                rows={3}
                required
              />
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Book'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              {book.image_url && (
                <img src={book.image_url} alt={book.title} className="w-full h-48 object-cover rounded-lg mb-3" />
              )}
              <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
              <CardDescription>by {book.author}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{book.subject}</Badge>
                  <Badge variant={book.condition === 'excellent' ? 'default' : 'outline'}>
                    {book.condition}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600 flex items-center">
                    <IndianRupee className="h-5 w-5" />
                    {book.price}
                  </span>
                  <Badge variant={book.status === 'available' ? 'default' : 'secondary'}>
                    {book.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{book.description}</p>
                
                {book.status === 'available' && (
                  <Button className="w-full mt-2" size="sm">
                    Contact Seller
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No books found. {user?.role === 'student' && 'Add the first book to get started!'}</p>
        </div>
      )}
    </div>
  );
}

// Main App Layout
function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="min-h-screen">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<BookMarketplace />} />
            <Route path="/libraries" element={<div className="p-6"><h1>Library Booking - Coming Soon</h1></div>} />
            <Route path="/competitions" element={<div className="p-6"><h1>Competitions - Coming Soon</h1></div>} />
            <Route path="/notes" element={<div className="p-6"><h1>Notes Sharing - Coming Soon</h1></div>} />
            <Route path="/social" element={<div className="p-6"><h1>Social Feed - Coming Soon</h1></div>} />
            <Route path="/messages" element={<div className="p-6"><h1>Messages - Coming Soon</h1></div>} />
            <Route path="/subscription" element={<div className="p-6"><h1>Subscription - Coming Soon</h1></div>} />
            <Route path="/bookings" element={<div className="p-6"><h1>Bookings - Coming Soon</h1></div>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App font-sans">
          <AuthWrapper />
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function AuthWrapper() {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading UniNest...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <AppLayout /> : <LoginPage />;
}

export default App;