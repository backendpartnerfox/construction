import React, { useState, useEffect } from 'react';
import { 
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Calendar,
  FileText,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sales = () => {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [loading, setLoading] = useState(false);

  // Mock data
  const [salesData] = useState({
    totalRevenue: '₹24.5 Cr',
    revenueGrowth: '+23.5%',
    activePipeline: '₹45.0 Cr',
    pipelineGrowth: '+12.8%',
    conversionRate: '18.2%',
    conversionGrowth: '+5.3%',
    avgDealSize: '₹1.55 Cr',
    dealSizeGrowth: '+8.1%'
  });

  const [pipelineData] = useState([
    {
      id: 'LED-001',
      name: 'Luxury Villa - Rajesh Kumar',
      value: '₹2.5 Cr',
      stage: 'Quotation Sent',
      probability: 75,
      expectedClose: '2025-02-15',
      lastActivity: '2025-01-15',
      nextAction: 'Follow up call'
    },
    {
      id: 'LED-002',
      name: 'Shopping Complex - Priya Sharma',
      value: '₹5.0 Cr',
      stage: 'Site Visit Planned',
      probability: 60,
      expectedClose: '2025-03-01',
      lastActivity: '2025-01-14',
      nextAction: 'Site visit'
    },
    {
      id: 'LED-003',
      name: 'Apartment Complex - Tech Solutions',
      value: '₹8.2 Cr',
      stage: 'Negotiation',
      probability: 85,
      expectedClose: '2025-01-30',
      lastActivity: '2025-01-16',
      nextAction: 'Contract review'
    }
  ]);

  const [quotations] = useState([
    {
      id: 'QUO-001',
      leadId: 'LED-001',
      client: 'Rajesh Kumar',
      project: 'Luxury Villa Construction',
      amount: '₹2.5 Cr',
      status: 'Sent',
      validUntil: '2025-02-15',
      sentDate: '2025-01-10',
      version: 1
    },
    {
      id: 'QUO-002',
      leadId: 'LED-002',
      client: 'Priya Sharma',
      project: 'Shopping Complex',
      amount: '₹5.0 Cr',
      status: 'Under Review',
      validUntil: '2025-02-20',
      sentDate: '2025-01-12',
      version: 2
    }
  ]);

  const [recentActivity] = useState([
    {
      id: 1,
      type: 'quotation_sent',
      description: 'Quotation QUO-003 sent to Amit Patel',
      date: '2025-01-16 10:30 AM',
      user: 'Sales Team'
    },
    {
      id: 2,
      type: 'lead_updated',
      description: 'LED-001 moved to Negotiation stage',
      date: '2025-01-16 09:15 AM',
      user: 'Rajesh Kumar'
    },
    {
      id: 3,
      type: 'meeting_scheduled',
      description: 'Site visit scheduled for LED-002',
      date: '2025-01-15 02:45 PM',
      user: 'Priya Singh'
    }
  ]);

  const tabs = [
    { id: 'pipeline', label: 'Sales Pipeline', count: pipelineData.length },
    { id: 'quotations', label: 'Quotations', count: quotations.length },
    { id: 'analytics', label: 'Analytics', count: null },
    { id: 'activity', label: 'Recent Activity', count: null }
  ];

  const getStageColor = (stage) => {
    switch (stage.toLowerCase()) {
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'quotation sent': return 'bg-purple-100 text-purple-800';
      case 'site visit planned': return 'bg-orange-100 text-orange-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuotationStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'under review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const StatCard = ({ title, value, growth, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {growth && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">{growth}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const PipelineTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sales Pipeline</h2>
          <p className="text-gray-600">Track leads through the sales process</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
            <Plus className="h-4 w-4" />
            <span>Add to Pipeline</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search pipeline..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Lead</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Value</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Stage</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Probability</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Expected Close</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Next Action</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pipelineData.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.id}</div>
                      <div className="text-xs text-gray-400">Last activity: {lead.lastActivity}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{lead.value}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStageColor(lead.stage)}`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{width: `${lead.probability}%`}}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{lead.probability}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900 flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{lead.expectedClose}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">{lead.nextAction}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600">
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
  );

  const QuotationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Quotations</h2>
          <p className="text-gray-600">Manage and track quotations</p>
        </div>
        <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200">
          <Plus className="h-4 w-4" />
          <span>Create Quotation</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Quotation</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Project</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Amount</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Valid Until</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotations.map((quotation) => (
                <tr key={quotation.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{quotation.id}</div>
                      <div className="text-sm text-gray-500">v{quotation.version}</div>
                      <div className="text-xs text-gray-400">Sent: {quotation.sentDate}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{quotation.client}</div>
                    <div className="text-sm text-gray-500">{quotation.leadId}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">{quotation.project}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{quotation.amount}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getQuotationStatusColor(quotation.status)}`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900">{quotation.validUntil}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-600">
                        <FileText className="h-4 w-4" />
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
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Sales Analytics</h2>
        <p className="text-gray-600">Monitor sales performance and trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={salesData.totalRevenue}
          growth={salesData.revenueGrowth}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Pipeline Value"
          value={salesData.activePipeline}
          growth={salesData.pipelineGrowth}
          icon={Target}
          color="bg-blue-500"
        />
        <StatCard
          title="Conversion Rate"
          value={salesData.conversionRate}
          growth={salesData.conversionGrowth}
          icon={TrendingUp}
          color="bg-orange-500"
        />
        <StatCard
          title="Avg Deal Size"
          value={salesData.avgDealSize}
          growth={salesData.dealSizeGrowth}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pipeline by Stage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Qualified</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{width: '25%'}}></div>
                </div>
                <span className="text-sm text-gray-500">₹3.2 Cr</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Quotation Sent</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div className="bg-purple-500 h-3 rounded-full" style={{width: '35%'}}></div>
                </div>
                <span className="text-sm text-gray-500">₹7.5 Cr</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Site Visit Planned</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-sm text-gray-500">₹5.0 Cr</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Negotiation</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-500 h-3 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-sm text-gray-500">₹8.2 Cr</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">This Month</span>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">₹4.2 Cr</div>
                <div className="text-sm text-green-600">+12.5%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Month</span>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">₹3.7 Cr</div>
                <div className="text-sm text-gray-500">-2.1%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Deals Closed</span>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">3</div>
                <div className="text-sm text-green-600">+50%</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Win Rate</span>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">75%</div>
                <div className="text-sm text-green-600">+5%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        <p className="text-gray-600">Track recent sales activities and updates</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-4 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.date}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">by {activity.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'pipeline':
        return <PipelineTab />;
      case 'quotations':
        return <QuotationsTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'activity':
        return <ActivityTab />;
      default:
        return <PipelineTab />;
    }
  };

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderActiveTab()}
    </div>
  );
};

export default Sales;