import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Database, Users, Package, Building, Wrench, DollarSign,
  FileText, Settings, Truck, ClipboardList, Calendar,
  BarChart3, Layout, Boxes, ListChecks, GitBranch, Layers,
  Target, CheckCircle2, PackageCheck, ChevronLeft, ChevronRight,
  Shield, Key, BookOpen
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { hasPermission } = useAuth();
  
  // Get the current active module from the URL
  const getActiveModule = () => {
    const path = location.pathname.split('/admin/')[1];
    return path || 'items';
  };

  // Each entry carries the permission it requires. Sections are hidden if the
  // user has no visible children after filtering. Admin bypasses (hasPermission
  // returns true for admin).
  const allModules = [
    {
      id: 'master-data',
      label: 'Master Data',
      icon: Database,
      children: [
        { id: 'items',                label: 'Items',                icon: Package,    path: '/admin/items',                perm: 'items.view' },
        { id: 'item-choices',         label: 'Item Choices',         icon: ListChecks, path: '/admin/item-choices',         perm: 'items.view' },
        { id: 'elements',             label: 'Elements',             icon: Building,   path: '/admin/elements',             perm: 'items.view' },
        { id: 'element-item-mapping', label: 'Element-Item Mapping', icon: GitBranch,  path: '/admin/element-item-mapping', perm: 'items.view' },
      ]
    },
    {
      id: 'vendors',
      label: 'Vendor Management',
      icon: Truck,
      children: [
        { id: 'vendor-types',   label: 'Vendor Types',   icon: ClipboardList, path: '/admin/vendor-types',   perm: 'vendors.view' },
        { id: 'vendors',        label: 'Vendors',        icon: Truck,         path: '/admin/vendors',        perm: 'vendors.view' },
        { id: 'vendor-pricing', label: 'Vendor Pricing', icon: DollarSign,    path: '/admin/vendor-pricing', perm: 'vendors.view' },
        { id: 'tmt-standards',  label: 'TMT Standards',  icon: Wrench,        path: '/admin/tmt-standards',  perm: 'items.view' },
      ]
    },
    {
      id: 'packages',
      label: 'Package Management',
      icon: PackageCheck,
      children: [
        { id: 'packages',          label: 'Packages',          icon: Package,  path: '/admin/packages',          perm: 'packages.view' },
        { id: 'rulebook',          label: 'Rulebook',          icon: BookOpen, path: '/admin/rulebook',          perm: 'rulebook.view' },
        { id: 'quotation-config',  label: 'Quotation Config',  icon: Settings, path: '/admin/quotation-config',  perm: 'rulebook.view' },
      ]
    },
    {
      id: 'dimensions',
      label: 'Dimensions & Standards',
      icon: Layout,
      children: [
        { id: 'door-dimensions',   label: 'Door Dimensions',   icon: Layout, path: '/admin/door-dimensions',   perm: 'items.view' },
        { id: 'window-dimensions', label: 'Window Dimensions', icon: Layout, path: '/admin/window-dimensions', perm: 'items.view' },
      ]
    },
    {
      id: 'components',
      label: 'Component Management',
      icon: Boxes,
      children: [
        { id: 'components', label: 'Components', icon: Boxes, path: '/admin/components', perm: 'items.view' },
      ]
    },
    {
      id: 'hr',
      label: 'Users & Roles',
      icon: Users,
      children: [
        { id: 'users',        label: 'Users',                icon: Users,  path: '/admin/users',        perm: 'users.view' },
        { id: 'roles',        label: 'Roles',                icon: Shield, path: '/admin/roles',        perm: 'roles.view' },
        { id: 'permissions',  label: 'Permissions',          icon: Key,    path: '/admin/permissions',  perm: 'roles.view' },
        { id: 'role-matrix',  label: 'Role × Permission Matrix', icon: Shield, path: '/admin/role-matrix', perm: 'roles.view' },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: Settings,
      children: [
        { id: 'system-settings', label: 'System Settings', icon: Settings, path: '/admin/system-settings', perm: 'users.view' },
      ]
    }
  ];

  // Filter: keep only children the user can access; drop groups that end up empty.
  const modules = allModules
    .map(g => ({ ...g, children: g.children.filter(c => hasPermission(c.perm)) }))
    .filter(g => g.children.length > 0);

  const activeModule = getActiveModule();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <Link 
                  to="/dashboard" 
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center mt-1"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-2">
          {modules.map((module) => (
            <div key={module.id} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 flex items-center space-x-2">
                  <module.icon className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {module.label}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {module.children.map((child) => {
                  const Icon = child.icon;
                  const isActive = activeModule === child.id;
                  return (
                    <Link
                      key={child.id}
                      to={child.path}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      title={sidebarCollapsed ? child.label : ''}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium">{child.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
