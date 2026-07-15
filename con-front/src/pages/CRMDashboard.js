import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardAPI, enquiriesAPI, leadsAPI } from '../services/api';

const CRMDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: { active: 0, completed: 0, total: 0, totalValue: 0 },
    enquiries: { new: 0, converted: 0, total: 0 },
    leads: { qualified: 0, active: 0, converted: 0, total: 0 },
    clients: { total: 0 }
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [activeLeads, setActiveLeads] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await dashboardAPI.getStats();
      console.log('[CRM Dashboard] Stats response:', statsResponse);
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch enquiries
      const enquiriesResponse = await enquiriesAPI.getAll();
      console.log('[CRM Dashboard] Enquiries response:', enquiriesResponse);
      if (enquiriesResponse.success && enquiriesResponse.data) {
        // Get recent 5 enquiries
        const recent = enquiriesResponse.data.slice(0, 5).map(enq => ({
          id: enq.enquiry_number || `ENQ-${enq.enquiry_id}`,
          enquiry_id: enq.enquiry_id,
          date: new Date(enq.created_at).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          contact: {
            name: `${enq.contact_person_name || ''} ${enq.contact_surname || ''}`.trim(),
            phone: enq.primary_phone || 'N/A',
            email: enq.email || 'N/A',
            location: `${enq.city || 'N/A'}, ${enq.state || 'N/A'}`
          },
          project: {
            type: enq.project_type || 'N/A',
            budget: enq.budget_range || 'N/A',
            source: enq.utm_source || 'Direct',
            area: enq.approximate_area ? `${enq.approximate_area} ${enq.area_unit || 'sqft'}` : 'N/A'
          },
          status: enq.status || 'New',
          packages: enq.packages || []
        }));
        setRecentEnquiries(recent);
      }

      // Fetch leads
      const leadsResponse = await leadsAPI.getAll();
      console.log('[CRM Dashboard] Leads response:', leadsResponse);
      if (leadsResponse.success && leadsResponse.data) {
        // Get recent active leads
        const activeleadsData = leadsResponse.data
          .filter(lead => !lead.converted_to_client)
          .slice(0, 5)
          .map(lead => ({
            id: lead.lead_number || `LED-${lead.lead_id}`,
            lead_id: lead.lead_id,
            date: new Date(lead.created_at).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            }),
            contact: {
              name: lead.primary_contact_name || 'N/A',
              phone: lead.primary_phone || 'N/A',
              email: lead.email || 'N/A',
              company: lead.company_name || ''
            },
            stage: lead.stage || 'Qualified',
            budget: lead.budget_max ? `₹${(lead.budget_max / 10000000).toFixed(2)} Cr` : 'N/A',
            packages: lead.packages || []
          }));
        setActiveLeads(activeleadsData);
      }

      toast.success('Dashboard data loaded successfully');
    } catch (error) {
      console.error('[CRM Dashboard] Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const formatGrowth = (growth) => {
    if (!growth) return '0%';
    return `${growth}%`;
  };

  const tabs = [
    { id: 'sales', label: 'Sales Dashboard', active: true },
    { id: 'overview', label: 'Overview', active: false },
    { id: 'enquiries', label: 'Enquiries', active: false },
    { id: 'leads', label: 'Leads', active: false },
    { id: 'projects', label: 'Projects', active: false }
  ];

  const StatCard = ({ title, value, growth, color, icon: Icon, isLoading }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900">
                {title.includes('Revenue') || title.includes('Value') || title.includes('Deal') 
                  ? `₹${formatCurrency(value)}` 
                  : value}
              </p>
              {growth && (
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{formatGrowth(growth)}</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ConstructPro</span>
            </div>
            <div className="relative ml-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search enquiries, projects"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-80"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-6 w-6 text-gray-400 cursor-pointer hover:text-gray-600" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {user?.fullName || user?.username || user?.email || 'User'}
              </span>
              <button onClick={logout} className="hover:bg-gray-100 rounded p-1">
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              <a href="#" className="flex items-center space-x-3 text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span className="font-medium">Dashboard</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Users className="h-5 w-5" />
                <span>CRM</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <TrendingUp className="h-5 w-5" />
                <span>Sales</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Building2 className="h-5 w-5" />
                <span>Projects</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Target className="h-5 w-5" />
                <span>Architect</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Users className="h-5 w-5" />
                <span>Workflow</span>
              </a>
              <a href="#" className="flex items-center space-x-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Building2 className="h-5 w-5" />
                <span>Admin</span>
              </a>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
              <p className="text-gray-600">Construction Project Management System</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search enquiries, leads..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                />
              </div>
              <button 
                onClick={() => window.location.href = '/enquiries'}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
              >
                <Plus className="h-4 w-4" />
                <span>New Enquiry</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Enquiries"
              value={stats.enquiries.total}
              growth={null}
              color="bg-blue-500"
              icon={Users}
              isLoading={false}
            />
            <StatCard
              title="Active Leads"
              value={stats.leads.total}
              growth={null}
              color="bg-green-500"
              icon={Target}
              isLoading={false}
            />
            <StatCard
              title="Active Projects"
              value={stats.projects.active}
              growth={null}
              color="bg-orange-500"
              icon={Building2}
              isLoading={false}
            />
            <StatCard
              title="Total Clients"
              value={stats.clients.total}
              growth={null}
              color="bg-purple-500"
              icon={Users}
              isLoading={false}
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Enquiries */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Recent Enquiries</h3>
                  <button 
                    onClick={() => window.location.href = '/enquiries'}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Enquiry</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentEnquiries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No enquiries found</p>
                    <button 
                      onClick={() => window.location.href = '/enquiries'}
                      className="mt-4 text-orange-500 hover:text-orange-600 text-sm font-medium"
                    >
                      Create your first enquiry
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Enquiry</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Contact</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Project</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {recentEnquiries.map((enquiry) => (
                          <tr key={enquiry.id} className="hover:bg-gray-50">
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900">{enquiry.id}</div>
                                <div className="text-sm text-gray-500">{enquiry.date}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{enquiry.contact.name}</div>
                                <div className="text-xs text-gray-500">{enquiry.contact.phone}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{enquiry.project.type}</div>
                                <div className="text-xs text-gray-500">{enquiry.project.area}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {enquiry.status}
                                </span>
                                <button 
                                  onClick={() => window.location.href = `/enquiries/${enquiry.enquiry_id}`}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Active Leads */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Active Leads</h3>
                  <button 
                    onClick={() => window.location.href = '/leads'}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {activeLeads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No active leads found</p>
                    <button 
                      onClick={() => window.location.href = '/leads'}
                      className="mt-4 text-blue-500 hover:text-blue-600 text-sm font-medium"
                    >
                      View all leads
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Lead</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Contact</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Stage</th>
                          <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activeLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900">{lead.id}</div>
                                <div className="text-sm text-gray-500">{lead.date}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{lead.contact.name}</div>
                                <div className="text-xs text-gray-500">{lead.contact.phone}</div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                {lead.stage}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex space-x-1">
                                <button 
                                  onClick={() => window.location.href = `/leads/${lead.lead_id}`}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-gray-600">
                                  <Edit className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CRMDashboard;
