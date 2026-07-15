import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Package,
  UserCheck,
  UserPlus,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2, path: '/dashboard', active: location.pathname === '/dashboard' },
    { id: 'crm', label: 'CRM', icon: Users, path: '/crm', active: location.pathname === '/crm' },
    { id: 'leads', label: 'Leads', icon: Target, path: '/crm/leads', active: location.pathname.startsWith('/crm/leads') },
    { id: 'clients', label: 'Clients', icon: UserCheck, path: '/clients', active: location.pathname === '/clients' },
    { id: 'projects', label: 'Projects', icon: Building2, path: '/projects', active: location.pathname === '/projects' },
    { id: 'sales', label: 'Sales', icon: TrendingUp, path: '/sales', active: location.pathname === '/sales' },
    
    { id: 'architect', label: 'Architect', icon: Target, path: '/architect', active: location.pathname === '/architect' },
    { id: 'packages', label: 'Packages', icon: Package, path: '/packages', active: location.pathname.startsWith('/packages') },
    { id: 'workflow', label: 'Workflow', icon: Users, path: '/workflow', active: location.pathname === '/workflow' },
    { id: 'admin', label: 'Admin', icon: Settings, path: '/admin', active: location.pathname.startsWith('/admin') }
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ConstructPro</span>
            </div>
            <div className="hidden md:block relative ml-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search enquiries, leads, projects"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-80"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 cursor-pointer hover:text-gray-600" />
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-2 py-1"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">
                  {user?.fullName || user?.username || user?.email || 'Admin'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName || user?.username || user?.email || 'Admin'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user?.email || 'admin@constructpro.com'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/profile');
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/settings');
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out`}>
          <div className="pt-4 lg:pt-0">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center space-x-3 w-full rounded-lg px-3 py-2 text-left transition-colors duration-200 ${
                      item.active 
                        ? 'text-orange-600 bg-orange-50' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.active && <div className="w-1 h-8 bg-orange-600 rounded-r-full absolute left-0"></div>}
                    <Icon className={`h-5 w-5 ${item.active ? 'ml-2' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
