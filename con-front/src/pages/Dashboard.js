import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Mock data for the dashboard
  const [stats] = useState({
    totalRevenue: '24,50,00,000',
    revenueGrowth: '23.5',
    conversions: '1',
    conversionGrowth: '18.2',
    pipelineValue: '45,00,00,000',
    pipelineGrowth: '12.8',
    avgDealSize: '1,55,00,000',
    dealGrowth: '5.3'
  });

  const [recentEnquiries] = useState([
    {
      id: 'ENQ-21',
      date: '23 Jun 2025',
      contact: {
        name: 'Balakrishna Nandamuri',
        phone: '9090909090',
        email: 'balayya@gmail.com',
        location: 'Hyd, Telangana'
      },
      project: {
        type: 'Residential',
        budget: '2 cr',
        source: 'Direct',
        area: '4500.00 sqft'
      },
      status: 'New'
    }
  ]);

  const [activeLeads] = useState([
    {
      id: 'LHD 22',
      date: '23 Jun 2025',
      contact: {
        name: 'Test contact',
        phone: '9089090900'
      },
      stage: 'Qualified'
    },
    {
      id: 'test',
      date: '10 Jun 2025',
      contact: {
        name: 'test',
        phone: '9089090900'
      },
      stage: 'Qualified'
    }
  ]);

  const StatCard = ({ title, value, growth, color, icon: Icon, isPositive = true }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">₹{value}</p>
          <div className="flex items-center mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {growth}%
            </span>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Construction Project Management System</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/crm')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
          >
            <Users className="h-4 w-4" />
            <span>CRM</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Plus className="h-4 w-4" />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button className="whitespace-nowrap py-2 px-1 border-b-2 border-orange-500 text-orange-600 font-medium text-sm">
            Sales Dashboard
          </button>
          <button 
            onClick={() => navigate('/crm')}
            className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Overview
          </button>
          <button 
            onClick={() => navigate('/crm')}
            className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Enquiries
          </button>
          <button 
            onClick={() => navigate('/crm')}
            className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Leads
          </button>
          <button 
            onClick={() => navigate('/projects')}
            className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
          >
            Projects
          </button>
        </nav>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          growth={stats.revenueGrowth}
          color="bg-green-500"
          icon={TrendingUp}
          isPositive={true}
        />
        <StatCard
          title="Conversions"
          value={stats.conversions}
          growth={stats.conversionGrowth}
          color="bg-blue-500"
          icon={Target}
          isPositive={true}
        />
        <StatCard
          title="Pipeline Value"
          value={stats.pipelineValue}
          growth={stats.pipelineGrowth}
          color="bg-orange-500"
          icon={Building2}
          isPositive={true}
        />
        <StatCard
          title="Avg Deal Size"
          value={stats.avgDealSize}
          growth={stats.dealGrowth}
          color="bg-purple-500"
          icon={Users}
          isPositive={true}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Enquiries</h3>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition duration-200">
                <Plus className="h-4 w-4" />
                <span>Add Enquiry</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Enquiry Details</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Contact Info</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Project Details</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50">
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-gray-900">{enquiry.id}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {enquiry.date}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-gray-900">{enquiry.contact.name}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{enquiry.contact.phone}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <Mail className="h-3 w-3" />
                            <span>{enquiry.contact.email}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{enquiry.contact.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-gray-900">{enquiry.project.type}</div>
                          <div className="text-sm text-gray-500">Budget: {enquiry.project.budget}</div>
                          <div className="text-sm text-gray-500">Source: {enquiry.project.source}</div>
                          <div className="text-sm text-gray-500">Area: {enquiry.project.area}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {enquiry.status}
                          </span>
                          <div className="flex space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Leads */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Active Leads</h3>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition duration-200">
                <Plus className="h-4 w-4" />
                <span>Add Lead</span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Lead Details</th>
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
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {lead.date}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <div className="font-medium text-gray-900">{lead.contact.name}</div>
                          <div className="text-sm text-gray-500">{lead.contact.phone}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                          {lead.stage}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
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
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/crm')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Manage CRM</h3>
              <p className="text-sm text-gray-500">View and manage all enquiries and leads</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/projects')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">View Projects</h3>
              <p className="text-sm text-gray-500">Monitor ongoing construction projects</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => navigate('/sales')}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Sales Analytics</h3>
              <p className="text-sm text-gray-500">View sales performance and reports</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;