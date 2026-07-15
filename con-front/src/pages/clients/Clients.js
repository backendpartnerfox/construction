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
  Building2,
  Users,
  UserCheck
} from 'lucide-react';
import { clientsAPI } from '../../services/api';
import NewClientForm from './forms/NewClientForm';
import EditClientForm from './forms/EditClientForm';
import DeleteClientModal from './forms/DeleteClientModal';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isNewClientFormOpen, setIsNewClientFormOpen] = useState(false);
  const [isEditClientFormOpen, setIsEditClientFormOpen] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    individualClients: 0,
    companyClients: 0
  });

  useEffect(() => {
    loadClients();
  }, []);

  const calculateStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.is_active).length;
    const individual = clients.filter(c => c.client_type === 'Individual').length;
    const company = clients.filter(c => c.client_type === 'Company').length;

    setStats({
      totalClients: total,
      activeClients: active,
      individualClients: individual,
      companyClients: company
    });
  };

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientsAPI.getAll();
      if (response && Array.isArray(response)) {
        setClients(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        setClients(response.data);
      } else {
        console.log('Using fallback client data');
        setClients([]);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to client details page
  const handleViewClient = (client) => {
    navigate(`/clients/${client.client_id}`);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsEditClientFormOpen(true);
  };

  const handleDeleteClient = (client) => {
    setSelectedClient(client);
    setIsDeleteClientModalOpen(true);
  };

  const handleClientCreated = () => {
    loadClients();
    setIsNewClientFormOpen(false);
  };

  const handleClientUpdated = () => {
    loadClients();
    setIsEditClientFormOpen(false);
    setSelectedClient(null);
  };

  const handleClientDeleted = () => {
    loadClients();
    setIsDeleteClientModalOpen(false);
    setSelectedClient(null);
  };

  const getClientTypeColor = (type) => {
    const colors = {
      'Individual': 'bg-blue-100 text-blue-800',
      'Company': 'bg-green-100 text-green-800',
      'Government': 'bg-purple-100 text-purple-800',
      'Institution': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      (client.client_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone?.includes(searchTerm)) ||
      (client.city?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'active' && client.is_active) ||
      (filterType === 'inactive' && !client.is_active) ||
      client.client_type === filterType;

    return matchesSearch && matchesFilter;
  });

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients Management</h1>
          <p className="text-gray-600">Manage your client database and relationships</p>
        </div>
        <button 
          onClick={() => navigate('/crm/leads')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
          title="Clients are created by converting leads after 2% advance payment"
        >
          <UserCheck className="h-4 w-4" />
          <span>Convert from Lead</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients}
          icon={UserCheck}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Individual"
          value={stats.individualClients}
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Companies"
          value={stats.companyClients}
          icon={Building2}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search clients by name, email, phone, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="Individual">Individual</option>
            <option value="Company">Company</option>
            <option value="Government">Government</option>
            <option value="Institution">Institution</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-2 text-gray-600">Loading clients...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No clients found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.client_id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewClient(client)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.client_name}
                          {client.surname && ` ${client.surname}`}
                        </div>
                        {client.company_name && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {client.company_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {client.phone && (
                          <div className="text-sm text-gray-900 flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getClientTypeColor(client.client_type)}`}>
                        {client.client_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.city || 'N/A'}
                        {client.state && `, ${client.state}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        client.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClient(client);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="View Client Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Client"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(client);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Client"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modals */}
      <NewClientForm
        isOpen={isNewClientFormOpen}
        onClose={() => setIsNewClientFormOpen(false)}
        onSubmit={handleClientCreated}
      />

      <EditClientForm
        isOpen={isEditClientFormOpen}
        onClose={() => {
          setIsEditClientFormOpen(false);
          setSelectedClient(null);
        }}
        onSubmit={handleClientUpdated}
        client={selectedClient}
      />

      <DeleteClientModal
        isOpen={isDeleteClientModalOpen}
        onClose={() => {
          setIsDeleteClientModalOpen(false);
          setSelectedClient(null);
        }}
        onDelete={handleClientDeleted}
        client={selectedClient}
      />
    </div>
  );
};

export default Clients;
