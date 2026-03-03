import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Folder, FolderOpen, ChevronRight, ChevronDown, CheckCircle2, Circle, Clock, Plus, Settings, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, Send, Wrench, Sparkles, FileText, Image, LogOut, ChevronUp, X, MoreVertical, SplitSquareHorizontal, Maximize2, Share2, Users, Wifi, WifiOff, Loader2, Menu, Mail, Lock, AlertCircle, Trash2, Pencil, FolderEdit, Bell, UserMinus, UserCog, ArrowLeft, RefreshCw, CheckCircle, Sun, Moon, Palette, Upload, RotateCcw, Plug, Power, Zap, Terminal, Globe, Database, MessageSquare, Github, Pin, HelpCircle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import useCollaboration, { collaborationAPI } from './useCollaboration';
import Onboarding from './Onboarding';

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper function to generate avatar color from email
const getAvatarColor = (email) => {
  const colors = [
    'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Admin user email - only admin can manage users
const ADMIN_EMAIL = 'admin@unit4.com';

// PSO Roles for user assignment
const PSO_ROLES = [
  { id: 'consultant', name: 'Consultant', description: 'Implementation consultant' },
  { id: 'senior_consultant', name: 'Senior Consultant', description: 'Senior implementation consultant' },
  { id: 'principal_consultant', name: 'Principal Consultant', description: 'Principal implementation consultant' },
  { id: 'project_manager', name: 'Project Manager', description: 'Manages project delivery' },
  { id: 'solution_architect', name: 'Solution Architect', description: 'Designs technical solutions' },
  { id: 'technical_consultant', name: 'Technical Consultant', description: 'Technical implementation specialist' },
  { id: 'functional_consultant', name: 'Functional Consultant', description: 'Functional area specialist' },
  { id: 'team_lead', name: 'Team Lead', description: 'Leads consulting teams' },
  { id: 'practice_manager', name: 'Practice Manager', description: 'Manages PSO practice area' },
  { id: 'admin', name: 'Administrator', description: 'System administrator' }
];

// Storage key for global app settings (admin-controlled)
const APP_SETTINGS_KEY = 'ava_app_settings';

// Default app settings
const DEFAULT_APP_SETTINGS = {
  logoUrl: 'https://www.unit4.com/sites/default/files/images/logo.svg',
  themeColor: 'green', // green, blue, purple, orange, teal, rose, indigo
  appName: 'Ava',
  mcpPlugins: [] // MCP plugin configurations
};

// MCP Plugin Templates for quick setup
const MCP_PLUGIN_TEMPLATES = [
  {
    id: 'filesystem',
    name: 'Filesystem Access',
    description: 'Read and write files on the local system',
    icon: 'FileText',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory']
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for information',
    icon: 'Globe',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search']
  },
  {
    id: 'slack',
    name: 'Slack Integration',
    description: 'Send and read Slack messages',
    icon: 'MessageSquare',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack']
  },
  {
    id: 'github',
    name: 'GitHub Integration',
    description: 'Interact with GitHub repositories',
    icon: 'Github',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github']
  },
  {
    id: 'database',
    name: 'Database Connector',
    description: 'Query SQL databases',
    icon: 'Database',
    type: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres']
  }
];

// Theme color configurations
const THEME_COLORS = {
  green: {
    primary: 'bg-green-500',
    primaryHover: 'hover:bg-green-600',
    primaryText: 'text-green-600',
    primaryLight: 'bg-green-100',
    primaryLightHover: 'hover:bg-green-200',
    primaryBorder: 'border-green-500',
    primaryRing: 'ring-green-100',
    primaryDarkBg: 'bg-green-900/50',
    primaryDarkText: 'text-green-400',
    hex: '#22c55e'
  },
  blue: {
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    primaryText: 'text-blue-600',
    primaryLight: 'bg-blue-100',
    primaryLightHover: 'hover:bg-blue-200',
    primaryBorder: 'border-blue-500',
    primaryRing: 'ring-blue-100',
    primaryDarkBg: 'bg-blue-900/50',
    primaryDarkText: 'text-blue-400',
    hex: '#3b82f6'
  },
  purple: {
    primary: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-600',
    primaryText: 'text-purple-600',
    primaryLight: 'bg-purple-100',
    primaryLightHover: 'hover:bg-purple-200',
    primaryBorder: 'border-purple-500',
    primaryRing: 'ring-purple-100',
    primaryDarkBg: 'bg-purple-900/50',
    primaryDarkText: 'text-purple-400',
    hex: '#a855f7'
  },
  orange: {
    primary: 'bg-orange-500',
    primaryHover: 'hover:bg-orange-600',
    primaryText: 'text-orange-600',
    primaryLight: 'bg-orange-100',
    primaryLightHover: 'hover:bg-orange-200',
    primaryBorder: 'border-orange-500',
    primaryRing: 'ring-orange-100',
    primaryDarkBg: 'bg-orange-900/50',
    primaryDarkText: 'text-orange-400',
    hex: '#f97316'
  },
  teal: {
    primary: 'bg-teal-500',
    primaryHover: 'hover:bg-teal-600',
    primaryText: 'text-teal-600',
    primaryLight: 'bg-teal-100',
    primaryLightHover: 'hover:bg-teal-200',
    primaryBorder: 'border-teal-500',
    primaryRing: 'ring-teal-100',
    primaryDarkBg: 'bg-teal-900/50',
    primaryDarkText: 'text-teal-400',
    hex: '#14b8a6'
  },
  rose: {
    primary: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-600',
    primaryText: 'text-rose-600',
    primaryLight: 'bg-rose-100',
    primaryLightHover: 'hover:bg-rose-200',
    primaryBorder: 'border-rose-500',
    primaryRing: 'ring-rose-100',
    primaryDarkBg: 'bg-rose-900/50',
    primaryDarkText: 'text-rose-400',
    hex: '#f43f5e'
  },
  indigo: {
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    primaryText: 'text-indigo-600',
    primaryLight: 'bg-indigo-100',
    primaryLightHover: 'hover:bg-indigo-200',
    primaryBorder: 'border-indigo-500',
    primaryRing: 'ring-indigo-100',
    primaryDarkBg: 'bg-indigo-900/50',
    primaryDarkText: 'text-indigo-400',
    hex: '#6366f1'
  }
};

// Save global app settings to localStorage
const saveAppSettings = (settings) => {
  try {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
};

// Load global app settings from localStorage
const loadAppSettings = () => {
  try {
    const data = localStorage.getItem(APP_SETTINGS_KEY);
    return data ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) } : DEFAULT_APP_SETTINGS;
  } catch (e) {
    console.error('Failed to load app settings:', e);
    return DEFAULT_APP_SETTINGS;
  }
};

// ============================================
// User-Isolated localStorage Helpers
// ============================================
// These helpers ensure each user's data is stored separately
// and synced with the backend for persistence across devices

const USER_STORAGE_PREFIX = 'ava_user_';
const LAST_USER_KEY = 'ava_last_user';

// Get the localStorage key for a specific user
const getUserStorageKey = (email) => {
  return `${USER_STORAGE_PREFIX}${email.toLowerCase()}`;
};

// Save user data to localStorage (user-isolated)
const saveUserToLocalStorage = (email, data) => {
  try {
    const key = getUserStorageKey(email);
    localStorage.setItem(key, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString()
    }));
    // Track the last logged-in user
    localStorage.setItem(LAST_USER_KEY, email.toLowerCase());
    return true;
  } catch (e) {
    console.error('Failed to save user data to localStorage:', e);
    return false;
  }
};

// Load user data from localStorage (user-isolated)
const loadUserFromLocalStorage = (email) => {
  try {
    const key = getUserStorageKey(email);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load user data from localStorage:', e);
    return null;
  }
};

// Clear all other users' data from localStorage (prevents data bleeding)
const clearOtherUsersFromLocalStorage = (currentEmail) => {
  try {
    const keysToRemove = [];
    const currentKey = getUserStorageKey(currentEmail);

    // Find all user-specific keys that aren't the current user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_STORAGE_PREFIX) && key !== currentKey) {
        keysToRemove.push(key);
      }
    }

    // Remove other users' data
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared localStorage for: ${key}`);
    });

    return keysToRemove.length;
  } catch (e) {
    console.error('Failed to clear other users from localStorage:', e);
    return 0;
  }
};

// Check if cached data is stale (older than specified minutes)
const isCachedDataStale = (data, maxAgeMinutes = 60) => {
  if (!data?.lastUpdated) return true;
  const lastUpdated = new Date(data.lastUpdated);
  const now = new Date();
  const diffMinutes = (now - lastUpdated) / (1000 * 60);
  return diffMinutes > maxAgeMinutes;
};

// ============================================

// Default folders/tasks for new users
const getDefaultFolders = () => [
  {
    id: 'folder-0',
    name: 'My Tasks',
    isProtected: true, // Cannot be renamed or deleted
    tasks: [
      { id: 'task-today', title: 'Today', status: 'pending' },
      { id: 'task-absences', title: 'Absences', status: 'pending' },
      { id: 'task-timesheets', title: 'Timesheets', status: 'pending' },
      { id: 'task-expenses', title: 'Expenses', status: 'pending' },
      { id: 'task-payslips', title: 'Payslips', status: 'pending' },
    ],
  },
  {
    id: 'folder-financials',
    name: 'Project Financials',
    isProtected: true,
    tasks: [
      { id: 'task-project-overview', title: 'Project Overview', status: 'pending' },
      { id: 'task-revenue-billing', title: 'Revenue & Billing', status: 'pending' },
      { id: 'task-resource-utilisation', title: 'Resource Utilisation', status: 'pending' },
      { id: 'task-project-margins', title: 'Project Margins', status: 'pending' },
      { id: 'task-forecasting', title: 'Forecasting', status: 'pending' },
      { id: 'task-budget-tracking', title: 'Budget Tracking', status: 'pending' },
    ],
  },
  {
    id: 'folder-shared',
    name: 'Shared with Me',
    isProtected: true, // Cannot be renamed or deleted - auto-populated
    isSharedFolder: true, // Special flag for shared tasks
    tasks: [],
  },
  {
    id: 'folder-notepad',
    name: 'Notepad',
    isProtected: false,
    tasks: [],
  },
];

// Financial Insights data for the Data Insights panel in Tools & Actions
const FINANCIAL_INSIGHTS = {
  'project overview': {
    title: 'Portfolio Health',
    kpis: [
      { label: 'Active Projects', value: '7', status: 'neutral' },
      { label: 'Healthy', value: '4', status: 'good' },
      { label: 'At Risk', value: '2', status: 'warning' },
      { label: 'Critical', value: '1', status: 'bad' },
    ],
    bars: [
      { label: 'Contoso ERP', value: 65, max: 100, suffix: '%', status: 'good' },
      { label: 'Fabrikam Cloud', value: 40, max: 100, suffix: '%', status: 'good' },
      { label: 'Northwind HR', value: 85, max: 100, suffix: '%', status: 'good' },
      { label: 'Woodgrove Finance', value: 30, max: 100, suffix: '%', status: 'good' },
      { label: 'Tailspin Toys', value: 55, max: 100, suffix: '%', status: 'warning' },
      { label: 'Adventure Works', value: 70, max: 100, suffix: '%', status: 'warning' },
      { label: 'Litware Payroll', value: 45, max: 100, suffix: '%', status: 'bad' },
    ],
    barsTitle: 'Project Completion',
  },
  'revenue': {
    title: 'Revenue & Billing',
    kpis: [
      { label: 'Invoiced', value: '£385K', status: 'good' },
      { label: 'Ready to Invoice', value: '£143K', status: 'neutral' },
      { label: 'Overdue', value: '£67K', status: 'bad' },
      { label: 'Q1 Forecast', value: '£1.26M', status: 'good' },
    ],
    bars: [
      { label: 'T&M', value: 54, max: 100, suffix: '%', status: 'good' },
      { label: 'Fixed Price', value: 34, max: 100, suffix: '%', status: 'neutral' },
      { label: 'Managed Services', value: 12, max: 100, suffix: '%', status: 'neutral' },
    ],
    barsTitle: 'Revenue Mix',
  },
  'utilisation': {
    title: 'Resource Utilisation',
    kpis: [
      { label: 'Target', value: '80%', status: 'neutral' },
      { label: 'Actual', value: '76.5%', status: 'warning' },
      { label: 'Bench Rate', value: '4.2%', status: 'good' },
      { label: 'Headcount', value: '24', status: 'neutral' },
    ],
    bars: [
      { label: 'Sr Consultants', value: 84, max: 100, suffix: '%', status: 'good' },
      { label: 'Consultants', value: 78, max: 100, suffix: '%', status: 'warning' },
      { label: 'Solution Architects', value: 72, max: 100, suffix: '%', status: 'warning' },
      { label: 'Project Managers', value: 69, max: 100, suffix: '%', status: 'good' },
      { label: 'Technical', value: 81, max: 100, suffix: '%', status: 'good' },
    ],
    barsTitle: 'Utilisation by Role',
  },
  'margin': {
    title: 'Project Margins',
    kpis: [
      { label: 'Portfolio Margin', value: '34.2%', status: 'warning' },
      { label: 'Target', value: '35%', status: 'neutral' },
      { label: 'Trend', value: '-1.8%', status: 'bad' },
      { label: 'Best Project', value: '42%', status: 'good' },
    ],
    bars: [
      { label: 'Northwind HR', value: 42, max: 50, suffix: '%', status: 'good' },
      { label: 'Contoso ERP', value: 38, max: 50, suffix: '%', status: 'good' },
      { label: 'Fabrikam Cloud', value: 35, max: 50, suffix: '%', status: 'good' },
      { label: 'Woodgrove Finance', value: 33, max: 50, suffix: '%', status: 'warning' },
      { label: 'Adventure Works', value: 28, max: 50, suffix: '%', status: 'warning' },
      { label: 'Tailspin Toys', value: 25, max: 50, suffix: '%', status: 'bad' },
      { label: 'Litware Payroll', value: 18, max: 50, suffix: '%', status: 'bad' },
    ],
    barsTitle: 'Gross Margin by Project',
  },
  'forecast': {
    title: 'Forecasting',
    kpis: [
      { label: 'FY Forecast', value: '£5.29M', status: 'good' },
      { label: 'Target', value: '£5.0M', status: 'neutral' },
      { label: 'Win Rate', value: '38%', status: 'warning' },
      { label: 'Pipeline', value: '£6.25M', status: 'good' },
    ],
    bars: [
      { label: 'Q1', value: 1255, max: 1500, suffix: 'K', status: 'good' },
      { label: 'Q2', value: 1380, max: 1500, suffix: 'K', status: 'good' },
      { label: 'Q3', value: 1200, max: 1500, suffix: 'K', status: 'warning' },
      { label: 'Q4', value: 1450, max: 1500, suffix: 'K', status: 'neutral' },
    ],
    barsTitle: 'Quarterly Revenue Forecast (£)',
  },
  'budget': {
    title: 'Budget Tracking',
    kpis: [
      { label: 'Total Budget', value: '£4.01M', status: 'neutral' },
      { label: 'Spent', value: '£2.18M', status: 'neutral' },
      { label: 'Utilised', value: '54%', status: 'good' },
      { label: 'Remaining', value: '£1.83M', status: 'good' },
    ],
    bars: [
      { label: 'Contoso ERP', value: 57, max: 100, suffix: '%', status: 'good' },
      { label: 'Fabrikam Cloud', value: 44, max: 100, suffix: '%', status: 'good' },
      { label: 'Northwind HR', value: 89, max: 100, suffix: '%', status: 'warning' },
      { label: 'Woodgrove Finance', value: 32, max: 100, suffix: '%', status: 'good' },
      { label: 'Tailspin Toys', value: 68, max: 100, suffix: '%', status: 'warning' },
      { label: 'Adventure Works', value: 78, max: 100, suffix: '%', status: 'bad' },
      { label: 'Litware Payroll', value: 63, max: 100, suffix: '%', status: 'warning' },
    ],
    barsTitle: 'Budget Spent by Project',
  },
};

// Get insights data for the active task (returns null for non-financial tasks)
const getInsightsForTask = (taskTitle) => {
  if (!taskTitle) return null;
  const lower = taskTitle.toLowerCase();
  for (const [key, data] of Object.entries(FINANCIAL_INSIGHTS)) {
    if (lower.includes(key)) return data;
  }
  return null;
};

// Note: User data is now stored on the backend server
// All user operations use collaborationAPI from useCollaboration.js

// Login Screen Component
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Validate unit4.com domain
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.endsWith('@unit4.com')) {
      setError('Only Unit4 employees (@unit4.com) can access this application');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists OR is admin (admin can always log in)
      const isAdmin = emailLower === ADMIN_EMAIL;
      const userAlreadyExists = await collaborationAPI.userExists(emailLower);

      if (!isAdmin && !userAlreadyExists) {
        setError('Account not found. Please contact your administrator to create an account.');
        setIsLoading(false);
        return;
      }

      onLogin({
        email: emailLower,
        name: name.trim()
      });
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-500 to-teal-500 relative overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-32 right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-teal-400/20 rounded-full blur-xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div>
            <img
              src="https://www.unit4.com/sites/default/files/images/logo.svg"
              alt="Unit4"
              className="h-8 brightness-0 invert"
            />
          </div>

          {/* Main Message */}
          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
              Meet Ava,<br />
              Your AI-Powered<br />
              ERP Assistant
            </h1>
            <p className="text-green-100 text-lg max-w-md">
              Streamline your workflow with intelligent task management, real-time collaboration, and AI-driven insights.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                ✨ AI-Powered
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                🔄 Real-time Sync
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                👥 Team Collaboration
              </span>
            </div>
          </div>

          {/* Footer Quote */}
          <div className="space-y-2">
            <p className="text-green-100 italic">
              "Ava has transformed how our team manages ERP tasks."
            </p>
            <p className="text-sm text-green-200">
              — Enterprise Solutions Team
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="https://www.unit4.com/sites/default/files/images/logo.svg"
              alt="Unit4"
              className="h-8 mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-800">Welcome to Ava</h2>
            <p className="text-gray-500 text-sm mt-1">Your AI-powered ERP Assistant</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to continue to Ava</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your full name"
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="you@unit4.com"
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white"
                    disabled={isLoading}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Only registered @unit4.com accounts can sign in
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 touch-manipulation"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-gray-400">Secure enterprise login</span>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              <p>Don't have an account?</p>
              <p className="mt-1">Contact your administrator to get access.</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Unit4 N.V. All rights reserved.
            </p>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
              <a href="#" className="hover:text-gray-600">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status icons for tasks
const statusIcons = {
  completed: <CheckCircle2 size={14} className="text-green-500" />,
  in_progress: <Clock size={14} className="text-amber-500" />,
  pending: <Circle size={14} className="text-gray-400" />,
};

// Task item component
const TaskItem = ({ task, isActive, onClick, unreadCount = 0, darkMode = false }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-900'
        : darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
    }`}
  >
    <div className="flex items-center gap-2">
      {statusIcons[task.status]}
      <span className="truncate text-sm flex-1">{task.title}</span>
      {unreadCount > 0 && (
        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  </button>
);

// Folder item component with expandable tasks
const FolderItem = ({ folder, expandedFolders, toggleFolder, activeTask, onTaskClick, onRenameFolder, onDeleteFolder, unreadTasks = {}, darkMode = false }) => {
  const isExpanded = expandedFolders.includes(folder.id);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowFolderMenu(false);
      }
    };
    if (showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderMenu]);

  // Calculate total unread count for tasks in this folder
  const folderUnreadCount = folder.tasks.reduce((sum, task) => sum + (unreadTasks[task.id] || 0), 0);

  return (
    <div className="mb-1 group" data-tour={folder.id === 'folder-0' ? 'my-tasks' : undefined}>
      <div className="flex items-center">
        <button
          onClick={() => toggleFolder(folder.id)}
          className={`flex-1 text-left px-2 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          {isExpanded ? (
            <ChevronDown size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          ) : (
            <ChevronRight size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          )}
          {isExpanded ? (
            <FolderOpen size={16} className="text-green-500" />
          ) : (
            <Folder size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
          )}
          <span className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{folder.name}</span>
          {/* Folder unread badge */}
          {folderUnreadCount > 0 && !isExpanded && (
            <span className="flex items-center justify-center min-w-5 h-5 px-1.5 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
              {folderUnreadCount > 9 ? '9+' : folderUnreadCount}
            </span>
          )}
          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
            darkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-400 bg-gray-200'
          }`}>
            {folder.tasks.length}
          </span>
        </button>

        {/* Folder menu button - hidden for protected folders */}
        {!folder.isProtected && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderMenu(!showFolderMenu);
              }}
              className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <MoreVertical size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
            </button>

            {/* Folder dropdown menu */}
            {showFolderMenu && (
              <div className={`absolute right-0 top-full mt-1 rounded-lg shadow-lg border py-1 min-w-36 z-50 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRenameFolder(folder);
                    setShowFolderMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-sm ${
                    darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <FolderEdit size={14} />
                  <span>Rename Folder</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder);
                    setShowFolderMenu(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-sm ${
                    darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Trash2 size={14} />
                  <span>Delete Folder</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className={`ml-4 pl-2 border-l mt-1 space-y-0.5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          {folder.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={activeTask === task.id}
              onClick={() => onTaskClick(task)}
              unreadCount={unreadTasks[task.id] || 0}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tab component with drag and drop and menu
const Tab = ({ task, isActive, onClick, onClose, index, onDragStart, onDragOver, onDrop, isDraggedOver, onSplitView, onShare, onRename, onDelete, menuOpenId, setMenuOpenId, splitViewTask, isMobile, unreadCount = 0, darkMode = false }) => {
  const isMenuOpen = menuOpenId === task.id;
  const isInSplitView = splitViewTask === task.id;
  const menuButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      // Adjust position for mobile to stay within viewport
      const left = isMobile ? Math.min(rect.left, window.innerWidth - 180) : rect.left;
      setMenuPosition({
        top: rect.bottom + 4,
        left: Math.max(8, left)
      });
    }
  }, [isMenuOpen, isMobile]);

  return (
    <div
      draggable={!isMobile}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={(e) => e.target.classList.remove('opacity-50')}
      className={`relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'} transition-all flex-shrink-0 ${
        isActive
          ? darkMode ? 'bg-gray-900 text-gray-100 border-b-2 border-b-green-500' : 'bg-white text-gray-800 border-b-2 border-b-green-500'
          : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
      } ${isDraggedOver ? 'border-l-2 border-l-green-500' : ''} ${isInSplitView ? 'ring-1 ring-green-400' : ''}`}
      onClick={onClick}
    >
      {statusIcons[task.status]}
      <span className="text-xs sm:text-sm truncate max-w-20 sm:max-w-28">{task.title}</span>
      {/* Unread indicator badge */}
      {unreadCount > 0 && !isActive && (
        <span className="flex items-center justify-center min-w-4 h-4 px-1 bg-green-500 text-white text-[10px] font-medium rounded-full animate-pulse">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}

      {/* Tab Menu Button */}
      <button
        ref={menuButtonRef}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpenId(isMenuOpen ? null : task.id);
        }}
        className={`p-1 sm:p-0.5 rounded transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
      >
        <MoreVertical size={14} className={darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} />
      </button>

      {/* Tab Dropdown Menu - Using Portal to render at document body level */}
      {isMenuOpen && createPortal(
        <>
        <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); }} />
        <div
          className={`fixed rounded-lg shadow-lg border py-1 min-w-40 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(task);
              setMenuOpenId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-sm touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Share2 size={14} />
            <span>Share & Collaborate</span>
          </button>
          {!isMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSplitView(task.id);
                setMenuOpenId(null);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {isInSplitView ? <Maximize2 size={14} /> : <SplitSquareHorizontal size={14} />}
              <span>{isInSplitView ? 'Exit Split View' : 'Open in Split View'}</span>
            </button>
          )}
          <div className={`border-t my-1 ${darkMode ? 'border-gray-600' : 'border-gray-100'}`} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(task);
              setMenuOpenId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-sm touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Pencil size={14} />
            <span>Rename Task</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
              setMenuOpenId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-red-500 transition-colors text-sm touch-manipulation ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'}`}
          >
            <Trash2 size={14} />
            <span>Delete Task</span>
          </button>
          <div className={`border-t my-1 ${darkMode ? 'border-gray-600' : 'border-gray-100'}`} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(task.id);
              setMenuOpenId(null);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-sm touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={14} />
            <span>Close Tab</span>
          </button>
        </div>
        </>,
        document.body
      )}

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose(task.id);
        }}
        className={`p-1 sm:p-0.5 rounded transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
      >
        <X size={14} className="text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  );
};

// Tool button component for the right panel
const ToolButton = ({ icon: Icon, label, description, onClick, darkMode = false }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-3 rounded-lg border transition-all group ${darkMode ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 group-hover:bg-green-900' : 'bg-gray-100 group-hover:bg-green-100'}`}>
        <Icon size={18} className={darkMode ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-600 group-hover:text-green-600'} />
      </div>
      <div>
        <div className={`font-medium text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{label}</div>
        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</div>
      </div>
    </div>
  </button>
);

// Helper to get message bubble colors based on user email
const getMessageColors = (email, isCurrentUser, darkMode = false) => {
  if (isCurrentUser) {
    return {
      bg: 'bg-green-500',
      text: 'text-white',
      timestamp: 'text-green-200',
      name: darkMode ? 'text-green-400' : 'text-green-600',
      nameBg: darkMode ? 'bg-green-900/30' : 'bg-green-50'
    };
  }

  // AI/System messages
  if (!email || email === 'ava@unit4.com') {
    return {
      bg: darkMode ? 'bg-gray-700' : 'bg-gray-100',
      text: darkMode ? 'text-gray-100' : 'text-gray-800',
      timestamp: darkMode ? 'text-gray-500' : 'text-gray-400',
      name: darkMode ? 'text-gray-400' : 'text-gray-500',
      nameBg: ''
    };
  }

  // Other collaborators - assign colors based on email hash
  const colorSchemes = [
    { bg: 'bg-blue-500', text: 'text-white', timestamp: 'text-blue-200', name: darkMode ? 'text-blue-400' : 'text-blue-600', nameBg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50' },
    { bg: 'bg-purple-500', text: 'text-white', timestamp: 'text-purple-200', name: darkMode ? 'text-purple-400' : 'text-purple-600', nameBg: darkMode ? 'bg-purple-900/30' : 'bg-purple-50' },
    { bg: 'bg-pink-500', text: 'text-white', timestamp: 'text-pink-200', name: darkMode ? 'text-pink-400' : 'text-pink-600', nameBg: darkMode ? 'bg-pink-900/30' : 'bg-pink-50' },
    { bg: 'bg-indigo-500', text: 'text-white', timestamp: 'text-indigo-200', name: darkMode ? 'text-indigo-400' : 'text-indigo-600', nameBg: darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50' },
    { bg: 'bg-teal-500', text: 'text-white', timestamp: 'text-teal-200', name: darkMode ? 'text-teal-400' : 'text-teal-600', nameBg: darkMode ? 'bg-teal-900/30' : 'bg-teal-50' },
    { bg: 'bg-orange-500', text: 'text-white', timestamp: 'text-orange-200', name: darkMode ? 'text-orange-400' : 'text-orange-600', nameBg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50' },
    { bg: 'bg-cyan-500', text: 'text-white', timestamp: 'text-cyan-200', name: darkMode ? 'text-cyan-400' : 'text-cyan-600', nameBg: darkMode ? 'bg-cyan-900/30' : 'bg-cyan-50' },
    { bg: 'bg-rose-500', text: 'text-white', timestamp: 'text-rose-200', name: darkMode ? 'text-rose-400' : 'text-rose-600', nameBg: darkMode ? 'bg-rose-900/30' : 'bg-rose-50' },
  ];

  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorSchemes[Math.abs(hash) % colorSchemes.length];
};

// Parse message content to extract chart blocks
const CHART_REGEX = /```chart\s*\n([\s\S]*?)```/g;

const parseMessageContent = (content) => {
  if (!content || typeof content !== 'string') return [{ type: 'text', content: content || '' }];

  const segments = [];
  let lastIndex = 0;
  let match;

  const regex = new RegExp(CHART_REGEX.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    // Add text before the chart block
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', content: text });
    }
    // Try to parse chart JSON
    try {
      const chartData = JSON.parse(match[1].trim());
      if (chartData && chartData.type && chartData.data) {
        segments.push({ type: 'chart', data: chartData });
      } else {
        segments.push({ type: 'text', content: match[0] });
      }
    } catch (e) {
      segments.push({ type: 'text', content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last chart block
  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: 'text', content: text });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content }];
};

// Chart renderer component for inline charts
const ChartRenderer = ({ chartData, darkMode, themeHex }) => {
  if (!chartData || !chartData.type || !chartData.data) return null;

  const textColor = darkMode ? '#d1d5db' : '#374151';
  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff';
  const tooltipBorder = darkMode ? '#4b5563' : '#e5e7eb';

  const defaultColors = [themeHex || '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#14b8a6', '#f43f5e', '#eab308', '#6366f1'];

  const { type, title, xKey, series = [], data } = chartData;

  const tooltipStyle = {
    contentStyle: { backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: textColor, fontWeight: 600 },
    itemStyle: { color: textColor }
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <Tooltip {...tooltipStyle} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: textColor }} />}
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label || s.key} fill={s.color || defaultColors[i % defaultColors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <Tooltip {...tooltipStyle} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: textColor }} />}
            {series.map((s, i) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={s.color || defaultColors[i % defaultColors.length]} strokeWidth={2} dot={{ fill: s.color || defaultColors[i % defaultColors.length], r: 4 }} />
            ))}
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} />
            <Tooltip {...tooltipStyle} />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: '11px', color: textColor }} />}
            {series.map((s, i) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.label || s.key} stroke={s.color || defaultColors[i % defaultColors.length]} fill={s.color || defaultColors[i % defaultColors.length]} fillOpacity={0.2} strokeWidth={2} />
            ))}
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '11px', color: textColor }} />
            <Pie data={data} dataKey={series[0]?.key || 'value'} nameKey={xKey || 'name'} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={10} fill={themeHex}>
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={defaultColors[i % defaultColors.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      default:
        return null;
    }
  };

  const chart = renderChart();
  if (!chart) return null;

  return (
    <div className={`my-2 p-3 rounded-lg border ${darkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'}`}>
      {title && <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{title}</p>}
      <ResponsiveContainer width="100%" height={220}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
};

// Message bubble component
const Message = ({ content, isUser, timestamp, userName, userEmail, currentUserEmail, onPinMessage, darkMode, themeHex }) => {
  const isCurrentUser = userEmail ? userEmail === currentUserEmail : isUser;
  const isAI = !userEmail || userEmail === 'ava@unit4.com';
  const isCollaborator = !isCurrentUser && !isAI;
  const colors = getMessageColors(userEmail, isCurrentUser, darkMode);
  const displayName = isAI ? 'Ava' : (userName || userEmail?.split('@')[0] || 'Unknown');
  const [showPinButton, setShowPinButton] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const handlePin = () => {
    if (onPinMessage && !isPinned) {
      onPinMessage(content, displayName, timestamp);
      setIsPinned(true);
      // Reset after 2 seconds
      setTimeout(() => setIsPinned(false), 2000);
    }
  };

  return (
    <div
      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4 group`}
      onMouseEnter={() => setShowPinButton(true)}
      onMouseLeave={() => setShowPinButton(false)}
    >
      <div className="flex flex-col max-w-[85%] sm:max-w-2xl relative">
        {/* Sender name - more prominent for collaborators */}
        <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {isCollaborator && (
            <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
          )}
          <span className={`text-[10px] sm:text-xs ${colors.name} font-semibold ${
            isCollaborator ? `px-2 py-0.5 rounded-full ${colors.nameBg}` : ''
          }`}>
            {isCurrentUser ? 'You' : displayName}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${colors.bg} ${colors.text} ${
            isCurrentUser ? 'rounded-br-md' : 'rounded-bl-md'
          } relative`}
        >
          {parseMessageContent(content).map((segment, idx) => (
            segment.type === 'chart'
              ? <ChartRenderer key={idx} chartData={segment.data} darkMode={darkMode} themeHex={themeHex} />
              : <p key={idx} className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{segment.content}</p>
          ))}
          <span className={`text-[10px] sm:text-xs mt-1 block ${colors.timestamp}`}>
            {timestamp}
          </span>

          {/* Pin button - only show for Ava's messages on hover */}
          {isAI && onPinMessage && (showPinButton || isPinned) && (
            <button
              onClick={handlePin}
              title={isPinned ? 'Pinned to Notepad!' : 'Pin to Notepad'}
              className={`absolute -right-2 -top-2 p-1.5 rounded-full shadow-md transition-all transform hover:scale-110 ${
                isPinned
                  ? 'bg-green-500 text-white'
                  : darkMode
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {isPinned ? <CheckCircle size={14} /> : <Pin size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Data Insights Panel - displays structured financial KPIs and progress bars
const DataInsightsPanel = ({ insights, darkMode, themeColor, expanded, onToggle }) => {
  if (!insights) return null;

  const statusColors = {
    good: { bg: darkMode ? 'bg-green-900/40' : 'bg-green-50', border: 'border-green-500', text: darkMode ? 'text-green-400' : 'text-green-700', bar: 'bg-green-500' },
    warning: { bg: darkMode ? 'bg-amber-900/40' : 'bg-amber-50', border: 'border-amber-500', text: darkMode ? 'text-amber-400' : 'text-amber-700', bar: 'bg-amber-500' },
    bad: { bg: darkMode ? 'bg-red-900/40' : 'bg-red-50', border: 'border-red-500', text: darkMode ? 'text-red-400' : 'text-red-700', bar: 'bg-red-500' },
    neutral: { bg: darkMode ? 'bg-blue-900/40' : 'bg-blue-50', border: 'border-blue-500', text: darkMode ? 'text-blue-400' : 'text-blue-700', bar: 'bg-blue-500' },
  };

  return (
    <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header with collapse toggle */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-3 transition-colors ${
          darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
          <span className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {insights.title}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'} ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 space-y-3">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-2">
            {insights.kpis.map((kpi, idx) => {
              const colors = statusColors[kpi.status] || statusColors.neutral;
              return (
                <div
                  key={idx}
                  className={`rounded-lg p-2 border-l-3 ${colors.bg} ${colors.border}`}
                  style={{ borderLeftWidth: '3px' }}
                >
                  <p className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {kpi.label}
                  </p>
                  <p className={`text-sm font-bold ${colors.text}`}>
                    {kpi.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Progress Bars */}
          {insights.bars && insights.bars.length > 0 && (
            <div>
              <p className={`text-[10px] font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {insights.barsTitle || 'Breakdown'}
              </p>
              <div className="space-y-2">
                {insights.bars.map((bar, idx) => {
                  const colors = statusColors[bar.status] || statusColors.neutral;
                  const pct = Math.min((bar.value / bar.max) * 100, 100);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {bar.label}
                        </span>
                        <span className={`text-[10px] font-medium ${colors.text}`}>
                          {bar.value}{bar.suffix || ''}
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className={`h-1.5 rounded-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function ErpAI() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('consultant');
  const [createUserError, setCreateUserError] = useState('');
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [appSettings, setAppSettings] = useState(loadAppSettings);
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  // Claude AI state
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeConfigured, setClaudeConfigured] = useState(false);
  const [claudeConfiguring, setClaudeConfiguring] = useState(false);

  // MCP Plugin states
  const [showMCPPlugins, setShowMCPPlugins] = useState(false);
  const [showAddPluginModal, setShowAddPluginModal] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState(null);
  const [pluginFormError, setPluginFormError] = useState('');
  const [pluginName, setPluginName] = useState('');
  const [pluginDescription, setPluginDescription] = useState('');
  const [pluginType, setPluginType] = useState('stdio');
  const [pluginCommand, setPluginCommand] = useState('');
  const [pluginArgs, setPluginArgs] = useState('');
  const [pluginEnv, setPluginEnv] = useState('');
  const [testingPluginId, setTestingPluginId] = useState(null);
  const [mcpTools, setMcpTools] = useState([]); // Discovered tools from connected plugins
  const [connectingPluginId, setConnectingPluginId] = useState(null);

  const [draggedTabIndex, setDraggedTabIndex] = useState(null);
  const [dragOverTabIndex, setDragOverTabIndex] = useState(null);
  const [tabMenuOpenId, setTabMenuOpenId] = useState(null);
  const [splitViewTask, setSplitViewTask] = useState(null);

  // New Task Modal state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTask, setShareTask] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState({});
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [shareError, setShareError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Rename Task Modal state
  const [showRenameTaskModal, setShowRenameTaskModal] = useState(false);
  const [renameTask, setRenameTask] = useState(null);
  const [renameTaskValue, setRenameTaskValue] = useState('');

  // Delete Task Modal state
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [deleteTask, setDeleteTask] = useState(null);

  // Rename Folder Modal state
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameFolder, setRenameFolder] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');

  // Delete Folder Modal state
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);

  // Folders and tasks data (starts empty, loaded on login)
  const [folders, setFolders] = useState([]);

  // Real-time messages state
  const [realtimeMessages, setRealtimeMessages] = useState({});

  // Unread tasks state - tracks tasks with unread messages from others or Ava
  const [unreadTasks, setUnreadTasks] = useState({});

  // Backend sync state - 'connected' | 'syncing' | 'disconnected'
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Dark mode state - persisted per user
  const [darkMode, setDarkMode] = useState(false);

  // Onboarding state - track if user has completed onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Custom quick actions state - persisted per user
  const [customQuickActions, setCustomQuickActions] = useState([]);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionPrompt, setNewActionPrompt] = useState('');
  const [editingActionIndex, setEditingActionIndex] = useState(null);

  // Real-time collaboration hook (uses currentUser from auth state)
  const {
    isConnected,
    joinTask,
    leaveTask,
    sendMessage,
    startTyping,
    stopTyping,
    onMessage,
    onCollaborators,
    onTaskMessages,
    onTaskShared,
    onTaskUnshared,
    getTypingUsers,
    isCollaboratorOnline,
  } = useCollaboration(currentUser || { email: '', name: '' });

  // Login handler - loads user data from backend
  const handleLogin = async (user) => {
    // Clear other users' cached data to prevent data bleeding
    const clearedCount = clearOtherUsersFromLocalStorage(user.email);
    if (clearedCount > 0) {
      console.log(`Cleared ${clearedCount} other user(s) from localStorage for privacy`);
    }

    // Helper to apply user data to state
    const applyUserData = (data, userName) => {
      // Determine role: admin for admin email, or from saved data, or default to consultant
      const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const userRole = isAdmin ? 'admin' : (data?.role || 'consultant');

      const restoredUser = {
        email: user.email,
        name: userName || data?.name || user.email.split('@')[0],
        role: userRole
      };
      setCurrentUser(restoredUser);
      setFolders(data?.folders || getDefaultFolders());
      setOpenTabs(data?.openTabs || []);
      setActiveTask(data?.activeTask || null);
      setExpandedFolders(data?.expandedFolders || ['folder-0', 'folder-financials', 'folder-shared', 'folder-notepad']);
      setRealtimeMessages(data?.messages || {});
      setUnreadTasks(data?.unreadTasks || {});
      setDarkMode(data?.darkMode || false);
      setCustomQuickActions(data?.quickActions || []);
      setOnboardingCompleted(data?.onboardingCompleted || false);

      // Show onboarding if not completed
      if (!data?.onboardingCompleted) {
        setShowOnboarding(true);
      }

      return restoredUser;
    };

    // FAST STARTUP: Try to load from localStorage first
    const cachedData = loadUserFromLocalStorage(user.email);

    if (cachedData && !isCachedDataStale(cachedData, 60)) {
      // Use cached data for immediate display
      console.log('Fast startup: Loading user data from localStorage cache');
      applyUserData(cachedData, user.name);
      setIsDataLoaded(true);
      setIsLoggedIn(true);

      // Background sync: Fetch latest from backend and merge if newer
      collaborationAPI.getUserData(user.email)
        .then(backendData => {
          if (backendData) {
            // Check if backend data is newer (based on modification timestamps or compare content)
            const backendUpdated = backendData.lastUpdated ? new Date(backendData.lastUpdated) : new Date(0);
            const localUpdated = cachedData.lastUpdated ? new Date(cachedData.lastUpdated) : new Date(0);

            if (backendUpdated > localUpdated) {
              console.log('Background sync: Backend has newer data, updating local state');
              applyUserData(backendData, user.name);
              // Update localStorage with backend data
              saveUserToLocalStorage(user.email, {
                ...backendData,
                name: user.name || backendData.name
              });
            } else {
              // Local is newer or same, push to backend
              console.log('Background sync: Local data is current, syncing to backend');
              collaborationAPI.saveUserData(user.email, {
                ...cachedData,
                name: user.name
              }).catch(err => console.error('Background sync to backend failed:', err));
            }
          }
        })
        .catch(err => {
          console.log('Background sync failed (offline mode):', err.message);
        });

      return;
    }

    // No valid cache - load from backend
    try {
      // Load user's saved data from backend or initialize with defaults
      const savedData = await collaborationAPI.getUserData(user.email);

      if (savedData) {
        // Existing user - restore their data and update name if provided
        const restoredUser = applyUserData(savedData, user.name);

        // Cache to localStorage
        saveUserToLocalStorage(user.email, {
          ...savedData,
          name: restoredUser.name
        });

        // Update saved data with current name on backend
        await collaborationAPI.saveUserData(user.email, {
          ...savedData,
          name: restoredUser.name
        });
      } else {
        // New user (admin) - initialize with defaults
        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const defaultData = {
          name: user.name,
          role: isAdmin ? 'admin' : 'consultant',
          folders: getDefaultFolders(),
          openTabs: [],
          activeTask: null,
          expandedFolders: ['folder-0', 'folder-financials', 'folder-shared', 'folder-notepad'],
          messages: {},
          unreadTasks: {},
          darkMode: false,
          quickActions: [],
          onboardingCompleted: false
        };

        applyUserData(defaultData, user.name);

        // Show onboarding for new users
        setShowOnboarding(true);

        // Cache to localStorage
        saveUserToLocalStorage(user.email, defaultData);

        // Save initial data for new user on backend
        await collaborationAPI.saveUserData(user.email, defaultData);
      }

      setIsDataLoaded(true);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to load user data from backend:', error);

      // Try localStorage as fallback for offline support
      if (cachedData) {
        console.log('Using stale localStorage cache as fallback (offline mode)');
        applyUserData(cachedData, user.name);
      } else {
        // No cache available - use defaults with role
        console.log('No cache available, using defaults');
        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        setCurrentUser({
          ...user,
          role: isAdmin ? 'admin' : 'consultant'
        });
        const defaultFolders = getDefaultFolders();
        setFolders(defaultFolders);
        setOpenTabs([]);
        setActiveTask(null);
        setExpandedFolders(['folder-0', 'folder-financials', 'folder-shared', 'folder-notepad']);
        setRealtimeMessages({});
        setUnreadTasks({});
        setDarkMode(false);
        setCustomQuickActions([]);
      }

      setIsDataLoaded(true);
      setIsLoggedIn(true);
    }
  };

  // MCP Plugin helper functions
  const addMCPPlugin = (plugin) => {
    const newPlugin = {
      id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: plugin.name,
      description: plugin.description || '',
      enabled: true,
      type: plugin.type || 'stdio',
      command: plugin.command,
      args: plugin.args || [],
      env: plugin.env || {},
      createdAt: new Date().toISOString(),
      lastConnected: null,
      status: 'disconnected'
    };
    const updatedPlugins = [...(appSettings.mcpPlugins || []), newPlugin];
    const newSettings = { ...appSettings, mcpPlugins: updatedPlugins };
    setAppSettings(newSettings);
    saveAppSettings(newSettings);
    return newPlugin;
  };

  const updateMCPPlugin = (pluginId, updates) => {
    const updatedPlugins = (appSettings.mcpPlugins || []).map(p =>
      p.id === pluginId ? { ...p, ...updates } : p
    );
    const newSettings = { ...appSettings, mcpPlugins: updatedPlugins };
    setAppSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const removeMCPPlugin = (pluginId) => {
    const updatedPlugins = (appSettings.mcpPlugins || []).filter(p => p.id !== pluginId);
    const newSettings = { ...appSettings, mcpPlugins: updatedPlugins };
    setAppSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const toggleMCPPlugin = (pluginId) => {
    const plugin = (appSettings.mcpPlugins || []).find(p => p.id === pluginId);
    if (plugin) {
      updateMCPPlugin(pluginId, { enabled: !plugin.enabled });
    }
  };

  const testMCPPlugin = async (pluginId) => {
    const plugin = (appSettings.mcpPlugins || []).find(p => p.id === pluginId);
    if (!plugin) return false;

    setTestingPluginId(pluginId);
    setConnectingPluginId(pluginId);

    try {
      // Attempt to connect to the MCP plugin
      const result = await collaborationAPI.connectMCPPlugin({
        id: plugin.id,
        name: plugin.name,
        command: plugin.command,
        args: plugin.args || [],
        env: plugin.env || {}
      });

      if (result.success) {
        updateMCPPlugin(pluginId, {
          status: 'connected',
          lastConnected: new Date().toISOString(),
          tools: result.tools || []
        });

        // Refresh all MCP tools
        const allTools = await collaborationAPI.getMCPTools();
        setMcpTools(allTools);

        setTestingPluginId(null);
        setConnectingPluginId(null);
        return true;
      } else {
        updateMCPPlugin(pluginId, {
          status: 'error',
          lastConnected: null
        });
        setTestingPluginId(null);
        setConnectingPluginId(null);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to MCP plugin:', error);
      updateMCPPlugin(pluginId, {
        status: 'error',
        lastConnected: null
      });
      setTestingPluginId(null);
      setConnectingPluginId(null);
      return false;
    }
  };

  // Disconnect from an MCP plugin
  const disconnectMCPPlugin = async (pluginId) => {
    try {
      await collaborationAPI.disconnectMCPPlugin(pluginId);
      updateMCPPlugin(pluginId, {
        status: 'disconnected',
        tools: []
      });
      // Refresh all MCP tools
      const allTools = await collaborationAPI.getMCPTools();
      setMcpTools(allTools);
    } catch (error) {
      console.error('Failed to disconnect from MCP plugin:', error);
    }
  };

  // Execute an MCP tool and return the result
  const executeMCPTool = async (pluginId, toolName, args = {}) => {
    try {
      const result = await collaborationAPI.executeMCPTool(pluginId, toolName, args);
      return result;
    } catch (error) {
      console.error('Failed to execute MCP tool:', error);
      throw error;
    }
  };

  const resetPluginForm = () => {
    setPluginName('');
    setPluginDescription('');
    setPluginType('stdio');
    setPluginCommand('');
    setPluginArgs('');
    setPluginEnv('');
    setPluginFormError('');
    setEditingPlugin(null);
  };

  const parseArgsString = (argsStr) => {
    if (!argsStr.trim()) return [];
    return argsStr.split('\n').map(arg => arg.trim()).filter(arg => arg);
  };

  const parseEnvString = (envStr) => {
    if (!envStr.trim()) return {};
    const env = {};
    envStr.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  };

  const getPluginIcon = (iconName) => {
    const icons = {
      FileText: FileText,
      Globe: Globe,
      MessageSquare: MessageSquare,
      Github: Github,
      Database: Database,
      Terminal: Terminal,
      Plug: Plug
    };
    return icons[iconName] || Plug;
  };

  // Logout handler - saves state before clearing
  const handleLogout = () => {
    // Save current state to backend before logging out
    if (currentUser?.email) {
      collaborationAPI.saveUserData(currentUser.email, {
        name: currentUser.name,
        folders,
        openTabs,
        activeTask,
        expandedFolders,
        messages: realtimeMessages,
        unreadTasks,
        darkMode,
        quickActions: customQuickActions,
        onboardingCompleted
      }).catch(err => console.error('Failed to save on logout:', err));
    }

    // Reset ALL user-specific state to prevent data leakage between users
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsDataLoaded(false);
    setUserMenuOpen(false);
    setShowManageUsers(false);
    setShowAdminSettings(false);
    setSystemUsers([]);
    setFolders([]);
    setOpenTabs([]);
    setActiveTask(null);
    setExpandedFolders([]);
    setUnreadTasks({});
    setRealtimeMessages({});
    setTypingIndicators({});
    setSplitViewTask(null);
    setTabMenuOpenId(null);
    setSyncStatus('disconnected');
    setLastSyncTime(null);
    setDarkMode(false);
    setCustomQuickActions([]);
    setShowQuickActionModal(false);

    // Reset user creation form states
    setShowCreateUserForm(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('consultant');
    setCreateUserError('');

    // Reset Claude state
    setClaudeConfigured(false);
    setClaudeApiKey('');
    setClaudeConfiguring(false);

    // Reset MCP plugin states
    setShowMCPPlugins(false);
    setShowAddPluginModal(false);
    setEditingPlugin(null);
    setPluginFormError('');
    setPluginName('');
    setPluginDescription('');
    setPluginType('stdio');
    setPluginCommand('');
    setPluginArgs('');
    setPluginEnv('');
    setTestingPluginId(null);

    // Reset any modal states
    setShowNewTaskModal(false);
    setShowShareModal(false);
    setShowRenameTaskModal(false);
    setShowDeleteTaskModal(false);
    setShowRenameFolderModal(false);
    setShowDeleteFolderModal(false);
    setShareTask(null);
    setRenameTask(null);
    setDeleteTask(null);
    setRenameFolder(null);
    setDeleteFolderTarget(null);

    // Reset onboarding state
    setShowOnboarding(false);
    setOnboardingCompleted(false);
  };

  // Onboarding completion handler
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    // Immediately save to both localStorage and backend
    if (currentUser?.email) {
      const userData = {
        name: currentUser.name,
        role: currentUser.role,
        folders,
        openTabs,
        activeTask,
        expandedFolders,
        messages: realtimeMessages,
        unreadTasks,
        darkMode,
        quickActions: customQuickActions,
        onboardingCompleted: true
      };
      saveUserToLocalStorage(currentUser.email, userData);
      collaborationAPI.saveUserData(currentUser.email, userData)
        .catch(err => console.error('Failed to save onboarding status:', err));
    }
  }, [currentUser, folders, openTabs, activeTask, expandedFolders, realtimeMessages, unreadTasks, darkMode, customQuickActions]);

  // Onboarding skip handler
  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
    // Save skip as completed to both localStorage and backend
    if (currentUser?.email) {
      const userData = {
        name: currentUser.name,
        role: currentUser.role,
        folders,
        openTabs,
        activeTask,
        expandedFolders,
        messages: realtimeMessages,
        unreadTasks,
        darkMode,
        quickActions: customQuickActions,
        onboardingCompleted: true
      };
      saveUserToLocalStorage(currentUser.email, userData);
      collaborationAPI.saveUserData(currentUser.email, userData)
        .catch(err => console.error('Failed to save onboarding status:', err));
    }
  }, [currentUser, folders, openTabs, activeTask, expandedFolders, realtimeMessages, unreadTasks, darkMode, customQuickActions]);

  // Real-time messages state (moved declaration to top)
  const [typingIndicators, setTypingIndicators] = useState({});

  // Ava processing state for progress indicator
  const [avaProcessingSteps, setAvaProcessingSteps] = useState([]);
  const [isAvaProcessing, setIsAvaProcessing] = useState(false);

  // Effect: Auto-save user data to both localStorage and backend when state changes
  useEffect(() => {
    if (isLoggedIn && currentUser?.email && isDataLoaded) {
      const userData = {
        name: currentUser.name,
        role: currentUser.role,
        folders,
        openTabs,
        activeTask,
        expandedFolders,
        messages: realtimeMessages,
        unreadTasks,
        darkMode,
        quickActions: customQuickActions,
        onboardingCompleted
      };

      // Save to localStorage immediately (fast local caching)
      saveUserToLocalStorage(currentUser.email, userData);

      // Debounce backend saves by 500ms to reduce network requests
      const saveTimeout = setTimeout(() => {
        collaborationAPI.saveUserData(currentUser.email, userData)
          .catch(err => console.error('Failed to save user data to backend:', err));
      }, 500);

      return () => clearTimeout(saveTimeout);
    }
  }, [folders, openTabs, activeTask, expandedFolders, realtimeMessages, unreadTasks, darkMode, customQuickActions, onboardingCompleted, isLoggedIn, currentUser, isDataLoaded]);

  // Effect: Check Claude AI configuration status
  useEffect(() => {
    if (isLoggedIn && isDataLoaded) {
      collaborationAPI.getClaudeStatus()
        .then(status => {
          setClaudeConfigured(status.configured);
        })
        .catch(err => {
          console.log('Claude status check failed (expected if backend unavailable):', err.message);
          setClaudeConfigured(false);
        });
    }
  }, [isLoggedIn, isDataLoaded]);

  // Effect: Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setLeftSidebarOpen(false);
        setRightPanelOpen(false);
        setSplitViewTask(null);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effect: Join/leave task rooms when active task changes
  useEffect(() => {
    if (activeTask && isConnected) {
      joinTask(activeTask);

      // Load collaborators from API
      collaborationAPI.getCollaborators(activeTask)
        .then(collabs => {
          setSharedUsers(prev => ({ ...prev, [activeTask]: collabs }));
        })
        .catch(err => console.log('Could not load collaborators:', err.message));
    }

    return () => {
      if (activeTask && isConnected) {
        leaveTask(activeTask);
      }
    };
  }, [activeTask, isConnected, joinTask, leaveTask]);

  // Check Claude API status on login - global key works for all users
  useEffect(() => {
    if (isLoggedIn) {
      collaborationAPI.getClaudeStatus()
        .then(status => {
          if (status?.configured) {
            setClaudeConfigured(true);
          }
        })
        .catch(err => console.log('Could not check Claude status:', err.message));
    }
  }, [isLoggedIn]);

  // Refs to access current values in callbacks without causing re-subscriptions
  const activeTaskRef = useRef(activeTask);
  const currentUserRef = useRef(currentUser);
  useEffect(() => { activeTaskRef.current = activeTask; }, [activeTask]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Effect: Subscribe to real-time messages
  useEffect(() => {
    const unsubMessage = onMessage(({ taskId, message }) => {
      setRealtimeMessages(prev => {
        const existing = prev[taskId] || [];
        // Skip if this message was already added locally (dedup by id)
        if (message.id && existing.some(m => m.id === message.id)) {
          return prev;
        }
        // Skip duplicate user messages from self (added optimistically)
        if (message.isUser && message.userEmail === currentUserRef.current?.email &&
            existing.length > 0 && existing[existing.length - 1].content === message.content &&
            existing[existing.length - 1].isUser) {
          return prev;
        }
        return {
          ...prev,
          [taskId]: [...existing, message]
        };
      });

      // Clear processing indicator when Ava responds
      if (message.userEmail === 'ava@unit4.com') {
        setAvaProcessingSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
        setTimeout(() => {
          setIsAvaProcessing(false);
          setAvaProcessingSteps([]);
        }, 500);
      }

      // Mark task as unread if message is from someone else (or Ava) and task is not active
      const isFromOther = message.userEmail !== currentUserRef.current?.email;
      const isNotActiveTask = taskId !== activeTaskRef.current;

      if (isFromOther && isNotActiveTask) {
        setUnreadTasks(prev => ({
          ...prev,
          [taskId]: (prev[taskId] || 0) + 1
        }));
      }
    });

    const unsubCollaborators = onCollaborators(({ taskId, collaborators }) => {
      setSharedUsers(prev => ({ ...prev, [taskId]: collaborators }));
    });

    const unsubTaskMessages = onTaskMessages(({ taskId, messages }) => {
      if (messages.length > 0) {
        setRealtimeMessages(prev => ({ ...prev, [taskId]: messages }));
      }
    });

    return () => {
      unsubMessage();
      unsubCollaborators();
      unsubTaskMessages();
    };
  }, [onMessage, onCollaborators, onTaskMessages]);

  // Effect: Subscribe to shared task notifications
  useEffect(() => {
    // When a task is shared with the current user, add it to the Shared folder
    const unsubTaskShared = onTaskShared((sharedTaskInfo) => {
      console.log('Task shared with you:', sharedTaskInfo);

      // Create a task entry for the Shared folder
      const newSharedTask = {
        id: sharedTaskInfo.taskId,
        title: sharedTaskInfo.title,
        status: 'pending',
        sharedBy: sharedTaskInfo.sharedBy,
        sharedByName: sharedTaskInfo.sharedByName,
        sharedAt: sharedTaskInfo.sharedAt,
        isSharedTask: true
      };

      // Add to the Shared folder
      setFolders(prev => prev.map(folder => {
        if (folder.isSharedFolder) {
          // Check if task already exists in folder
          const taskExists = folder.tasks.some(t => t.id === newSharedTask.id);
          if (taskExists) return folder;

          return {
            ...folder,
            tasks: [...folder.tasks, newSharedTask]
          };
        }
        return folder;
      }));

      // Show a notification or toast (add to unread)
      setUnreadTasks(prev => ({
        ...prev,
        [sharedTaskInfo.taskId]: 1
      }));
    });

    // When a task is unshared from the current user, remove it from the Shared folder
    const unsubTaskUnshared = onTaskUnshared(({ taskId }) => {
      console.log('Task unshared from you:', taskId);

      setFolders(prev => prev.map(folder => {
        if (folder.isSharedFolder) {
          return {
            ...folder,
            tasks: folder.tasks.filter(t => t.id !== taskId)
          };
        }
        return folder;
      }));
    });

    return () => {
      unsubTaskShared();
      unsubTaskUnshared();
    };
  }, [onTaskShared, onTaskUnshared]);

  // Effect: Update typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTask) {
        const typing = getTypingUsers(activeTask);
        setTypingIndicators(prev => ({ ...prev, [activeTask]: typing }));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [activeTask, getTypingUsers]);

  // Effect: Sync with backend every 10 seconds
  useEffect(() => {
    if (!isLoggedIn) return;

    const performSync = async () => {
      setSyncStatus('syncing');
      try {
        const response = await collaborationAPI.ping();
        if (response.status === 'ok') {
          setSyncStatus('connected');
          setLastSyncTime(new Date());
        }
      } catch (error) {
        console.log('Backend sync failed:', error.message);
        setSyncStatus('disconnected');
      }
    };

    // Initial sync
    performSync();

    // Sync every 10 seconds
    const syncInterval = setInterval(performSync, 10000);

    return () => clearInterval(syncInterval);
  }, [isLoggedIn]);

  // Effect: Fetch shared tasks on login
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.email) return;

    const fetchSharedTasks = async () => {
      try {
        const sharedTasksList = await collaborationAPI.getSharedTasks(currentUser.email);

        if (sharedTasksList && sharedTasksList.length > 0) {
          // Convert shared tasks to folder task format
          const sharedTasksForFolder = sharedTasksList.map(st => ({
            id: st.taskId,
            title: st.title,
            status: 'pending',
            sharedBy: st.sharedBy,
            sharedByName: st.sharedByName,
            sharedAt: st.sharedAt,
            isSharedTask: true
          }));

          // Update the Shared folder with fetched tasks
          setFolders(prev => prev.map(folder => {
            if (folder.isSharedFolder) {
              // Merge with existing tasks, avoiding duplicates
              const existingIds = new Set(folder.tasks.map(t => t.id));
              const newTasks = sharedTasksForFolder.filter(t => !existingIds.has(t.id));
              return {
                ...folder,
                tasks: [...folder.tasks, ...newTasks]
              };
            }
            return folder;
          }));
        }
      } catch (error) {
        console.log('Could not fetch shared tasks:', error.message);
      }
    };

    fetchSharedTasks();
  }, [isLoggedIn, currentUser?.email]);

  // Smart task routing - determines the best task based on message content
  const findBestTaskForMessage = useCallback((message) => {
    const lowerMessage = message.toLowerCase();

    // Define keyword mappings for each task type
    const taskKeywords = {
      'task-absences': [
        'absence', 'absences', 'leave', 'holiday', 'holidays', 'vacation',
        'sick', 'sick day', 'time off', 'pto', 'annual leave', 'day off',
        'book leave', 'request leave', 'out of office', 'ooo', 'away'
      ],
      'task-timesheets': [
        'timesheet', 'timesheets', 'hours', 'log time', 'time entry',
        'submit time', 'track time', 'working hours', 'overtime', 'clock in',
        'clock out', 'time tracking', 'weekly hours', 'billable'
      ],
      'task-expenses': [
        'expense', 'expenses', 'receipt', 'receipts', 'claim', 'reimburse',
        'reimbursement', 'travel expense', 'mileage', 'per diem', 'cost',
        'purchase', 'spent', 'paid for', 'invoice', 'bill'
      ],
      'task-payslips': [
        'payslip', 'payslips', 'pay', 'salary', 'wage', 'wages', 'paycheck',
        'compensation', 'earnings', 'deduction', 'deductions', 'net pay',
        'gross pay', 'p60', 'p45', 'tax', 'pension', 'national insurance'
      ],
      'task-today': [
        'today', 'schedule', 'meeting', 'meetings', 'calendar', 'agenda',
        'appointment', 'task', 'tasks', 'to do', 'todo', 'plan', 'daily',
        'morning', 'afternoon', 'evening', 'this week', 'reminder'
      ]
    };

    // Score each task based on keyword matches
    let bestTask = null;
    let highestScore = 0;

    for (const [taskId, keywords] of Object.entries(taskKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          // Longer keywords get higher scores (more specific matches)
          score += keyword.split(' ').length;
        }
      }
      if (score > highestScore) {
        highestScore = score;
        bestTask = taskId;
      }
    }

    // Find the actual task object from folders
    if (bestTask) {
      for (const folder of folders) {
        const task = folder.tasks?.find(t => t.id === bestTask);
        if (task) return task;
      }
    }

    // Default to Today task if no match found
    const todayTask = folders[0]?.tasks?.find(t => t.id === 'task-today');
    return todayTask || folders[0]?.tasks?.[0];
  }, [folders]);

  // Handle message from welcome screen - smart routing
  const handleWelcomeMessage = useCallback((message) => {
    if (!message.trim()) return;

    const bestTask = findBestTaskForMessage(message);

    if (bestTask) {
      // Open the task tab if not already open
      if (!openTabs.find(t => t.id === bestTask.id)) {
        setOpenTabs(prev => [...prev, bestTask]);
      }

      // Set as active task
      setActiveTask(bestTask.id);

      // Set the input value so the message gets sent
      setInputValue(message);

      // Join the task room for real-time collaboration
      joinTask(bestTask.id);
    }
  }, [findBestTaskForMessage, openTabs, joinTask]);

  // Pin a message to the Notepad folder
  const handlePinMessage = useCallback((content, senderName, timestamp) => {
    // Find the Notepad folder
    const notepadFolder = folders.find(f => f.id === 'folder-notepad');
    if (!notepadFolder) {
      console.log('Notepad folder not found');
      return;
    }

    // Create a title from the first line or first 50 characters
    const firstLine = content.split('\n')[0].substring(0, 50);
    const title = `📌 ${senderName}: ${firstLine}${firstLine.length >= 50 ? '...' : ''}`;

    // Create a new task with the pinned content
    const newTask = {
      id: `pinned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      status: 'pending',
      pinnedContent: content,
      pinnedFrom: senderName,
      pinnedAt: timestamp || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };

    // Update folders to add the new task to Notepad
    setFolders(prev => prev.map(folder => {
      if (folder.id === 'folder-notepad') {
        return {
          ...folder,
          tasks: [...folder.tasks, newTask]
        };
      }
      return folder;
    }));

    // Make sure Notepad folder is expanded
    setExpandedFolders(prev => {
      if (!prev.includes('folder-notepad')) {
        return [...prev, 'folder-notepad'];
      }
      return prev;
    });

    console.log('Message pinned to Notepad:', title);
  }, [folders]);

  // Drag and drop handlers for tabs
  const handleDragStart = (e, index) => {
    setDraggedTabIndex(index);
    e.target.classList.add('opacity-50');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTabIndex(index);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedTabIndex === null || draggedTabIndex === dropIndex) {
      setDraggedTabIndex(null);
      setDragOverTabIndex(null);
      return;
    }

    const newTabs = [...openTabs];
    const [draggedTab] = newTabs.splice(draggedTabIndex, 1);
    newTabs.splice(dropIndex, 0, draggedTab);
    setOpenTabs(newTabs);
    setDraggedTabIndex(null);
    setDragOverTabIndex(null);
  };

  // Handle task click - open in tab
  const handleTaskClick = (task) => {
    // Add to open tabs if not already there
    if (!openTabs.find(t => t.id === task.id)) {
      setOpenTabs([...openTabs, task]);
    }
    setActiveTask(task.id);
    setTabMenuOpenId(null);

    // Clear unread status for this task
    if (unreadTasks[task.id]) {
      setUnreadTasks(prev => {
        const updated = { ...prev };
        delete updated[task.id];
        return updated;
      });
    }
  };

  // Toggle split view for a task
  const toggleSplitView = (taskId) => {
    if (splitViewTask === taskId) {
      setSplitViewTask(null);
    } else {
      setSplitViewTask(taskId);
    }
  };

  // Close a tab
  const closeTab = (taskId) => {
    const newTabs = openTabs.filter(t => t.id !== taskId);
    setOpenTabs(newTabs);

    // Clear split view if closing that tab
    if (splitViewTask === taskId) {
      setSplitViewTask(null);
    }

    // If closing the active tab, switch to another tab
    if (activeTask === taskId && newTabs.length > 0) {
      setActiveTask(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      setActiveTask(null);
    }
  };

  // Get current task name for header
  const getCurrentTaskName = () => {
    const tab = openTabs.find(t => t.id === activeTask);
    return tab ? tab.title : 'Select a Task';
  };

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Handle creating a new task
  const handleCreateTask = async (shareImmediately = false) => {
    if (!newTaskName.trim()) return;

    // Generate unique task ID with timestamp + random suffix to avoid conflicts
    const newTaskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTask = {
      id: newTaskId,
      title: newTaskName.trim(),
      status: 'pending'
    };

    // Determine folder ID for backend
    let folderId = selectedFolderId;

    if (createNewFolder && newFolderName.trim()) {
      // Create new folder with the task
      const newFolderId = `folder-${Date.now()}`;
      folderId = newFolderId;
      const newFolder = {
        id: newFolderId,
        name: newFolderName.trim(),
        tasks: [newTask]
      };
      setFolders([...folders, newFolder]);
      setExpandedFolders([...expandedFolders, newFolderId]);
    } else if (selectedFolderId) {
      // Add task to existing folder
      setFolders(folders.map(folder =>
        folder.id === selectedFolderId
          ? { ...folder, tasks: [...folder.tasks, newTask] }
          : folder
      ));
      // Ensure folder is expanded
      if (!expandedFolders.includes(selectedFolderId)) {
        setExpandedFolders([...expandedFolders, selectedFolderId]);
      }
    }

    // Register task with backend for collaboration (using same unique ID)
    try {
      await collaborationAPI.createTask(newTask.title, folderId, newTask.status, newTaskId);

      // Add current user as the owner/first collaborator
      if (currentUser?.email) {
        await collaborationAPI.addCollaborator(newTaskId, currentUser.email, currentUser.email);
      }
    } catch (error) {
      console.log('Backend registration skipped (offline mode):', error.message);
    }

    // Open the new task in a tab
    setOpenTabs([...openTabs, newTask]);
    setActiveTask(newTaskId);

    // Reset modal state
    setShowNewTaskModal(false);
    setNewTaskName('');
    setSelectedFolderId('');
    setCreateNewFolder(false);
    setNewFolderName('');

    // If share immediately is requested, open the share modal
    if (shareImmediately) {
      setTimeout(() => {
        handleShareTask(newTask);
      }, 100);
    }
  };

  // Handle sharing a task
  const handleShareTask = (task) => {
    setShareTask(task);
    setShareError('');
    setLinkCopied(false);
    setShowShareModal(true);

    // Load current collaborators
    if (task) {
      collaborationAPI.getCollaborators(task.id)
        .then(collabs => {
          setSharedUsers(prev => ({ ...prev, [task.id]: collabs }));
        })
        .catch(err => console.log('Could not load collaborators:', err.message));
    }
  };

  // Add a user to shared list (API)
  const handleAddCollaborator = async () => {
    if (!shareEmail.trim() || !shareTask) return;

    setIsAddingCollaborator(true);
    setShareError('');

    try {
      const collaborator = await collaborationAPI.addCollaborator(
        shareTask.id,
        shareEmail.trim(),
        currentUser.email,
        currentUser.name,
        shareTask.title
      );

      setSharedUsers(prev => ({
        ...prev,
        [shareTask.id]: [...(prev[shareTask.id] || []), collaborator]
      }));
      setShareEmail('');
    } catch (error) {
      setShareError(error.message || 'Failed to add collaborator');
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  // Remove a collaborator (API)
  const handleRemoveCollaborator = async (taskId, email) => {
    try {
      await collaborationAPI.removeCollaborator(taskId, email);
      setSharedUsers(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter(u => u.email !== email)
      }));
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  // Copy share link
  const handleCopyShareLink = (taskId) => {
    const link = `https://ava.unit4.com/task/${taskId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Open rename task modal
  const handleOpenRenameTask = (task) => {
    setRenameTask(task);
    setRenameTaskValue(task.title);
    setShowRenameTaskModal(true);
    setTabMenuOpenId(null);
  };

  // Rename a task
  const handleRenameTask = () => {
    if (!renameTask || !renameTaskValue.trim()) return;

    const newTitle = renameTaskValue.trim();

    // Update in folders
    setFolders(folders.map(folder => ({
      ...folder,
      tasks: folder.tasks.map(task =>
        task.id === renameTask.id
          ? { ...task, title: newTitle }
          : task
      )
    })));

    // Update in open tabs
    setOpenTabs(openTabs.map(tab =>
      tab.id === renameTask.id
        ? { ...tab, title: newTitle }
        : tab
    ));

    // Close modal
    setShowRenameTaskModal(false);
    setRenameTask(null);
    setRenameTaskValue('');
  };

  // Open delete task modal
  const handleOpenDeleteTask = (task) => {
    setDeleteTask(task);
    setShowDeleteTaskModal(true);
    setTabMenuOpenId(null);
  };

  // Delete a task
  const handleDeleteTask = async () => {
    if (!deleteTask) return;

    const taskIdToDelete = deleteTask.id;

    // Remove from folders
    setFolders(folders.map(folder => ({
      ...folder,
      tasks: folder.tasks.filter(task => task.id !== taskIdToDelete)
    })));

    // Remove from open tabs
    const newTabs = openTabs.filter(tab => tab.id !== taskIdToDelete);
    setOpenTabs(newTabs);

    // Clear split view if deleting that task
    if (splitViewTask === taskIdToDelete) {
      setSplitViewTask(null);
    }

    // If deleting the active task, switch to another tab
    if (activeTask === taskIdToDelete) {
      if (newTabs.length > 0) {
        setActiveTask(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTask(null);
      }
    }

    // Clear unread status for deleted task
    if (unreadTasks[taskIdToDelete]) {
      setUnreadTasks(prev => {
        const updated = { ...prev };
        delete updated[taskIdToDelete];
        return updated;
      });
    }

    // Delete from backend database
    try {
      await collaborationAPI.deleteTask(taskIdToDelete);
      console.log(`Task ${taskIdToDelete} deleted from database`);
    } catch (error) {
      console.log('Backend delete skipped (offline mode):', error.message);
    }

    // Close modal
    setShowDeleteTaskModal(false);
    setDeleteTask(null);
  };

  // Open rename folder modal
  const handleOpenRenameFolder = (folder) => {
    // Prevent renaming protected folders
    if (folder.isProtected) return;
    setRenameFolder(folder);
    setRenameFolderValue(folder.name);
    setShowRenameFolderModal(true);
  };

  // Rename a folder
  const handleRenameFolder = () => {
    if (!renameFolder || !renameFolderValue.trim()) return;

    setFolders(folders.map(folder =>
      folder.id === renameFolder.id
        ? { ...folder, name: renameFolderValue.trim() }
        : folder
    ));

    // Close modal
    setShowRenameFolderModal(false);
    setRenameFolder(null);
    setRenameFolderValue('');
  };

  // Open delete folder modal
  const handleOpenDeleteFolder = (folder) => {
    // Prevent deleting protected folders
    if (folder.isProtected) return;
    setDeleteFolderTarget(folder);
    setShowDeleteFolderModal(true);
  };

  // Delete a folder (and all its tasks)
  const handleDeleteFolder = () => {
    if (!deleteFolderTarget) return;

    // Get all task IDs in this folder
    const taskIdsToRemove = deleteFolderTarget.tasks.map(t => t.id);

    // Remove folder
    setFolders(folders.filter(f => f.id !== deleteFolderTarget.id));

    // Remove from expanded folders
    setExpandedFolders(expandedFolders.filter(id => id !== deleteFolderTarget.id));

    // Remove tasks from open tabs
    const newTabs = openTabs.filter(tab => !taskIdsToRemove.includes(tab.id));
    setOpenTabs(newTabs);

    // Clear split view if needed
    if (taskIdsToRemove.includes(splitViewTask)) {
      setSplitViewTask(null);
    }

    // If active task was in deleted folder, switch to another
    if (taskIdsToRemove.includes(activeTask)) {
      if (newTabs.length > 0) {
        setActiveTask(newTabs[newTabs.length - 1].id);
      } else {
        setActiveTask(null);
      }
    }

    // Close modal
    setShowDeleteFolderModal(false);
    setDeleteFolderTarget(null);
  };

  // Get collaborators for a task
  const getTaskCollaborators = (taskId) => sharedUsers[taskId] || [];

  // Get typing users for current task
  const getCurrentTypingUsers = (taskId) => typingIndicators[taskId] || [];

  // Task-specific messages (userEmail is used to determine message colors)
  const taskMessages = {
    'task-0a': [
      { content: "Can you summarize what was discussed in this morning's standup?", isUser: true, timestamp: '9:15 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Of course! Here's a summary of this morning's standup:\n\n• Dev team completed the API integration for the payment module\n• QA reported 3 critical bugs in the checkout flow - being addressed today\n• Design finalized the new dashboard mockups\n• Sprint velocity is on track for the release deadline", isUser: false, timestamp: '9:16 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Were there any blockers mentioned?", isUser: true, timestamp: '9:17 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Yes, two blockers were identified:\n\n1. The third-party vendor hasn't provided updated API credentials yet - Sarah is following up\n2. Server capacity needs approval for the load testing environment - Mike escalated to IT", isUser: false, timestamp: '9:18 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-0b': [
      { content: "Help me prioritize the emails from this morning.", isUser: true, timestamp: '10:00 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "I've analyzed your inbox. Here's the priority breakdown:\n\n🔴 **High Priority (3 emails)**\n• CFO requesting Q4 projections by EOD\n• Client escalation from Acme Corp\n• Security alert from IT\n\n🟡 **Medium Priority (7 emails)**\n• Team meeting reschedule requests\n• Vendor contract renewals\n\n🟢 **Low Priority (12 emails)**\n• Newsletter subscriptions\n• FYI updates", isUser: false, timestamp: '10:01 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Draft a response to the CFO email.", isUser: true, timestamp: '10:05 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Here's a draft response:\n\n\"Hi Michael,\n\nThank you for reaching out. I'm currently finalizing the Q4 projections and will have the complete report ready by 4 PM today.\n\nKey highlights I can share now:\n• Revenue trending 12% above forecast\n• Operating costs within budget\n• Two new enterprise contracts pending\n\nI'll include detailed breakdowns in the full report.\n\nBest regards\"", isUser: false, timestamp: '10:06 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-0c': [
      { content: "What's on the agenda for the team sync?", isUser: true, timestamp: '2:00 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Here's the agenda for today's team sync:\n\n1. **Project Updates** (15 min)\n   - Sprint progress review\n   - Demo of new features\n\n2. **Resource Planning** (10 min)\n   - Q1 hiring needs\n   - Training schedule\n\n3. **Open Discussion** (5 min)\n   - Team concerns\n   - Process improvements", isUser: false, timestamp: '2:01 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-1': [
      { content: "I need help with the Q4 Revenue Report.", isUser: true, timestamp: '2:30 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "I'd be happy to help with the Q4 Revenue Report! Based on the current data:\n\n📊 **Q4 Revenue Summary**\n• Total Revenue: $4.2M (↑15% YoY)\n• Recurring Revenue: $3.1M\n• New Business: $1.1M\n\nWould you like me to help analyze trends, generate visualizations, or draft the executive summary?", isUser: false, timestamp: '2:31 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Let's start with analyzing the revenue trends.", isUser: true, timestamp: '2:32 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Here's the Q4 revenue trend analysis:\n\n**Monthly Breakdown:**\n• October: $1.3M (strongest month)\n• November: $1.5M (↑15% MoM)\n• December: $1.4M (holiday impact)\n\n**Key Insights:**\n1. Enterprise segment grew 23%\n2. SMB segment stable at 8% growth\n3. APAC region outperformed expectations by 18%\n\nShall I create charts for the board presentation?", isUser: false, timestamp: '2:33 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-2': [
      { content: "Help me plan the 2026 budget allocation.", isUser: true, timestamp: '11:00 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "I'll help you structure the 2026 budget. Based on 2025 actuals and growth projections:\n\n**Proposed 2026 Budget Allocation:**\n\n• Personnel: 45% ($5.4M)\n• Technology: 20% ($2.4M)\n• Marketing: 15% ($1.8M)\n• Operations: 12% ($1.44M)\n• R&D: 8% ($960K)\n\nTotal: $12M (20% increase from 2025)\n\nWould you like to adjust any categories?", isUser: false, timestamp: '11:01 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Can we increase R&D to 12%?", isUser: true, timestamp: '11:05 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Absolutely! Here's the revised allocation with R&D at 12%:\n\n**Adjusted 2026 Budget:**\n• Personnel: 43% ($5.16M) - reduced by 2%\n• Technology: 18% ($2.16M) - reduced by 2%\n• Marketing: 15% ($1.8M) - unchanged\n• Operations: 12% ($1.44M) - unchanged\n• R&D: 12% ($1.44M) - increased by 4%\n\nThis supports the new AI initiative roadmap. Shall I prepare the justification document?", isUser: false, timestamp: '11:06 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-3': [
      { content: "Show me the expense audit findings.", isUser: true, timestamp: '3:00 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "✅ **Expense Audit Complete**\n\nHere are the key findings:\n\n**Compliant Areas:**\n• Travel expenses properly documented\n• Vendor payments within policy\n• Payroll accuracy: 99.8%\n\n**Areas of Concern:**\n• 3 instances of missing receipts (total: $847)\n• Software subscriptions overlap detected ($2,400/year savings opportunity)\n\n**Recommendations:**\n1. Implement automated receipt capture\n2. Consolidate redundant SaaS tools", isUser: false, timestamp: '3:01 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-4': [
      { content: "What's the current inventory status?", isUser: true, timestamp: '9:00 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "Here's your inventory analysis:\n\n📦 **Current Stock Levels:**\n• Raw Materials: 85% capacity\n• Work in Progress: 62% capacity\n• Finished Goods: 78% capacity\n\n⚠️ **Alerts:**\n• Component SKU-4521 below reorder point\n• Warehouse B approaching capacity (92%)\n\n📈 **30-Day Forecast:**\n• Expected stockout: SKU-7834 (Dec 15)\n• Overstock risk: SKU-2156 (excess 2,400 units)", isUser: false, timestamp: '9:01 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Generate a reorder recommendation.", isUser: true, timestamp: '9:05 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Recommended Reorder List:**\n\n| SKU | Item | Current | Reorder Qty | Supplier | Lead Time |\n|-----|------|---------|-------------|----------|------------|\n| 4521 | Circuit Board | 150 | 500 | TechParts Co | 14 days |\n| 7834 | Power Supply | 80 | 300 | ElecSource | 21 days |\n| 3298 | Casing Unit | 200 | 400 | PlastiMold | 7 days |\n\nEstimated total: $45,200\nShall I generate the purchase orders?", isUser: false, timestamp: '9:06 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-5': [
      { content: "Summarize our supply chain performance.", isUser: true, timestamp: '10:30 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Supply Chain Review - Q4 2025**\n\n🚚 **Delivery Performance:**\n• On-time delivery: 94.2% (target: 95%)\n• Average lead time: 12.3 days\n• Expedited shipments: 8% of orders\n\n💰 **Cost Metrics:**\n• Freight costs: ↑7% (fuel surcharges)\n• Warehousing: Within budget\n• Supplier costs: Stable\n\n⚡ **Risk Areas:**\n• Single-source dependency for 3 critical components\n• Port congestion affecting APAC shipments", isUser: false, timestamp: '10:31 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-6': [
      { content: "Show me the onboarding checklist status.", isUser: true, timestamp: '8:30 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "✅ **Employee Onboarding Complete**\n\n**New Hires This Month: 5**\n\nAll tasks completed:\n• ✅ IT equipment provisioned\n• ✅ System access granted\n• ✅ Benefits enrollment done\n• ✅ Compliance training finished\n• ✅ Manager introductions scheduled\n• ✅ 30-day check-ins calendared\n\n**Feedback Score:** 4.8/5.0\n\"Smoothest onboarding I've experienced!\" - New hire", isUser: false, timestamp: '8:31 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-7': [
      { content: "Help me prepare for performance reviews.", isUser: true, timestamp: '1:00 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "I'll help you prepare for the upcoming performance reviews.\n\n**Review Period:** Q4 2025\n**Team Size:** 12 employees\n**Due Date:** January 15, 2026\n\n**Preparation Checklist:**\n- [ ] Gather 360 feedback (8/12 complete)\n- [ ] Review goal completion metrics\n- [ ] Document achievements & growth areas\n- [ ] Prepare compensation recommendations\n\nWould you like me to pull the individual performance metrics?", isUser: false, timestamp: '1:01 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Yes, show me the metrics for the team.", isUser: true, timestamp: '1:05 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Team Performance Metrics:**\n\n| Employee | Goals Met | Projects | Rating |\n|----------|-----------|----------|--------|\n| Alice M. | 95% | 4/4 | Exceeds |\n| Bob K. | 88% | 3/4 | Meets |\n| Carol S. | 100% | 5/4 | Exceeds |\n| David L. | 75% | 3/4 | Developing |\n\n**Team Average:** 89.5% goal completion\n**Highlights:** 3 promotions recommended", isUser: false, timestamp: '1:06 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-8': [
      { content: "What training sessions are scheduled?", isUser: true, timestamp: '4:00 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Q1 2026 Training Schedule:**\n\n📅 **January**\n• Jan 8: Leadership Fundamentals (Managers)\n• Jan 15: Cybersecurity Awareness (All staff)\n• Jan 22: New CRM System Training (Sales)\n\n📅 **February**\n• Feb 5: DEI Workshop (All staff)\n• Feb 12: Project Management Certification (Selected)\n• Feb 19: Customer Service Excellence (Support)\n\n📅 **March**\n• Mar 4: Annual Compliance Refresh (All staff)\n• Mar 18: Advanced Excel (Finance)\n\n**Budget Used:** $12,400 / $25,000 allocated", isUser: false, timestamp: '4:01 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-9': [
      { content: "What's the current state of our sales pipeline?", isUser: true, timestamp: '11:30 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Lead Pipeline Report - December 2025**\n\n🎯 **Pipeline Summary:**\n• Total Leads: 247\n• Qualified Opportunities: 89\n• Pipeline Value: $2.8M\n\n**Stage Breakdown:**\n• Discovery: 45 leads ($890K)\n• Proposal: 28 leads ($1.2M)\n• Negotiation: 16 leads ($710K)\n\n**Win Probability:**\n• Expected Close (90 days): $1.4M\n• Weighted Pipeline: $980K\n\n📈 **Trending:** Pipeline up 18% MoM", isUser: false, timestamp: '11:31 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
      { content: "Which deals are closest to closing?", isUser: true, timestamp: '11:35 AM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Hot Deals - Expected to Close This Month:**\n\n1. **Acme Corporation** - $340K\n   - Stage: Contract Review\n   - Probability: 90%\n   - Next Step: Legal approval pending\n\n2. **TechStart Inc** - $180K\n   - Stage: Final Negotiation\n   - Probability: 85%\n   - Next Step: Pricing discussion Friday\n\n3. **Global Logistics** - $275K\n   - Stage: Proposal Sent\n   - Probability: 70%\n   - Next Step: Demo scheduled Dec 12", isUser: false, timestamp: '11:36 AM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
    'task-10': [
      { content: "Analyze our customer retention metrics.", isUser: true, timestamp: '3:30 PM', userEmail: currentUser?.email, userName: currentUser?.name },
      { content: "**Customer Retention Analysis**\n\n📊 **Key Metrics:**\n• Retention Rate: 91.2% (Industry avg: 85%)\n• Churn Rate: 8.8%\n• Net Promoter Score: 62\n\n**Cohort Analysis:**\n• Year 1 customers: 78% retained\n• Year 2+ customers: 95% retained\n• Enterprise tier: 98% retained\n\n⚠️ **At-Risk Accounts (5):**\n• Usage dropped >40% last 90 days\n• Support tickets increased 3x\n\nShall I generate outreach recommendations?", isUser: false, timestamp: '3:31 PM', userEmail: 'ava@unit4.com', userName: 'Ava' },
    ],
  };

  // Get messages for the current task (combines static + real-time)
  const getTaskMessages = (taskId) => {
    const staticMessages = taskMessages[taskId] || [];
    const rtMessages = realtimeMessages[taskId] || [];

    // Check if this is a pinned task — show pinned content as the first message
    const taskObj = folders.flatMap(f => f.tasks).find(t => t.id === taskId);
    const pinnedMessage = taskObj?.pinnedContent ? [{
      content: taskObj.pinnedContent,
      isUser: false,
      timestamp: taskObj.pinnedAt || 'Pinned',
      userEmail: 'ava@unit4.com',
      userName: taskObj.pinnedFrom || 'Ava',
      isPinned: true
    }] : [];

    // If we have real-time messages, use them; otherwise fall back to static
    if (rtMessages.length > 0) {
      return [...pinnedMessage, ...staticMessages, ...rtMessages];
    }

    if (staticMessages.length > 0) {
      return [...pinnedMessage, ...staticMessages];
    }

    // For pinned tasks, show pinned content + a helpful follow-up; for normal tasks, show default
    return pinnedMessage.length > 0
      ? [...pinnedMessage, { content: "Here's the pinned message above. Would you like me to help you with anything related to this?", isUser: false, timestamp: 'Now', userEmail: 'ava@unit4.com', userName: 'Ava' }]
      : [{ content: "How can I help you with this task?", isUser: false, timestamp: 'Now', userEmail: 'ava@unit4.com', userName: 'Ava' }];
  };

  // Available tools for the right panel
  const tools = [
    { icon: Image, label: 'Image Gen', description: 'Generate images with AI' },
    { icon: FileText, label: 'Documents', description: 'View and edit docs' },
    { icon: Sparkles, label: 'AI Actions', description: 'Quick AI-powered tasks' },
  ];

  // Handle sending messages (real-time)
  const handleSend = async () => {
    if (inputValue.trim() && activeTask) {
      const message = inputValue.trim();
      const lowerMessage = message.toLowerCase();

      // Check for quick action creation commands
      const quickActionPatterns = [
        /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?quick\s*action\s+(?:called|named)\s+["']?([^"']+)["']?\s+(?:that\s+)?(?:does|for|to|with|saying?)\s+["']?(.+)["']?/i,
        /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?quick\s*action\s+["']?([^"']+)["']?\s*:\s*["']?(.+)["']?/i,
        /quick\s*action\s+["']?([^"']+)["']?\s*(?:=|:|-)\s*["']?(.+)["']?/i
      ];

      let quickActionMatch = null;
      for (const pattern of quickActionPatterns) {
        const match = message.match(pattern);
        if (match) {
          quickActionMatch = { name: match[1].trim(), prompt: match[2].trim() };
          break;
        }
      }

      if (quickActionMatch && quickActionMatch.name && quickActionMatch.prompt) {
        // Add the quick action
        setCustomQuickActions(prev => [...prev, quickActionMatch]);

        // Send a confirmation message
        const confirmMessage = {
          id: Date.now().toString(),
          content: message,
          isUser: true,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          userName: currentUser?.name,
          userEmail: currentUser?.email
        };

        setRealtimeMessages(prev => ({
          ...prev,
          [activeTask]: [...(prev[activeTask] || []), confirmMessage]
        }));

        // Ava response confirming the action was created
        setTimeout(() => {
          const avaResponse = {
            id: (Date.now() + 1).toString(),
            content: `I've created a new quick action called "${quickActionMatch.name}" for you! You can find it in the Quick Actions panel on the right. When you click it, I'll receive the message: "${quickActionMatch.prompt}"`,
            isUser: false,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            userName: 'Ava',
            userEmail: 'ava@unit4.com'
          };
          setRealtimeMessages(prev => ({
            ...prev,
            [activeTask]: [...(prev[activeTask] || []), avaResponse]
          }));
        }, 500);

        setInputValue('');
        return;
      }

      // Normal message handling
      // Show progress indicator
      setIsAvaProcessing(true);
      setAvaProcessingSteps([
        { text: 'Receiving your message', status: 'completed' },
        { text: 'Analyzing request', status: 'in_progress' },
        { text: 'Generating response', status: 'pending' },
        { text: 'Sending reply', status: 'pending' }
      ]);

      // Add user message to local state immediately
      const userMessage = {
        id: Date.now().toString(),
        content: message,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        userName: currentUser?.name,
        userEmail: currentUser?.email
      };

      setRealtimeMessages(prev => ({
        ...prev,
        [activeTask]: [...(prev[activeTask] || []), userMessage]
      }));

      // Send via WebSocket for real-time sync
      if (isConnected) {
        sendMessage(activeTask, message, true);
      }

      stopTyping(activeTask);
      setInputValue('');

      // Ava's response is now generated server-side (via Claude API if configured, or fallback)
      // and broadcast back via the socket 'message:new' event.
      // The onMessage listener handles adding the response to state
      // and clearing the processing indicator when Ava's message arrives.

      // Safety timeout — clear processing indicator if no response within 30s
      setTimeout(() => {
        setIsAvaProcessing(prev => {
          if (prev) {
            setAvaProcessingSteps([]);
            return false;
          }
          return prev;
        });
      }, 30000);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (activeTask && e.target.value.trim()) {
      startTyping(activeTask);
    } else if (activeTask) {
      stopTyping(activeTask);
    }
  };

  // Close mobile menu when clicking a task
  const handleMobileTaskClick = (task) => {
    handleTaskClick(task);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Mobile Overlay Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        data-tour="sidebar"
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${leftSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`
        } border-r ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4 py-2">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            )}
            <img
              src={appSettings.logoUrl}
              alt="Logo"
              className={`h-8 mx-auto ${darkMode ? 'brightness-0 invert' : ''}`}
              onError={(e) => { e.target.src = DEFAULT_APP_SETTINGS.logoUrl; }}
            />
            {isMobile && <div className="w-8" />}
          </div>
          <button
            onClick={() => {
              setShowNewTaskModal(true);
              if (isMobile) setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white rounded-md font-medium transition-colors touch-manipulation`}
          >
            <Plus size={14} />
            New Task
          </button>
        </div>

        {/* Folders and Tasks List */}
        <div className="flex-1 overflow-y-auto p-2">
          {folders.map((folder) => (
            <FolderItem
              key={folder.id}
              folder={folder}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              activeTask={activeTask}
              onTaskClick={handleMobileTaskClick}
              onRenameFolder={handleOpenRenameFolder}
              onDeleteFolder={handleOpenDeleteFolder}
              unreadTasks={unreadTasks}
              darkMode={darkMode}
            />
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} relative`}>
          {/* Flyout Menu */}
          {userMenuOpen && (
            <>
            <div className="fixed inset-0 z-[9]" onClick={() => setUserMenuOpen(false)} />
            <div className={`absolute bottom-full left-3 right-3 mb-2 rounded-lg shadow-lg border py-1 z-10 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => { console.log('Settings clicked'); setUserMenuOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-3 transition-colors touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowOnboarding(true);
                  setUserMenuOpen(false);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-3 transition-colors touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <HelpCircle size={16} />
                <span className="text-sm">Start Tour</span>
              </button>
              {/* Only admin can manage users and app settings */}
              {currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const users = await collaborationAPI.getAllUsers();
                        setSystemUsers(users);
                      } catch (err) {
                        console.error('Failed to load users:', err);
                        setSystemUsers([]);
                      }
                      setShowManageUsers(true);
                      setUserMenuOpen(false);
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-3 transition-colors touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <UserCog size={16} />
                    <span className="text-sm">Manage Users</span>
                  </button>
                  <button
                    onClick={() => {
                      setTempLogoUrl(appSettings.logoUrl);
                      setShowAdminSettings(true);
                      setUserMenuOpen(false);
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-3 transition-colors touch-manipulation ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Palette size={16} />
                    <span className="text-sm">App Appearance</span>
                  </button>
                  <div className={`border-t my-1 ${darkMode ? 'border-gray-600' : 'border-gray-100'}`} />
                </>
              )}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-2 px-3 py-3 text-red-500 transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'}`}
              >
                <LogOut size={16} />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
            </>
          )}

          {/* MCP Plugins Button */}
          <button
            onClick={() => {
              setShowMCPPlugins(true);
              if (isMobile) setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors touch-manipulation mb-2 ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Plug size={16} className={THEME_COLORS[appSettings.themeColor].primaryText} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>MCP Plugins</p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {(appSettings.mcpPlugins || []).filter(p => p.enabled).length} active
              </p>
            </div>
            <ChevronRight size={16} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          </button>

          {/* User Avatar Button */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-manipulation ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            <div className={`w-9 h-9 rounded-full ${getAvatarColor(currentUser?.email || '')} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
              {getInitials(currentUser?.name)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{currentUser?.name}</p>
              <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentUser?.email}</p>
            </div>
            <ChevronUp size={16} className={`transition-transform flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'} ${userMenuOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className={`h-14 border-b flex items-center justify-between px-2 sm:px-4 transition-colors ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger menu */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            )}
            {/* Desktop sidebar toggle */}
            {!isMobile && (
              <button
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  leftSidebarOpen
                    ? 'bg-green-100 text-green-600'
                    : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
                aria-label="Toggle tasks panel"
              >
                {leftSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
              </button>
            )}
            <h1 className={`font-semibold truncate text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {showManageUsers ? 'Manage Users' : getCurrentTaskName()}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {splitViewTask && !isMobile && (
              <button
                onClick={() => setSplitViewTask(null)}
                className="px-2 sm:px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Exit Split</span>
              </button>
            )}

            {/* Sync Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                syncStatus === 'connected'
                  ? darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-600'
                  : syncStatus === 'syncing'
                  ? darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-600'
              }`}
              title={lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : 'Not synced'}
            >
              {syncStatus === 'connected' && (
                <>
                  <CheckCircle size={14} />
                  <span className="hidden sm:inline">Synced</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Syncing</span>
                </>
              )}
              {syncStatus === 'disconnected' && (
                <>
                  <WifiOff size={14} />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              data-tour="dark-mode"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all ${
                darkMode
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={`p-2 rounded-lg transition-colors ${
                rightPanelOpen
                  ? 'bg-green-100 text-green-600'
                  : darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Toggle tools panel"
            >
              {rightPanelOpen ? <PanelRightClose size={20} /> : <PanelRight size={20} />}
            </button>
          </div>
        </header>

        {/* Tabs Bar */}
        {openTabs.length > 0 && (
          <div
            className={`flex items-center border-b overflow-x-auto scrollbar-hide ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}
            style={{ WebkitOverflowScrolling: 'touch' }}
            onDragLeave={() => setDragOverTabIndex(null)}
            onClick={() => setTabMenuOpenId(null)}
          >
            {openTabs.map((tab, index) => (
              <Tab
                key={tab.id}
                task={tab}
                index={index}
                isActive={activeTask === tab.id}
                onClick={() => handleTaskClick(tab)}
                onClose={closeTab}
                onDragStart={isMobile ? () => {} : handleDragStart}
                onDragOver={isMobile ? () => {} : handleDragOver}
                onDrop={isMobile ? () => {} : handleDrop}
                isDraggedOver={!isMobile && dragOverTabIndex === index}
                onSplitView={isMobile ? () => {} : toggleSplitView}
                onShare={handleShareTask}
                onRename={handleOpenRenameTask}
                onDelete={handleOpenDeleteTask}
                menuOpenId={tabMenuOpenId}
                setMenuOpenId={setTabMenuOpenId}
                splitViewTask={splitViewTask}
                isMobile={isMobile}
                unreadCount={unreadTasks[tab.id] || 0}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}

        {/* Messages Area - Split View Support */}
        <div className={`flex-1 flex ${splitViewTask && !isMobile ? 'gap-0' : ''} overflow-hidden`}>
          {/* Primary Panel */}
          <div className={`${splitViewTask && !isMobile ? `w-1/2 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}` : 'w-full'} overflow-y-auto px-3 sm:px-4 py-4 sm:py-6`}>
            {/* Manage Users View */}
            {showManageUsers ? (
              <div className={`max-w-3xl mx-auto ${darkMode ? 'text-gray-100' : ''}`}>
                <div className="mb-4 sm:mb-6">
                  <button
                    onClick={() => setShowManageUsers(false)}
                    className={`flex items-center gap-2 transition-colors mb-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm">Back to tasks</span>
                  </button>
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${THEME_COLORS[appSettings.themeColor].primaryLight}`}>
                        <UserCog size={24} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                      </div>
                      <div>
                        <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Manage Users</h1>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create, view and manage system users</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateUserForm(!showCreateUserForm);
                        setCreateUserError('');
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        showCreateUserForm
                          ? darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          : `${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white`
                      }`}
                    >
                      {showCreateUserForm ? (
                        <>
                          <X size={18} />
                          <span>Cancel</span>
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          <span>Create User</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Create User Form */}
                {showCreateUserForm && (
                  <div className={`mb-6 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h3 className={`font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Create New User</h3>
                    {createUserError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {createUserError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="John Smith"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'border-gray-300'
                          } focus:ring-${appSettings.themeColor}-500`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="john.smith@unit4.com"
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                              : 'border-gray-300'
                          } focus:ring-${appSettings.themeColor}-500`}
                        />
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Must be a @unit4.com email</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          PSO Role *
                        </label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100'
                              : 'border-gray-300'
                          } focus:ring-${appSettings.themeColor}-500`}
                        >
                          {PSO_ROLES.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name} - {role.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={async () => {
                          // Validate inputs
                          if (!newUserName.trim()) {
                            setCreateUserError('Please enter a name');
                            return;
                          }
                          if (!newUserEmail.trim()) {
                            setCreateUserError('Please enter an email address');
                            return;
                          }
                          if (!newUserEmail.toLowerCase().endsWith('@unit4.com')) {
                            setCreateUserError('Email must be a @unit4.com address');
                            return;
                          }

                          try {
                            // Check if user exists via backend
                            const exists = await collaborationAPI.userExists(newUserEmail);
                            if (exists) {
                              setCreateUserError('A user with this email already exists');
                              return;
                            }

                            // Create the user via backend API
                            await collaborationAPI.createUser(
                              newUserEmail.toLowerCase(),
                              newUserName.trim(),
                              newUserRole,
                              currentUser?.email
                            );

                            // Refresh user list from backend
                            const users = await collaborationAPI.getAllUsers();
                            setSystemUsers(users);
                            setNewUserName('');
                            setNewUserEmail('');
                            setNewUserRole('consultant');
                            setCreateUserError('');
                            setShowCreateUserForm(false);
                          } catch (err) {
                            console.error('Failed to create user:', err);
                            setCreateUserError(err.message || 'Failed to create user');
                          }
                        }}
                        className={`px-4 py-2 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white rounded-lg font-medium transition-colors`}
                      >
                        Create User
                      </button>
                    </div>
                  </div>
                )}

                {systemUsers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No users found in the system</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {systemUsers.map((user) => {
                      const isCurrentUser = user.email.toLowerCase() === currentUser?.email?.toLowerCase();
                      const isAdminUser = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                      const canRemove = !isCurrentUser && !isAdminUser;
                      const userRole = PSO_ROLES.find(r => r.id === user.role);
                      return (
                        <div
                          key={user.email}
                          className={`flex items-center justify-between p-4 border rounded-xl ${
                            darkMode
                              ? isAdminUser ? 'border-purple-800 bg-purple-900/30' :
                                isCurrentUser ? 'border-green-800 bg-green-900/30' : 'border-gray-700 bg-gray-800'
                              : isAdminUser ? 'border-purple-200 bg-purple-50/50 shadow-sm' :
                                isCurrentUser ? 'border-green-200 bg-green-50/50 shadow-sm' : 'border-gray-200 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.email)} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
                              {getInitials(user.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{user.name}</p>
                                {isAdminUser && (
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${darkMode ? 'bg-purple-800 text-purple-200' : 'bg-purple-100 text-purple-700'}`}>Admin</span>
                                )}
                                {isCurrentUser && (
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-700'}`}>You</span>
                                )}
                              </div>
                              <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                              <div className={`flex items-center gap-3 mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {userRole && (
                                  <span className={`px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {userRole.name}
                                  </span>
                                )}
                                <span>{user.taskCount} tasks</span>
                                {user.lastUpdated && (
                                  <span className="hidden sm:inline">Last active: {new Date(user.lastUpdated).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {canRemove ? (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to remove ${user.name} (${user.email}) from the system? This will delete all their data.`)) {
                                  try {
                                    await collaborationAPI.deleteUser(user.email);
                                    const users = await collaborationAPI.getAllUsers();
                                    setSystemUsers(users);
                                  } catch (err) {
                                    console.error('Failed to delete user:', err);
                                    alert('Failed to delete user: ' + err.message);
                                  }
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2 text-red-600 rounded-lg transition-colors text-sm flex-shrink-0 ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                            >
                              <UserMinus size={16} />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          ) : (
                            <span className={`text-xs px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {isAdminUser ? 'Protected' : ''}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={`mt-6 p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <strong>Note:</strong> Removing a user will permanently delete all their tasks, folders, and messages stored in this browser. This action cannot be undone.
                  </p>
                </div>
              </div>
            ) : openTabs.length > 0 ? (
              <div data-tour="chat-area" className="max-w-3xl mx-auto">
                <div className="mb-3 sm:mb-4 pb-2 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xs sm:text-sm font-medium text-gray-500 truncate">{getCurrentTaskName()}</h2>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {getTaskCollaborators(activeTask).length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-50 rounded-full">
                        <Users size={10} className="text-green-600 sm:w-3 sm:h-3" />
                        <span className="text-[10px] sm:text-xs text-green-700">{getTaskCollaborators(activeTask).length}</span>
                      </div>
                    )}
                    <button
                      data-tour="share-button"
                      onClick={() => handleShareTask(openTabs.find(t => t.id === activeTask))}
                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors text-[10px] sm:text-xs touch-manipulation"
                    >
                      <Share2 size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>
                {getTaskMessages(activeTask).map((msg, idx) => (
                  <Message
                    key={idx}
                    content={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                    userName={msg.userName}
                    userEmail={msg.userEmail}
                    currentUserEmail={currentUser?.email}
                    onPinMessage={handlePinMessage}
                    darkMode={darkMode}
                    themeHex={THEME_COLORS[appSettings.themeColor].hex}
                  />
                ))}
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <div className="text-center px-4 w-full max-w-4xl">
                  {/* Welcome Greeting */}
                  <div className="mb-8">
                    <Sparkles size={48} className={`mx-auto mb-4 ${THEME_COLORS[appSettings.themeColor].primaryText}`} />
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      Hi {currentUser?.name?.split(' ')[0] || 'there'}!
                    </h1>
                    <p className={`text-lg sm:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Let's do great things today!
                    </p>
                  </div>

                  {/* Large Input Box - Smart Ava routing */}
                  <div className={`flex items-end gap-3 rounded-2xl border p-4 transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 focus-within:border-' + appSettings.themeColor + '-500 focus-within:ring-2 focus-within:ring-' + appSettings.themeColor + '-900'
                      : 'bg-gray-50 border-gray-200 focus-within:border-' + appSettings.themeColor + '-300 focus-within:ring-2 focus-within:ring-' + appSettings.themeColor + '-100 focus-within:shadow-lg'
                  }`}>
                    <textarea
                      id="welcome-input"
                      placeholder="Ask me about leave, timesheets, expenses, payslips, or anything else..."
                      className={`flex-1 resize-none bg-transparent border-none outline-none text-base sm:text-lg min-h-[28px] max-h-32 ${
                        darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'
                      }`}
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && e.target.value.trim()) {
                          e.preventDefault();
                          // Smart routing - find the best task for this message
                          handleWelcomeMessage(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('welcome-input');
                        if (input && input.value.trim()) {
                          handleWelcomeMessage(input.value);
                          input.value = '';
                        }
                      }}
                      className={`p-3 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white rounded-xl transition-colors`}
                    >
                      <Send size={22} />
                    </button>
                  </div>

                  {/* Smart Routing Hint */}
                  <p className={`mt-3 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    💡 Ava will automatically route your question to the right task
                  </p>

                  {/* Quick Actions */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {folders[0]?.tasks?.slice(0, 4).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => {
                          if (!openTabs.find(t => t.id === task.id)) {
                            setOpenTabs([...openTabs, task]);
                          }
                          setActiveTask(task.id);
                          if (isMobile) setMobileMenuOpen(false);
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Split View Panel - Hidden on mobile */}
          {splitViewTask && !isMobile && (
            <div className="w-1/2 overflow-y-auto px-4 py-6 bg-gray-50">
              <div className="max-w-3xl mx-auto">
                <div className="mb-4 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-500">
                    {openTabs.find(t => t.id === splitViewTask)?.title || 'Split View'}
                  </h2>
                  <button
                    onClick={() => setSplitViewTask(null)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
                {getTaskMessages(splitViewTask).map((msg, idx) => (
                  <Message
                    key={`split-${idx}`}
                    content={msg.content}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                    userName={msg.userName}
                    userEmail={msg.userEmail}
                    currentUserEmail={currentUser?.email}
                    onPinMessage={handlePinMessage}
                    darkMode={darkMode}
                    themeHex={THEME_COLORS[appSettings.themeColor].hex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Hidden when managing users or no task selected */}
        {!showManageUsers && activeTask && (
        <div className={`border-t p-2 sm:p-4 transition-colors ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-3xl mx-auto">
            {/* Typing Indicator */}
            {getCurrentTypingUsers(activeTask).length > 0 && (
              <div className={`flex items-center gap-2 mb-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="truncate">
                  {getCurrentTypingUsers(activeTask).map(u => u.name).join(', ')} {getCurrentTypingUsers(activeTask).length === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            )}
            <div className={`flex items-end gap-2 sm:gap-3 rounded-2xl border p-2 sm:p-3 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-900' : 'bg-gray-50 border-gray-200 focus-within:border-green-300 focus-within:ring-2 focus-within:ring-green-100'}`}>
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Ava..."
                className={`flex-1 resize-none bg-transparent border-none outline-none text-sm min-h-[24px] max-h-32 ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`p-2.5 sm:p-2 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors touch-manipulation`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2">
              <div className="flex items-center gap-1 sm:gap-1.5">
                {isConnected ? (
                  <>
                    <Wifi size={10} className="text-green-500 sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={10} className="text-gray-400 sm:w-3 sm:h-3" />
                    <span className="text-[10px] sm:text-xs text-gray-400">Offline</span>
                  </>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                Ava can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Mobile Right Panel Backdrop */}
      {isMobile && rightPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setRightPanelOpen(false)}
        />
      )}

      {/* Right Tools Panel */}
      <div
        data-tour="tools-panel"
        className={`${
          isMobile
            ? `fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`
            : `${rightPanelOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden`
        } border-l ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} flex flex-col`}
      >
        {/* Panel Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench size={18} className="text-green-500" />
              <h2 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Tools & Actions</h2>
            </div>
            {isMobile && (
              <button
                onClick={() => setRightPanelOpen(false)}
                className={`p-1.5 rounded-lg transition-colors touch-manipulation ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X size={18} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            )}
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick access to utilities</p>
        </div>

        {/* Data Insights Panel - shows when a financial task is active */}
        {activeTask && (
          <DataInsightsPanel
            insights={getInsightsForTask(getCurrentTaskName())}
            darkMode={darkMode}
            themeColor={appSettings.themeColor}
            expanded={insightsExpanded}
            onToggle={() => setInsightsExpanded(!insightsExpanded)}
          />
        )}

        {/* Ava Processing Progress */}
        {isAvaProcessing && avaProcessingSteps.length > 0 && (
          <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Loader2 size={16} className={`animate-spin ${THEME_COLORS[appSettings.themeColor].primaryText}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ava is working...</span>
            </div>
            <div className="space-y-2">
              {avaProcessingSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  {step.status === 'completed' ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : step.status === 'in_progress' ? (
                    <Loader2 size={14} className={`animate-spin ${THEME_COLORS[appSettings.themeColor].primaryText}`} />
                  ) : (
                    <Circle size={14} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
                  )}
                  <span className={`text-xs ${
                    step.status === 'completed'
                      ? darkMode ? 'text-green-400' : 'text-green-600'
                      : step.status === 'in_progress'
                        ? darkMode ? 'text-gray-200' : 'text-gray-700'
                        : darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tools List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {tools.map((tool, idx) => (
            <ToolButton
              key={idx}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              onClick={() => console.log(`Clicked: ${tool.label}`)}
              darkMode={darkMode}
            />
          ))}

          {/* MCP Plugin Tools */}
          {mcpTools.length > 0 && (
            <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <Plug size={14} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  MCP Tools ({mcpTools.length})
                </span>
              </div>
              {mcpTools.map((tool, idx) => (
                <button
                  key={`mcp-${idx}`}
                  onClick={async () => {
                    if (activeTask) {
                      // Add a message about using the tool
                      setInputValue(`Use the "${tool.name}" tool from ${tool.pluginName}`);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left mb-1 ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-purple-900/50' : 'bg-purple-100'
                  }`}>
                    <Zap size={16} className="text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {tool.name}
                    </p>
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tool.description || tool.pluginName}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div data-tour="quick-actions" className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quick Actions</span>
            <button
              onClick={() => {
                setEditingActionIndex(null);
                setNewActionName('');
                setNewActionPrompt('');
                setShowQuickActionModal(true);
              }}
              className={`text-xs ${THEME_COLORS[appSettings.themeColor].primaryText} hover:underline`}
            >
              + Add
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Default Quick Actions */}
            {['Summarize', 'Translate', 'Explain', 'Format'].map((action) => (
              <button
                key={action}
                onClick={() => {
                  if (activeTask) {
                    setInputValue(`Please ${action.toLowerCase()} this for me`);
                  }
                }}
                className={`p-2 text-xs border rounded-lg transition-colors ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-' + appSettings.themeColor + '-500 hover:bg-gray-600' : 'bg-white border-gray-200 hover:border-' + appSettings.themeColor + '-300 hover:bg-' + appSettings.themeColor + '-50'}`}
              >
                {action}
              </button>
            ))}
            {/* Custom Quick Actions */}
            {customQuickActions.map((action, index) => (
              <button
                key={`custom-${index}`}
                onClick={() => {
                  if (activeTask) {
                    setInputValue(action.prompt);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setEditingActionIndex(index);
                  setNewActionName(action.name);
                  setNewActionPrompt(action.prompt);
                  setShowQuickActionModal(true);
                }}
                className={`p-2 text-xs border rounded-lg transition-colors relative group ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-' + appSettings.themeColor + '-500 hover:bg-gray-600' : 'bg-white border-gray-200 hover:border-' + appSettings.themeColor + '-300 hover:bg-' + appSettings.themeColor + '-50'}`}
                title="Right-click to edit"
              >
                {action.name}
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${THEME_COLORS[appSettings.themeColor].primary}`} />
              </button>
            ))}
          </div>
          {customQuickActions.length > 0 && (
            <p className={`text-[10px] mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Right-click custom actions to edit
            </p>
          )}
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowNewTaskModal(false)}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Create New Task</h2>
              <button
                onClick={() => {
                  setShowNewTaskModal(false);
                  setNewTaskName('');
                  setSelectedFolderId('');
                  setCreateNewFolder(false);
                  setNewFolderName('');
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Task Name Input */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Task Name
                </label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name..."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300'}`}
                  autoFocus
                />
              </div>

              {/* Folder Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Add to Folder
                </label>

                {/* Existing Folders */}
                <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                  {folders.map((folder) => (
                    <label
                      key={folder.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFolderId === folder.id && !createNewFolder
                          ? darkMode ? 'border-green-500 bg-green-900/30' : 'border-green-500 bg-green-50'
                          : darkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="folder"
                        checked={selectedFolderId === folder.id && !createNewFolder}
                        onChange={() => {
                          setSelectedFolderId(folder.id);
                          setCreateNewFolder(false);
                        }}
                        className="text-green-500 focus:ring-green-500"
                      />
                      <Folder size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                      <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{folder.name}</span>
                      <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{folder.tasks.length} tasks</span>
                    </label>
                  ))}
                </div>

                {/* Create New Folder Option */}
                <div
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    createNewFolder
                      ? darkMode ? 'border-green-500 bg-green-900/30' : 'border-green-500 bg-green-50'
                      : darkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setCreateNewFolder(true)}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="folder"
                      checked={createNewFolder}
                      onChange={() => setCreateNewFolder(true)}
                      className="text-green-500 focus:ring-green-500"
                    />
                    <Plus size={16} className="text-green-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Create new folder</span>
                  </label>

                  {createNewFolder && (
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name..."
                      className={`w-full mt-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300'}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowNewTaskModal(false);
                  setNewTaskName('');
                  setSelectedFolderId('');
                  setCreateNewFolder(false);
                  setNewFolderName('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateTask(false)}
                  disabled={!newTaskName.trim() || (!selectedFolderId && !createNewFolder) || (createNewFolder && !newFolderName.trim())}
                  className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors disabled:cursor-not-allowed ${darkMode ? 'text-gray-300 bg-gray-700 border-gray-600 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'}`}
                >
                  Create
                </button>
                <button
                  onClick={() => handleCreateTask(true)}
                  disabled={!newTaskName.trim() || (!selectedFolderId && !createNewFolder) || (createNewFolder && !newFolderName.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2`}
                >
                  <Share2 size={14} />
                  Create & Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Share2 size={20} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Share Task</h2>
              </div>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareTask(null);
                  setShareEmail('');
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Task Info */}
              <div className={`rounded-lg p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sharing task:</p>
                <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{shareTask.title}</p>
              </div>

              {/* Add Collaborator */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Invite collaborators
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => {
                      setShareEmail(e.target.value);
                      setShareError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isAddingCollaborator) {
                        e.preventDefault();
                        handleAddCollaborator();
                      }
                    }}
                    placeholder="Enter email address..."
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${
                      shareError
                        ? 'border-red-300'
                        : darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300'
                    }`}
                    disabled={isAddingCollaborator}
                  />
                  <button
                    onClick={handleAddCollaborator}
                    disabled={!shareEmail.trim() || isAddingCollaborator}
                    className={`px-4 py-2 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2`}
                  >
                    {isAddingCollaborator ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
                {shareError && (
                  <p className="text-xs text-red-500 mt-1">{shareError}</p>
                )}
              </div>

              {/* Current Collaborators */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Collaborators
                </label>
                {getTaskCollaborators(shareTask.id).length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getTaskCollaborators(shareTask.id).map((user, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? THEME_COLORS[appSettings.themeColor].primaryDarkBg : THEME_COLORS[appSettings.themeColor].primaryLight}`}>
                            <Users size={14} className={darkMode ? THEME_COLORS[appSettings.themeColor].primaryDarkText : THEME_COLORS[appSettings.themeColor].primaryText} />
                          </div>
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user.email}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Can edit & collaborate</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveCollaborator(shareTask.id, user.email)}
                          className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <X size={14} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No collaborators yet</p>
                    <p className="text-xs">Add team members to collaborate in real-time</p>
                  </div>
                )}
              </div>

              {/* Share Link */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Share link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://ava.unit4.com/task/${shareTask.id}`}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  />
                  <button
                    onClick={() => handleCopyShareLink(shareTask.id)}
                    className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
                      linkCopied
                        ? darkMode ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-green-50 border-green-300 text-green-700'
                        : darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareTask(null);
                  setShareEmail('');
                }}
                className={`px-4 py-2 text-sm font-medium text-white ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} rounded-lg transition-colors`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Task Modal */}
      {showRenameTaskModal && renameTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowRenameTaskModal(false); setRenameTask(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Pencil size={20} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Rename Task</h2>
              </div>
              <button
                onClick={() => {
                  setShowRenameTaskModal(false);
                  setRenameTask(null);
                  setRenameTaskValue('');
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Task Name
              </label>
              <input
                type="text"
                value={renameTaskValue}
                onChange={(e) => setRenameTaskValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameTask();
                  }
                }}
                placeholder="Enter task name..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300'}`}
                autoFocus
              />
            </div>
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowRenameTaskModal(false);
                  setRenameTask(null);
                  setRenameTaskValue('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRenameTask}
                disabled={!renameTaskValue.trim() || renameTaskValue.trim() === renameTask.title}
                className={`px-4 py-2 text-sm font-medium text-white ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors`}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteTaskModal && deleteTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowDeleteTaskModal(false); setDeleteTask(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Delete Task</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setDeleteTask(null);
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Are you sure you want to delete <span className="font-semibold">"{deleteTask.title}"</span>?
              </p>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This action cannot be undone. All messages and collaboration data for this task will be permanently removed.
              </p>
            </div>
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setDeleteTask(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolderModal && renameFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowRenameFolderModal(false); setRenameFolder(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <FolderEdit size={20} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Rename Folder</h2>
              </div>
              <button
                onClick={() => {
                  setShowRenameFolderModal(false);
                  setRenameFolder(null);
                  setRenameFolderValue('');
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Folder Name
              </label>
              <input
                type="text"
                value={renameFolderValue}
                onChange={(e) => setRenameFolderValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameFolder();
                  }
                }}
                placeholder="Enter folder name..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-300'}`}
                autoFocus
              />
            </div>
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowRenameFolderModal(false);
                  setRenameFolder(null);
                  setRenameFolderValue('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                disabled={!renameFolderValue.trim() || renameFolderValue.trim() === renameFolder.name}
                className={`px-4 py-2 text-sm font-medium text-white ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors`}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDeleteFolderModal && deleteFolderTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowDeleteFolderModal(false); setDeleteFolderTarget(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Trash2 size={20} className="text-red-500" />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Delete Folder</h2>
              </div>
              <button
                onClick={() => {
                  setShowDeleteFolderModal(false);
                  setDeleteFolderTarget(null);
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Are you sure you want to delete the folder <span className="font-semibold">"{deleteFolderTarget.name}"</span>?
              </p>
              <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  ⚠️ This will also delete {deleteFolderTarget.tasks.length} task{deleteFolderTarget.tasks.length !== 1 ? 's' : ''} in this folder
                </p>
              </div>
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                This action cannot be undone.
              </p>
            </div>
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setShowDeleteFolderModal(false);
                  setDeleteFolderTarget(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal - App Appearance */}
      {showAdminSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowAdminSettings(false)}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Palette size={20} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>App Appearance</h2>
              </div>
              <button
                onClick={() => setShowAdminSettings(false)}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Logo Settings */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Company Logo
                </label>
                <div className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  {/* Current Logo Preview */}
                  <div className="flex items-center justify-center mb-4 p-4 bg-white rounded-lg border border-gray-200">
                    <img
                      src={appSettings.logoUrl}
                      alt="Current Logo"
                      className="h-10 max-w-full object-contain"
                      onError={(e) => { e.target.src = DEFAULT_APP_SETTINGS.logoUrl; }}
                    />
                  </div>

                  {/* Logo URL Input */}
                  <div className="space-y-2">
                    <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Logo URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={tempLogoUrl}
                        onChange={(e) => setTempLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.svg"
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-' + appSettings.themeColor + '-500'
                            : 'border-gray-300 focus:ring-' + appSettings.themeColor + '-500 focus:border-transparent'
                        }`}
                      />
                      <button
                        onClick={() => {
                          if (tempLogoUrl) {
                            const newSettings = { ...appSettings, logoUrl: tempLogoUrl };
                            setAppSettings(newSettings);
                            saveAppSettings(newSettings);
                          }
                        }}
                        className={`px-3 py-2 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white rounded-lg text-sm font-medium transition-colors`}
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Reset to Default */}
                  <button
                    onClick={() => {
                      setTempLogoUrl(DEFAULT_APP_SETTINGS.logoUrl);
                      const newSettings = { ...appSettings, logoUrl: DEFAULT_APP_SETTINGS.logoUrl };
                      setAppSettings(newSettings);
                      saveAppSettings(newSettings);
                    }}
                    className={`mt-3 flex items-center gap-1 text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
                  >
                    <RotateCcw size={12} />
                    Reset to Unit4 logo
                  </button>
                </div>
              </div>

              {/* Theme Color Settings */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Theme Color
                </label>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Choose the primary accent color for the application
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {Object.entries(THEME_COLORS).map(([colorName, colorConfig]) => (
                    <button
                      key={colorName}
                      onClick={() => {
                        const newSettings = { ...appSettings, themeColor: colorName };
                        setAppSettings(newSettings);
                        saveAppSettings(newSettings);
                      }}
                      className={`relative w-full aspect-square rounded-xl transition-all ${colorConfig.primary} ${
                        appSettings.themeColor === colorName
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      title={colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                    >
                      {appSettings.themeColor === colorName && (
                        <CheckCircle size={16} className="absolute inset-0 m-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
                <p className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Current: <span className="font-medium capitalize">{appSettings.themeColor}</span>
                </p>
              </div>

              {/* Claude AI Configuration */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Claude AI Integration
                </label>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Connect Ava to Claude AI for intelligent responses. Get your API key from{' '}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className={THEME_COLORS[appSettings.themeColor].primaryText}>
                    console.anthropic.com
                  </a>
                </p>
                <div className={`p-4 border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      claudeConfigured
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {claudeConfigured ? '✓ Connected' : 'Not configured'}
                    </span>
                  </div>

                  {/* API Key Input */}
                  <div className="space-y-2">
                    <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Anthropic API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={claudeApiKey}
                        onChange={(e) => setClaudeApiKey(e.target.value)}
                        placeholder="sk-ant-api..."
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-gray-100 placeholder-gray-400 focus:ring-' + appSettings.themeColor + '-500'
                            : 'border-gray-300 focus:ring-' + appSettings.themeColor + '-500 focus:border-transparent'
                        }`}
                      />
                      <button
                        onClick={async () => {
                          if (claudeApiKey) {
                            setClaudeConfiguring(true);
                            try {
                              await collaborationAPI.configureClaudeAPI(claudeApiKey);
                              setClaudeConfigured(true);
                              setClaudeApiKey(''); // Clear for security
                            } catch (error) {
                              console.error('Failed to configure Claude:', error);
                              alert('Failed to configure Claude API. Please check your API key.');
                            }
                            setClaudeConfiguring(false);
                          }
                        }}
                        disabled={!claudeApiKey || claudeConfiguring}
                        className={`px-3 py-2 ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50`}
                      >
                        {claudeConfiguring ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          'Connect'
                        )}
                      </button>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Your API key is sent to the server but not stored permanently. You'll need to reconfigure after server restart.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setAppSettings(DEFAULT_APP_SETTINGS);
                  saveAppSettings(DEFAULT_APP_SETTINGS);
                  setTempLogoUrl(DEFAULT_APP_SETTINGS.logoUrl);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <RotateCcw size={14} />
                Reset All
              </button>
              <button
                onClick={() => setShowAdminSettings(false)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCP Plugins Modal */}
      {showMCPPlugins && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowMCPPlugins(false)}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:mx-4 overflow-hidden max-h-[90vh] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Plug size={20} className={THEME_COLORS[appSettings.themeColor].primaryText} />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>MCP Plugins</h2>
              </div>
              <button
                onClick={() => setShowMCPPlugins(false)}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Plugin List */}
              {(appSettings.mcpPlugins || []).length > 0 ? (
                <div className="space-y-3 mb-6">
                  {(appSettings.mcpPlugins || []).map((plugin) => {
                    const IconComponent = getPluginIcon(plugin.icon);
                    return (
                      <div
                        key={plugin.id}
                        className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-white'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg flex-shrink-0 ${plugin.enabled ? (darkMode ? THEME_COLORS[appSettings.themeColor].primaryDarkBg : THEME_COLORS[appSettings.themeColor].primaryLight) : (darkMode ? 'bg-gray-600' : 'bg-gray-100')}`}>
                              <IconComponent size={20} className={plugin.enabled ? (darkMode ? THEME_COLORS[appSettings.themeColor].primaryDarkText : THEME_COLORS[appSettings.themeColor].primaryText) : (darkMode ? 'text-gray-400' : 'text-gray-500')} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{plugin.name}</h3>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  plugin.status === 'connected'
                                    ? 'bg-green-100 text-green-700'
                                    : plugin.status === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {plugin.status === 'connected' ? '● Connected' : plugin.status === 'error' ? '● Error' : '○ Disconnected'}
                                </span>
                              </div>
                              {plugin.description && (
                                <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{plugin.description}</p>
                              )}
                              <p className={`text-xs mt-1 font-mono ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {plugin.command} {(plugin.args || []).join(' ')}
                              </p>
                            </div>
                          </div>
                          {/* Enable/Disable Toggle */}
                          <button
                            onClick={() => toggleMCPPlugin(plugin.id)}
                            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                              plugin.enabled
                                ? THEME_COLORS[appSettings.themeColor].primary
                                : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                            }`}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${plugin.enabled ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                        {/* Action Buttons */}
                        <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                          <button
                            onClick={() => {
                              setEditingPlugin(plugin);
                              setPluginName(plugin.name);
                              setPluginDescription(plugin.description || '');
                              setPluginType(plugin.type || 'stdio');
                              setPluginCommand(plugin.command);
                              setPluginArgs((plugin.args || []).join('\n'));
                              setPluginEnv(Object.entries(plugin.env || {}).map(([k, v]) => `${k}=${v}`).join('\n'));
                              setShowAddPluginModal(true);
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            <Pencil size={14} className="inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => testMCPPlugin(plugin.id)}
                            disabled={testingPluginId === plugin.id}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'}`}
                          >
                            {testingPluginId === plugin.id ? (
                              <>
                                <Loader2 size={14} className="inline mr-1 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Zap size={14} className="inline mr-1" />
                                Test
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove "${plugin.name}"?`)) {
                                removeMCPPlugin(plugin.id);
                              }
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors text-red-500 ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                          >
                            <Trash2 size={14} className="inline mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Plug size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No plugins configured</p>
                  <p className="text-sm mt-1">Add MCP plugins to extend Ava's capabilities</p>
                </div>
              )}

              {/* Add Plugin Button */}
              <button
                onClick={() => {
                  resetPluginForm();
                  setShowAddPluginModal(true);
                }}
                className={`w-full p-3 border-2 border-dashed rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                    : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                }`}
              >
                <Plus size={20} />
                <span className="font-medium">Add Plugin</span>
              </button>

              {/* Quick Templates */}
              <div className="mt-6">
                <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Add Templates</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MCP_PLUGIN_TEMPLATES.map((template) => {
                    const IconComponent = getPluginIcon(template.icon);
                    const isAlreadyAdded = (appSettings.mcpPlugins || []).some(p => p.name === template.name);
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (!isAlreadyAdded) {
                            setPluginName(template.name);
                            setPluginDescription(template.description);
                            setPluginType(template.type);
                            setPluginCommand(template.command);
                            setPluginArgs(template.args.join('\n'));
                            setPluginEnv('');
                            setEditingPlugin(null);
                            setShowAddPluginModal(true);
                          }
                        }}
                        disabled={isAlreadyAdded}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          isAlreadyAdded
                            ? darkMode ? 'border-gray-700 bg-gray-700/30 opacity-50 cursor-not-allowed' : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : darkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent size={18} className={darkMode ? 'text-gray-400 mb-1' : 'text-gray-500 mb-1'} />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{template.name}</p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {isAlreadyAdded ? 'Already added' : template.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Plugins extend Ava's capabilities with external tools and services
              </p>
              <button
                onClick={() => setShowMCPPlugins(false)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Plugin Modal */}
      {showAddPluginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[60]" onClick={() => { setShowAddPluginModal(false); setEditingPlugin(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg sm:mx-4 overflow-hidden max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {editingPlugin ? 'Edit Plugin' : 'Add MCP Plugin'}
              </h2>
              <button
                onClick={() => {
                  setShowAddPluginModal(false);
                  resetPluginForm();
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {pluginFormError && (
                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700'}`}>
                  <AlertCircle size={16} />
                  {pluginFormError}
                </div>
              )}

              {/* Plugin Name */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Plugin Name *
                </label>
                <input
                  type="text"
                  value={pluginName}
                  onChange={(e) => setPluginName(e.target.value)}
                  placeholder="e.g., Filesystem Access"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <input
                  type="text"
                  value={pluginDescription}
                  onChange={(e) => setPluginDescription(e.target.value)}
                  placeholder="Brief description of what this plugin does"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                />
              </div>

              {/* Server Type */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Server Type
                </label>
                <select
                  value={pluginType}
                  onChange={(e) => setPluginType(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                >
                  <option value="stdio">STDIO Server</option>
                  <option value="sse">SSE Server</option>
                  <option value="http">HTTP Server</option>
                </select>
              </div>

              {/* Command */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Command *
                </label>
                <input
                  type="text"
                  value={pluginCommand}
                  onChange={(e) => setPluginCommand(e.target.value)}
                  placeholder="e.g., npx, node, python"
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                />
              </div>

              {/* Arguments */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Arguments (one per line)
                </label>
                <textarea
                  value={pluginArgs}
                  onChange={(e) => setPluginArgs(e.target.value)}
                  placeholder={"-y\n@modelcontextprotocol/server-name\n/path/to/config"}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                />
              </div>

              {/* Environment Variables */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Environment Variables (KEY=value, one per line)
                </label>
                <textarea
                  value={pluginEnv}
                  onChange={(e) => setPluginEnv(e.target.value)}
                  placeholder={"API_KEY=your-api-key\nDEBUG=true"}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                  } focus:ring-${appSettings.themeColor}-500`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowAddPluginModal(false);
                  resetPluginForm();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Validate
                  if (!pluginName.trim()) {
                    setPluginFormError('Please enter a plugin name');
                    return;
                  }
                  if (!pluginCommand.trim()) {
                    setPluginFormError('Please enter a command');
                    return;
                  }

                  const pluginData = {
                    name: pluginName.trim(),
                    description: pluginDescription.trim(),
                    type: pluginType,
                    command: pluginCommand.trim(),
                    args: parseArgsString(pluginArgs),
                    env: parseEnvString(pluginEnv)
                  };

                  if (editingPlugin) {
                    updateMCPPlugin(editingPlugin.id, pluginData);
                  } else {
                    addMCPPlugin(pluginData);
                  }

                  setShowAddPluginModal(false);
                  resetPluginForm();
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover}`}
              >
                {editingPlugin ? 'Save Changes' : 'Add Plugin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {showQuickActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50" onClick={() => { setShowQuickActionModal(false); setEditingActionIndex(null); }}>
          <div className={`rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md sm:mx-4 overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {editingActionIndex !== null ? 'Edit Quick Action' : 'Create Quick Action'}
              </h2>
              <button
                onClick={() => {
                  setShowQuickActionModal(false);
                  setNewActionName('');
                  setNewActionPrompt('');
                  setEditingActionIndex(null);
                }}
                className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Action Name
                </label>
                <input
                  type="text"
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  placeholder="e.g., Check Grammar"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-' + appSettings.themeColor + '-500'
                      : 'border-gray-300 focus:ring-' + appSettings.themeColor + '-500 focus:border-transparent'
                  }`}
                  autoFocus
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Prompt to Send
                </label>
                <textarea
                  value={newActionPrompt}
                  onChange={(e) => setNewActionPrompt(e.target.value)}
                  placeholder="e.g., Please check and fix any grammar issues in my message"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 resize-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-' + appSettings.themeColor + '-500'
                      : 'border-gray-300 focus:ring-' + appSettings.themeColor + '-500 focus:border-transparent'
                  }`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This message will be sent to Ava when you click the action
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div>
                {editingActionIndex !== null && (
                  <button
                    onClick={() => {
                      const newActions = customQuickActions.filter((_, i) => i !== editingActionIndex);
                      setCustomQuickActions(newActions);
                      setShowQuickActionModal(false);
                      setNewActionName('');
                      setNewActionPrompt('');
                      setEditingActionIndex(null);
                    }}
                    className={`px-4 py-2 text-sm font-medium text-red-500 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'}`}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowQuickActionModal(false);
                    setNewActionName('');
                    setNewActionPrompt('');
                    setEditingActionIndex(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newActionName.trim() && newActionPrompt.trim()) {
                      if (editingActionIndex !== null) {
                        // Update existing action
                        const newActions = [...customQuickActions];
                        newActions[editingActionIndex] = { name: newActionName.trim(), prompt: newActionPrompt.trim() };
                        setCustomQuickActions(newActions);
                      } else {
                        // Add new action
                        setCustomQuickActions([...customQuickActions, { name: newActionName.trim(), prompt: newActionPrompt.trim() }]);
                      }
                      setShowQuickActionModal(false);
                      setNewActionName('');
                      setNewActionPrompt('');
                      setEditingActionIndex(null);
                    }
                  }}
                  disabled={!newActionName.trim() || !newActionPrompt.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${THEME_COLORS[appSettings.themeColor].primary} ${THEME_COLORS[appSettings.themeColor].primaryHover} disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {editingActionIndex !== null ? 'Save Changes' : 'Create Action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      <Onboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        themeColor={appSettings.themeColor}
        darkMode={darkMode}
        userRole={currentUser?.role}
        userName={currentUser?.name}
      />
    </div>
  );
}
