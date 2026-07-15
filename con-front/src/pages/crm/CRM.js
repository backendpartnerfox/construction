import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Building2,
  Target,
  ArrowRight
} from 'lucide-react';
import { enquiriesAPI, leadsAPI, dashboardAPI } from '../../services/api';
import EnquiryList from './components/EnquiryList';
import NewEnquiryForm from './forms/NewEnquiryForm';

const CRM = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewEnquiryFormOpen, setIsNewEnquiryFormOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEnquiries: 0,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0
  });

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Try to load real stats from API
      const statsResponse = await dashboardAPI.getStats();
      setStats(statsResponse);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock data for demo
      setStats({
        totalEnquiries: 156,
        totalLeads: 89,
        convertedLeads: 34,
        conversionRate: 38.2
      });
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">+{change}% from last month</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const handleNewEnquirySubmit = () => {
    // Refresh stats after new enquiry is created
    loadStats();
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Management</h1>
          <p className="text-gray-600">Manage enquiries, leads, and customer relationships</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsNewEnquiryFormOpen(true)}
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
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'enquiries', label: 'Enquiries' },
            { id: 'pipeline', label: 'Pipeline' }
          ].map((tab) => (
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Enquiries"
              value={stats.totalEnquiries}
              change="12.5"
              icon={Mail}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Leads"
              value={stats.totalLeads}
              change="8.3"
              icon={Users}
              color="bg-green-500"
            />
            <StatCard
              title="Converted Leads"
              value={stats.convertedLeads}
              change="15.2"
              icon={Target}
              color="bg-orange-500"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.conversionRate}%`}
              change="4.7"
              icon={TrendingUp}
              color="bg-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveTab('enquiries')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Recent Enquiries</h3>
                    <p className="text-sm text-gray-500">View all incoming enquiries</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/crm/leads')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Active Leads</h3>
                    <p className="text-sm text-gray-500">Manage qualified leads</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
            
            <button 
              onClick={() => setActiveTab('pipeline')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Sales Pipeline</h3>
                    <p className="text-sm text-gray-500">Track deal progress</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Enquiries Tab - Use the EnquiryList component */}
      {activeTab === 'enquiries' && <EnquiryList />}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sales Pipeline</h3>
            <p className="text-gray-500">Pipeline visualization coming soon...</p>
          </div>
        </div>
      )}

      {/* New Enquiry Form Modal */}
      <NewEnquiryForm
        isOpen={isNewEnquiryFormOpen}
        onClose={() => setIsNewEnquiryFormOpen(false)}
        onSubmit={handleNewEnquirySubmit}
      />
    </div>
  );
};

export default CRM;
