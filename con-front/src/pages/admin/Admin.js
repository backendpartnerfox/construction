import React, { useState } from 'react';
import { 
  Settings,
  Users,
  Shield,
  Database,
  Activity,
  FileText,
  Cog,
  UserPlus,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Wifi,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('users');

  // Mock data
  const [systemStats] = useState({
    totalUsers: 25,
    activeProjects: 8,
    totalStorage: '250 GB',
    storageUsed: '180 GB',
    systemUptime: '99.9%',
    lastBackup: '2025-01-16 02:00 AM'
  });

  const [users] = useState([
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@company.com',
      role: 'Project Manager',
      department: 'Projects',
      status: 'Active',
      lastLogin: '2025-01-16 09:30 AM',
      joinDate: '2023-01-15',
      permissions: ['view_projects', 'edit_projects', 'manage_team']
    },
    {
      id: 2,
      name: 'Priya Singh',
      email: 'priya.singh@company.com',
      role: 'Site Engineer',
      department: 'Engineering',
      status: 'Active',
      lastLogin: '2025-01-16 08:45 AM',
      joinDate: '2023-02-10',
      permissions: ['view_projects', 'edit_measurements']
    },
    {
      id: 3,
      name: 'Anand Sharma',
      email: 'anand.sharma@company.com',
      role: 'Senior Architect',
      department: 'Design',
      status: 'Active',
      lastLogin: '2025-01-15 06:20 PM',
      joinDate: '2023-03-05',
      permissions: ['view_projects', 'edit_drawings', 'approve_designs']
    },
    {
      id: 4,
      name: 'Deepak Patel',
      email: 'deepak.patel@company.com',
      role: 'Sales Executive',
      department: 'Sales',
      status: 'Inactive',
      lastLogin: '2025-01-10 03:15 PM',
      joinDate: '2023-06-20',
      permissions: ['view_leads', 'edit_quotations']
    }
  ]);

  const [systemLogs] = useState([
    {
      id: 1,
      timestamp: '2025-01-16 10:30:15',
      level: 'INFO',
      category: 'User Login',
      message: 'User rajesh.kumar@company.com logged in successfully',
      ipAddress: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0'
    },
    {
      id: 2,
      timestamp: '2025-01-16 10:25:33',
      level: 'WARNING',
      category: 'Data Access',
      message: 'Failed login attempt for admin@company.com',
      ipAddress: '192.168.1.200',
      userAgent: 'Firefox 121.0.0.0'
    },
    {
      id: 3,
      timestamp: '2025-01-16 09:45:12',
      level: 'INFO',
      category: 'System',
      message: 'Database backup completed successfully',
      ipAddress: 'System',
      userAgent: 'System Process'
    },
    {
      id: 4,
      timestamp: '2025-01-16 08:30:00',
      level: 'ERROR',
      category: 'Email Service',
      message: 'Email notification failed to send to client@example.com',
      ipAddress: 'System',
      userAgent: 'Email Service'
    }
  ]);

  const [permissions] = useState([
    { id: 'view_projects', name: 'View Projects', description: 'Can view project details' },
    { id: 'edit_projects', name: 'Edit Projects', description: 'Can modify project information' },
    { id: 'manage_team', name: 'Manage Team', description: 'Can assign team members to projects' },
    { id: 'view_leads', name: 'View Leads', description: 'Can view lead information' },
    { id: 'edit_quotations', name: 'Edit Quotations', description: 'Can create and modify quotations' },
    { id: 'edit_measurements', name: 'Edit Measurements', description: 'Can record site measurements' },
    { id: 'edit_drawings', name: 'Edit Drawings', description: 'Can upload and modify drawings' },
    { id: 'approve_designs', name: 'Approve Designs', description: 'Can approve architectural designs' },
    { id: 'system_admin', name: 'System Admin', description: 'Full system administration access' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600">Manage users, permissions, and system settings</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Download className="h-4 w-4" />
            <span>Export Data</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
        <StatCard
          title="Total Users"
          value={systemStats.totalUsers}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Projects"
          value={systemStats.activeProjects}
          icon={Activity}
          color="bg-green-500"
        />
        <StatCard
          title="Storage Used"
          value={systemStats.storageUsed}
          subtitle={`of ${systemStats.totalStorage}`}
          icon={HardDrive}
          color="bg-purple-500"
        />
        <StatCard
          title="System Uptime"
          value={systemStats.systemUptime}
          icon={Wifi}
          color="bg-green-500"
        />
        <StatCard
          title="Last Backup"
          value="2 hours ago"
          subtitle={systemStats.lastBackup}
          icon={Database}
          color="bg-blue-500"
        />
        <StatCard
          title="System Status"
          value="Healthy"
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'permissions', label: 'Permissions', icon: Shield },
            { id: 'system', label: 'System Settings', icon: Settings },
            { id: 'logs', label: 'System Logs', icon: FileText },
            { id: 'backup', label: 'Backup & Security', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600">Manage user accounts and access</p>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
              <UserPlus className="h-4 w-4" />
              <span>Add New User</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{user.role}</div>
                          <div className="text-sm text-gray-500">{user.department}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{user.lastLogin}</div>
                        <div className="text-sm text-gray-500">Joined: {user.joinDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{user.permissions.length} permissions</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button className="text-orange-600 hover:text-orange-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Permission Management</h2>
            <p className="text-gray-600">Configure system permissions and access controls</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {permissions.map((permission) => (
              <div key={permission.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">{permission.name}</h3>
                  <Shield className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600 mb-4">{permission.description}</p>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-orange-600 hover:text-orange-900">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            <p className="text-gray-600">Configure system-wide settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">System Name</label>
                    <p className="text-sm text-gray-500">ConstructPro Management System</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Session Timeout</label>
                    <p className="text-sm text-gray-500">8 hours</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Default Language</label>
                    <p className="text-sm text-gray-500">English</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Password Policy</label>
                    <p className="text-sm text-gray-500">Minimum 8 characters, special chars required</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Two-Factor Authentication</label>
                    <p className="text-sm text-gray-500">Enabled for admin users</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-900">Login Attempts</label>
                    <p className="text-sm text-gray-500">Maximum 5 attempts before lockout</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">System Logs</h2>
              <p className="text-gray-600">Monitor system activities and events</p>
            </div>
            <div className="flex space-x-3">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
                <Download className="h-4 w-4" />
                <span>Export Logs</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.timestamp}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getLogLevelColor(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.message}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{log.ipAddress}</div>
                        <div className="text-sm text-gray-500">{log.userAgent}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Security Tab */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Backup & Security</h2>
            <p className="text-gray-600">Manage data backups and security settings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Last Backup</div>
                    <div className="text-sm text-gray-500">{systemStats.lastBackup}</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Backup Schedule</div>
                    <div className="text-sm text-gray-500">Daily at 2:00 AM</div>
                  </div>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition duration-200">
                    Create Backup Now
                  </button>
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200">
                    Restore from Backup
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">SSL Certificate</div>
                    <div className="text-sm text-gray-500">Valid until Dec 2025</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Firewall Status</div>
                    <div className="text-sm text-gray-500">Active and configured</div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Security Updates</div>
                    <div className="text-sm text-gray-500">2 updates available</div>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;