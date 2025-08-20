import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useRazorpay, RazorpayOrderOptions } from 'react-razorpay';
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
  Filter,
  ArrowRight,
  Check,
  Users,
  Zap,
  Shield,
  Globe,
  Mail,
  Phone,
  ChevronRight,
  Edit,
  Trash,
  Eye,
  Settings,
  CreditCard,
  CheckCircle,
  AlertCircle
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
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { format } from 'date-fns';
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

  const login = async (identifier, password) => {
    const response = await axios.post(`${API}/auth/login`, { identifier, password });
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

// Home Page Component
function HomePage() {
  const features = [
    {
      icon: BookOpen,
      title: "Book Marketplace",
      description: "Buy and sell textbooks with fellow students at great prices"
    },
    {
      icon: Building2,
      title: "Library Booking",
      description: "Reserve study seats at your favorite libraries instantly"
    },
    {
      icon: Trophy,
      title: "Competitions",
      description: "Participate in academic competitions and win prizes"
    },
    {
      icon: FileText,
      title: "Notes Sharing",
      description: "Share and access study materials from your community"
    },
    {
      icon: MessageCircle,
      title: "Social Community",
      description: "Connect with peers, share experiences, and grow together"
    },
    {
      icon: Users,
      title: "Library Partners",
      description: "Libraries can manage bookings and grow their community"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Students" },
    { number: "500+", label: "Partner Libraries" },
    { number: "50,000+", label: "Books Exchanged" },
    { number: "1,000+", label: "Study Sessions" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UniNest</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Your Student Community
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with fellow students, share resources, book study spaces, and participate in competitions. 
            UniNest is your one-stop platform for academic success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 px-8">
                Join as Student
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8">
                Register Library
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From buying textbooks to booking library seats, UniNest has all the tools you need for academic success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Join UniNest?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students and libraries already using UniNest to enhance their academic journey.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 px-8">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">UniNest</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering students and libraries to build stronger educational communities across India.
              </p>
              <div className="flex space-x-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">hello@uninest.com</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/login" className="hover:text-white">For Students</Link></li>
                <li><Link to="/login" className="hover:text-white">For Libraries</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 UniNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// About Us Page Component
function AboutPage() {
  const teamValues = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in the power of student communities to drive learning and growth."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Continuously evolving to meet the changing needs of modern education."
    },
    {
      icon: Shield,
      title: "Trust & Security",
      description: "Building safe, secure platforms where students can connect with confidence."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making quality educational resources accessible to students everywhere."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UniNest</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link to="/about" className="text-blue-600 font-medium">About</Link>
              <Link to="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            About
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              UniNest
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            We're on a mission to transform how students and libraries connect, collaborate, and thrive together in the digital age.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600 mb-4">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-lg leading-relaxed">
                  UniNest exists to create a vibrant marketplace and community built exclusively for students and libraries across India. 
                  We empower learners to easily exchange textbooks, share study notes, book library seats, join competitions, 
                  and engage with peers—all within one seamless, mobile-friendly ecosystem.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-600 mb-4">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become India's leading student-centric platform that democratizes access to quality study resources and spaces, 
                  inspiring peer mentorship, group studies, and creative academic competitions while ensuring every student, 
                  regardless of location or background, has the tools and community support to achieve their dreams.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who We Serve</h2>
            <p className="text-xl text-gray-600">Building bridges between students and educational institutions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl">
              <CardHeader>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 mb-4">
                  From freshers to final-year scholars, UniNest is your go-to hub for exchanging educational resources, 
                  participating in academic competitions, connecting with study groups, and discovering opportunities tailored for your success.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Buy & sell textbooks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Share study notes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Book library seats</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Join competitions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-xl">
              <CardHeader>
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">Libraries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 mb-4">
                  We empower libraries with smart booking systems and subscription management, enabling them to offer better facilities 
                  and services while building stronger relationships with their student communities.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Manage bookings efficiently</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Flexible subscription plans</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Connect with students</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4" />
                    <span>Grow your community</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamValues.map((value, index) => (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Our Vision for the Future</h2>
          <p className="text-xl text-blue-100 mb-8">
            We're just getting started. Here's what we envision for the future of student communities:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">Expanding Reach</h3>
              <p className="text-blue-100">
                Growing into tier 2 and 3 cities to democratize access to quality study resources and spaces nationwide.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">AI-Powered Learning</h3>
              <p className="text-blue-100">
                Introducing AI-driven personalized learning recommendations and intelligent study aids.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">Social Learning Network</h3>
              <p className="text-blue-100">
                Building a vibrant social network that inspires peer mentorship and collaborative learning.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="text-white font-semibold mb-2">Seamless Integration</h3>
              <p className="text-blue-100">
                Launching comprehensive payment and subscription services for sustainable growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Join Us at UniNest
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Where students find their place to learn, connect, and grow.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 px-8">
              Get Started Today
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">UniNest</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering students and libraries to build stronger educational communities across India.
              </p>
              <div className="flex space-x-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-gray-400">hello@uninest.com</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/login" className="hover:text-white">For Students</Link></li>
                <li><Link to="/login" className="hover:text-white">For Libraries</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 UniNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // Can be email or phone
    password: '',
    role: 'student',
    location: '',
    bio: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.identifier, formData.password);
        toast({ title: "Login successful!" });
      } else {
        // Validate phone number for registration
        if (!validatePhoneNumber(formData.phone)) {
          toast({
            title: "Invalid Phone Number",
            description: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const registrationData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          location: formData.location,
          bio: formData.bio,
          phone: formData.phone
        };
        
        await register(registrationData);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">UniNest</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">Home</Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">About</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
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
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                    <div className="space-y-2">
                      <Input
                        type="tel"
                        placeholder="Phone Number (10 digits)"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        maxLength={10}
                      />
                      <p className="text-xs text-gray-500">Enter 10-digit mobile number (e.g., 9876543210)</p>
                    </div>
                  </>
                )}

                {isLogin && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Email or Phone Number"
                      value={formData.identifier}
                      onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                      required
                    />
                    <p className="text-xs text-gray-500">You can login with either email or phone number</p>
                  </div>
                )}
                
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
    { name: 'My Library', href: '/library-profile', icon: Building2 },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Subscription', href: '/subscription', icon: Star }
  ];

  const navigation = user?.role === 'student' ? studentNavigation : libraryNavigation;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose} 
        />
      )}
      
      {/* Sidebar */}
      <nav className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out z-50
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 lg:justify-center">
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

          {/* Navigation */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={onClose}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info at Bottom */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

// Dashboard Component with Fixed Data Fetching
function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const api = apiRequest(token);
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
      // Set default stats to prevent UI from breaking
      setStats({
        role: user?.role,
        my_books: 0,
        available_books: 0,
        my_notes: 0,
        my_bookings: 0,
        competitions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
              <CardTitle className="text-lg">My Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.my_books || 0}</div>
              <p className="text-sm text-gray-600">Books you're selling</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Available Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.available_books || 0}</div>
              <p className="text-sm text-gray-600">Ready to purchase</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">My Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.my_notes || 0}</div>
              <p className="text-sm text-gray-600">Notes shared</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.my_bookings || 0}</div>
              <p className="text-sm text-gray-600">Seat reservations</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Competitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.competitions || 0}</div>
              <p className="text-sm text-gray-600">Available to join</p>
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
              <div className="text-3xl font-bold text-blue-600">{stats.total_bookings || 0}</div>
              <p className="text-sm text-gray-600">Seat reservations</p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">
                {stats.has_subscription ? 'Active' : 'Inactive'}
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
                <Link to="/library-profile">
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
  const [myBooks, setMyBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('browse');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [editingBook, setEditingBook] = useState(null);
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
    if (user?.role === 'student') {
      fetchMyBooks();
    }
  }, [searchTerm, selectedSubject]);

  const fetchBooks = async () => {
    try {
      const api = apiRequest(token);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject && selectedSubject !== 'all') params.append('subject', selectedSubject);
      
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

  const fetchMyBooks = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/books/my');
      setMyBooks(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch your books",
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
      
      if (editingBook) {
        await api.put(`/books/${editingBook.id}`, bookData);
        toast({ title: "Book updated successfully!" });
        setEditingBook(null);
      } else {
        await api.post('/books', bookData);
        toast({ title: "Book added successfully!" });
      }
      
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
      fetchBooks();
      fetchMyBooks();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save book",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book) => {
    setNewBook(book);
    setEditingBook(book);
    setShowAddForm(true);
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;

    try {
      const api = apiRequest(token);
      await api.delete(`/books/${bookId}`);
      toast({ title: "Book deleted successfully!" });
      fetchBooks();
      fetchMyBooks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive"
      });
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
        <Button onClick={() => {setShowAddForm(!showAddForm); setEditingBook(null); setNewBook({
          title: '',
          author: '',
          subject: '',
          price: '',
          condition: 'good',
          description: '',
          image_url: ''
        });}} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Book
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Books</TabsTrigger>
          <TabsTrigger value="my-books">My Books</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Biology">Biology</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                        <Send className="h-4 w-4 mr-2" />
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
              <p className="text-gray-600">No books found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-books" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myBooks.map((book) => (
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
                    
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleEditBook(book)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBook(book.id)}>
                        <Trash className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {myBooks.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">You haven't listed any books yet. Add your first book to get started!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Book Form */}
      {showAddForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingBook ? 'Edit Book' : 'Add New Book'}</CardTitle>
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
                  {loading ? 'Saving...' : (editingBook ? 'Update Book' : 'Add Book')}
                </Button>
                <Button type="button" variant="outline" onClick={() => {setShowAddForm(false); setEditingBook(null);}}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Library Booking System Component
function LibraryBooking() {
  const { user, token } = useAuth();
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLibraries();
    if (user?.role === 'student') {
      fetchMyBookings();
    }
  }, []);

  const fetchLibraries = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/libraries');
      setLibraries(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch libraries",
        variant: "destructive"
      });
    }
  };

  const fetchTimeSlots = async (libraryId) => {
    try {
      const api = apiRequest(token);
      const response = await api.get(`/timeslots/${libraryId}`);
      setTimeSlots(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch time slots",
        variant: "destructive"
      });
    }
  };

  const fetchMyBookings = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/bookings/my');
      setMyBookings(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive"
      });
    }
  };

  const handleLibrarySelect = (library) => {
    setSelectedLibrary(library);
    fetchTimeSlots(library.id);
  };

  const handleBookSeat = async (timeSlot) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        description: "Choose a date for your booking",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const api = apiRequest(token);
      await api.post('/bookings', {
        library_id: selectedLibrary.id,
        time_slot_id: timeSlot.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        seats_requested: 1
      });
      
      toast({ title: "Seat booked successfully!" });
      fetchMyBookings();
      fetchTimeSlots(selectedLibrary.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to book seat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Library booking is only available for students.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Library Booking</h1>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Libraries</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Libraries List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-semibold text-lg">Available Libraries</h3>
              {libraries.map((library) => (
                <Card key={library.id} 
                      className={`cursor-pointer hover:shadow-lg transition-shadow ${
                        selectedLibrary?.id === library.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleLibrarySelect(library)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{library.name}</CardTitle>
                    <CardDescription>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          {library.location}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {library.total_seats} seats
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">{library.description}</p>
                    {library.facilities && library.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {library.facilities.map((facility, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Booking Interface */}
            <div className="lg:col-span-2">
              {selectedLibrary ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Book a Seat at {selectedLibrary.name}</CardTitle>
                    <CardDescription>Select a date and time slot for your study session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start">
                            <Calendar className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <h4 className="font-medium mb-3">Available Time Slots</h4>
                      {timeSlots.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {timeSlots.map((slot) => (
                            <Card key={slot.id} className="border hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center text-sm font-medium">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {slot.start_time} - {slot.end_time}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {slot.available_seats - slot.booked_seats} seats available
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleBookSeat(slot)}
                                    disabled={loading || slot.booked_seats >= slot.available_seats}
                                  >
                                    {loading ? 'Booking...' : 'Book'}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600">No time slots available for this library.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Select a library to view available time slots</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="my-bookings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Booking #{booking.id.slice(-6)}</CardTitle>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {booking.date}
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      {booking.start_time} - {booking.end_time}
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      {booking.seats_booked} seat(s)
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {myBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">You haven't made any bookings yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Library Profile & Subscription Management
function LibraryProfile() {
  const { user, token } = useAuth();
  const [Razorpay] = useRazorpay();
  const [library, setLibrary] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [showLibraryForm, setShowLibraryForm] = useState(false);
  const [libraryData, setLibraryData] = useState({
    name: '',
    description: '',
    location: '',
    facilities: [],
    total_seats: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.role === 'library') {
      fetchLibraryProfile();
      fetchSubscription();
      fetchSubscriptionPlans();
    }
  }, [user]);

  const fetchLibraryProfile = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/libraries/my');
      setLibrary(response.data);
    } catch (error) {
      // Library profile doesn't exist yet
      setShowLibraryForm(true);
    }
  };

  const fetchSubscription = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/my-subscription');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.log('No subscription found');
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const api = apiRequest(token);
      const response = await api.get('/subscription-plans');
      setSubscriptionPlans(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive"
      });
    }
  };

  const handleCreateLibrary = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const api = apiRequest(token);
      const response = await api.post('/libraries', {
        ...libraryData,
        total_seats: parseInt(libraryData.total_seats),
        facilities: libraryData.facilities.filter(f => f.trim() !== '')
      });
      
      setLibrary(response.data);
      setShowLibraryForm(false);
      toast({ title: "Library profile created successfully!" });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create library profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!library) {
      toast({
        title: "Library Profile Required",
        description: "Please create your library profile first",
        variant: "destructive"
      });
      return;
    }

    try {
      const api = apiRequest(token);
      const response = await api.post('/create-payment-order', {
        plan_id: plan.id,
        amount: plan.price
      });

      const options = {
        key: response.data.key,
        amount: response.data.amount,
        currency: response.data.currency,
        name: "UniNest Subscription",
        description: `${plan.name} - ${plan.seat_limit} seats`,
        order_id: response.data.order_id,
        handler: async (paymentResponse) => {
          try {
            await api.post('/verify-payment', {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            
            toast({ title: "Subscription activated successfully!" });
            fetchSubscription();
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: error.response?.data?.detail || "Please contact support",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to initiate payment",
        variant: "destructive"
      });
    }
  };

  if (user?.role !== 'library') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">This page is only available for library users.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Library Management</h1>

      {/* Library Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Library Profile</CardTitle>
          <CardDescription>Manage your library information and settings</CardDescription>
        </CardHeader>
        <CardContent>
          {library ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Library Name</label>
                  <p className="text-lg font-semibold">{library.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p>{library.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                  <p>{library.total_seats}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facilities</label>
                  <div className="flex flex-wrap gap-1">
                    {library.facilities?.map((facility, index) => (
                      <Badge key={index} variant="outline">{facility}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-600">{library.description}</p>
              </div>
              <Button variant="outline" onClick={() => setShowLibraryForm(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          ) : showLibraryForm ? (
            <form onSubmit={handleCreateLibrary} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Library Name"
                  value={libraryData.name}
                  onChange={(e) => setLibraryData({...libraryData, name: e.target.value})}
                  required
                />
                <Input
                  placeholder="Location"
                  value={libraryData.location}
                  onChange={(e) => setLibraryData({...libraryData, location: e.target.value})}
                  required
                />
              </div>
              
              <Input
                type="number"
                placeholder="Total Seats"
                value={libraryData.total_seats}
                onChange={(e) => setLibraryData({...libraryData, total_seats: e.target.value})}
                required
              />
              
              <Textarea
                placeholder="Description"
                value={libraryData.description}
                onChange={(e) => setLibraryData({...libraryData, description: e.target.value})}
                rows={3}
                required
              />
              
              <Input
                placeholder="Facilities (comma separated)"
                value={libraryData.facilities.join(', ')}
                onChange={(e) => setLibraryData({...libraryData, facilities: e.target.value.split(',').map(f => f.trim())})}
              />
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Library Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowLibraryForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Create your library profile to get started</p>
              <Button onClick={() => setShowLibraryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Library Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription to accept bookings</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-900">Active Subscription</p>
                    <p className="text-sm text-green-700">
                      Valid until {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">You need an active subscription to create time slots and accept bookings.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        <Badge variant="outline">{plan.seat_limit} seats</Badge>
                      </CardTitle>
                      <div className="text-3xl font-bold text-blue-600">
                        ₹{plan.price / 100}
                        <span className="text-sm font-normal text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features?.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-600 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        onClick={() => handleSubscribe(plan)}
                        disabled={!library}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
            <Route path="/libraries" element={<LibraryBooking />} />
            <Route path="/library-profile" element={<LibraryProfile />} />
            <Route path="/subscription" element={<LibraryProfile />} />
            <Route path="/competitions" element={<div className="p-6"><h1>Competitions - Coming Soon</h1></div>} />
            <Route path="/notes" element={<div className="p-6"><h1>Notes Sharing - Coming Soon</h1></div>} />
            <Route path="/social" element={<div className="p-6"><h1>Social Feed - Coming Soon</h1></div>} />
            <Route path="/messages" element={<div className="p-6"><h1>Messages - Coming Soon</h1></div>} />
            <Route path="/bookings" element={<div className="p-6"><h1>Bookings Management - Coming Soon</h1></div>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Public Routes Wrapper
function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
  
  return isAuthenticated ? <AppLayout /> : <PublicRoutes />;
}

export default App;