import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle, 
  CreditCard, 
  Wallet,
  Building,
  Store,
  Maximize2,
  Boxes,
  Package,
  DoorClosed,
  Ruler,
  Link2,
  Settings,
  Database,
  PackageOpen,
  Home
} from 'lucide-react';

const MasterDataDashboard = () => {
  const navigate = useNavigate();

  const masterDataSections = [
    {
      title: 'Location Master Data',
      icon: MapPin,
      color: 'blue',
      items: [
        { name: 'States', path: '/admin/masterdata/states', icon: MapPin, description: 'Manage states' },
        { name: 'Cities', path: '/admin/masterdata/cities', icon: Building2, description: 'Manage cities' }
      ]
    },
    {
      title: 'CRM Master Data',
      icon: Users,
      color: 'green',
      items: [
        { name: 'Enquiry Sources', path: '/admin/masterdata/enquiry-sources', icon: Users, description: 'Manage enquiry sources' },
        { name: 'Enquiry Status', path: '/admin/masterdata/enquiry-status', icon: CheckCircle, description: 'Manage enquiry statuses' }
      ]
    },
    {
      title: 'Payment Master Data',
      icon: CreditCard,
      color: 'purple',
      items: [
        { name: 'Payment Methods', path: '/admin/masterdata/payment-methods', icon: CreditCard, description: 'Manage payment methods' },
        { name: 'Payment Types', path: '/admin/masterdata/payment-types', icon: Wallet, description: 'Manage payment types' }
      ]
    },
    {
      title: 'Vendor Master Data',
      icon: Store,
      color: 'orange',
      items: [
        { name: 'Vendor Types', path: '/admin/masterdata/vendor-types', icon: Building, description: 'Manage vendor types' },
        { name: 'Vendors', path: '/admin/masterdata/vendors', icon: Store, description: 'Manage vendors' }
      ]
    },
    {
      title: 'Construction Master Data',
      icon: Settings,
      color: 'indigo',
      items: [
        { name: 'Packages', path: '/admin/masterdata/packages', icon: PackageOpen, description: 'Manage construction packages' },
        { name: 'Elements', path: '/admin/masterdata/elements', icon: Boxes, description: 'Manage construction elements' },
        { name: 'Element Item Mapping', path: '/admin/masterdata/element-item-mapping', icon: Link2, description: 'Map elements to items' },
        { name: 'Items', path: '/admin/masterdata/items', icon: Package, description: 'Manage construction items' },
        { name: 'Item Choices', path: '/admin/masterdata/item-choices', icon: Settings, description: 'Manage item choices' }
      ]
    },
    {
      title: 'Dimensions & Standards',
      icon: Ruler,
      color: 'teal',
      items: [
        { name: 'Door Dimensions', path: '/admin/masterdata/door-dimensions', icon: DoorClosed, description: 'Manage door dimensions' },
        { name: 'Window Dimensions', path: '/admin/masterdata/window-dimensions', icon: Maximize2, description: 'Manage window dimensions' },
        { name: 'Room Types', path: '/admin/masterdata/room-types', icon: Home, description: 'Manage room types' }
      ]
    }
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600'
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Master Data Management</h1>
        </div>
        <p className="text-gray-600 text-lg">Centralized management of all master data tables</p>
      </div>

      {/* Master Data Sections */}
      <div className="space-y-8">
        {masterDataSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="bg-white rounded-lg shadow-md p-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[section.color]}`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
            </div>

            {/* Section Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => handleNavigate(item.path)}
                    className="group relative p-4 bg-gray-50 hover:bg-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-200 text-left"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[section.color]} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                    </div>
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold mb-1">
            {masterDataSections.reduce((acc, section) => acc + section.items.length, 0)}
          </div>
          <div className="text-blue-100">Total Master Data Tables</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold mb-1">{masterDataSections.length}</div>
          <div className="text-green-100">Data Categories</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold mb-1">100%</div>
          <div className="text-purple-100">CRUD Operations</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold mb-1">Ready</div>
          <div className="text-orange-100">System Status</div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataDashboard;
