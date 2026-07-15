import React, { useState, useEffect } from 'react';
import { X, Save, Phone, Mail, MapPin, Building2, DollarSign, Calendar, User, Globe, Package } from 'lucide-react';
import { enquiriesAPI, packagesAPI } from '../../../services/api';

const NewEnquiryForm = ({ isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackageDetails, setSelectedPackageDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    // Contact Information
    contact_person_name: '',
    contact_surname: '',
    company_name: '',
    primary_phone: '',
    email: '',
    whatsapp_number: '',
    
    // Location
    city: '',
    state: '',
    
    // Project Information
    project_type: 'Residential',
    construction_type: 'New Construction',
    building_type: '',
    approximate_area: '',
    area_unit: 'sqft',
    budget_range: '',
    expected_timeline: '',
    
    // Package Selection
    package_id: '',
    
    // Marketing Source Tracking
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    referrer_url: '',
    landing_page: '',
    device_type: 'Desktop',
    
    // Notes
    enquiry_notes: '',
    
    // Additional Information
    has_specific_location: false,
    has_realistic_budget: false,
    has_immediate_timeline: false,
    is_repeat_visitor: false
  });

  // Fetch packages on component mount
  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  // Calculate estimated cost when package or area changes
  useEffect(() => {
    if (formData.package_id && formData.approximate_area && selectedPackageDetails) {
      const area = parseFloat(formData.approximate_area) || 0;
      const rate = parseFloat(selectedPackageDetails.total_price_per_sqft) || 0;
      const estimatedTotal = area * rate;
      
      // Update form data with cost estimates (just for display, not sent to server)
      setSelectedPackageDetails(prev => ({
        ...prev,
        estimated_total: estimatedTotal,
        estimated_gst: estimatedTotal * 0.18,
        estimated_base: estimatedTotal / 1.18
      }));
    }
  }, [formData.package_id, formData.approximate_area, selectedPackageDetails?.total_price_per_sqft]);

  const fetchPackages = async () => {
    setLoadingPackages(true);
    try {
      const response = await packagesAPI.getAll();
      // Handle both response formats: raw array OR { success: true, data: [...] }
      const packagesData = Array.isArray(response) ? response : (response.data || response);
      if (Array.isArray(packagesData) && packagesData.length > 0) {
        setPackages(packagesData);
      } else {
        console.error('Failed to fetch packages or empty response:', response);
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Handle package selection
    if (name === 'package_id' && value) {
      const selectedPackage = packages.find(pkg => pkg.id == value);
      setSelectedPackageDetails(selectedPackage);
    } else if (name === 'package_id' && !value) {
      setSelectedPackageDetails(null);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.contact_person_name.trim()) {
      newErrors.contact_person_name = 'Contact person name is required';
    }

    if (!formData.primary_phone.trim()) {
      newErrors.primary_phone = 'Primary phone is required';
    } else if (!/^\d{10}$/.test(formData.primary_phone.replace(/\D/g, ''))) {
      newErrors.primary_phone = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.project_type.trim()) {
      newErrors.project_type = 'Project type is required';
    }

    if (!formData.construction_type.trim()) {
      newErrors.construction_type = 'Construction type is required';
    }

    if (!formData.approximate_area || formData.approximate_area <= 0) {
      newErrors.approximate_area = 'Please enter a valid area';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate enquiry number (in real app, this would be done by backend)
      const enquiry_number = `ENQ-${Date.now().toString().slice(-6)}`;
      
      const enquiryData = {
        ...formData,
        enquiry_number,
        // Convert package_id to integer if provided
        package_id: formData.package_id ? parseInt(formData.package_id) : null,
        // Hot/Cold classification logic
        crm_classification: getEnquiryClassification(formData),
        classification_reason: getClassificationReason(formData),
        form_completion_quality: calculateFormCompletionScore(formData),
        // Set browser info
        browser: navigator.userAgent,
        ip_address: '127.0.0.1' // In real app, get from backend
      };

      const response = await enquiriesAPI.create(enquiryData);
      console.log('Enquiry created:', response);
      
      onSubmit && onSubmit(response);
      onClose();
      
      // Reset form
      setFormData({
        contact_person_name: '',
        contact_surname: '',
        company_name: '',
        primary_phone: '',
        email: '',
        whatsapp_number: '',
        city: '',
        state: '',
        project_type: 'Residential',
        construction_type: 'New Construction',
        building_type: '',
        approximate_area: '',
        area_unit: 'sqft',
        budget_range: '',
        expected_timeline: '',
        package_id: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        referrer_url: '',
        landing_page: '',
        device_type: 'Desktop',
        enquiry_notes: '',
        has_specific_location: false,
        has_realistic_budget: false,
        has_immediate_timeline: false,
        is_repeat_visitor: false
      });
      setSelectedPackageDetails(null);
      
    } catch (error) {
      console.error('Error creating enquiry:', error);
      alert('Error creating enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for classification
  const getEnquiryClassification = (data) => {
    let hotScore = 0;
    
    if (data.has_specific_location) hotScore++;
    if (data.has_realistic_budget) hotScore++;
    if (data.has_immediate_timeline) hotScore++;
    if (data.budget_range && !data.budget_range.includes('Not sure')) hotScore++;
    if (data.expected_timeline && !data.expected_timeline.includes('Not decided')) hotScore++;
    if (data.company_name) hotScore++;
    if (data.package_id) hotScore++; // Package selection indicates serious interest
    
    if (hotScore >= 5) return 'Hot';
    if (hotScore >= 3) return 'Medium';
    return 'Cold';
  };

  const getClassificationReason = (data) => {
    const reasons = [];
    if (data.has_specific_location) reasons.push('Has specific location');
    if (data.has_realistic_budget) reasons.push('Has realistic budget');
    if (data.has_immediate_timeline) reasons.push('Has immediate timeline');
    if (data.company_name) reasons.push('Company enquiry');
    if (data.package_id) reasons.push('Selected package');
    
    return reasons.length > 0 ? reasons.join(', ') : 'Basic enquiry information provided';
  };

  const calculateFormCompletionScore = (data) => {
    const fields = Object.keys(data);
    const filledFields = fields.filter(key => {
      const value = data[key];
      if (typeof value === 'string') return value.trim() !== '';
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value > 0;
      return false;
    });
    
    return Math.round((filledFields.length / fields.length) * 100) / 100;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">New Enquiry</h2>
            <p className="text-gray-600">Add a new customer enquiry with package selection</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="contact_person_name"
                    value={formData.contact_person_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.contact_person_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.contact_person_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.contact_person_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="contact_surname"
                    value={formData.contact_surname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter company name (optional)"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Primary Phone *
                  </label>
                  <input
                    type="tel"
                    name="primary_phone"
                    value={formData.primary_phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.primary_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit phone"
                  />
                  {errors.primary_phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.primary_phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="WhatsApp number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Delhi">Delhi</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Project Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Project Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type *
                  </label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.project_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Institutional">Institutional</option>
                  </select>
                  {errors.project_type && (
                    <p className="text-red-500 text-xs mt-1">{errors.project_type}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Type *
                  </label>
                  <select
                    name="construction_type"
                    value={formData.construction_type}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.construction_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="New Construction">New Construction</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Extension">Extension</option>
                    <option value="Repair">Repair</option>
                  </select>
                  {errors.construction_type && (
                    <p className="text-red-500 text-xs mt-1">{errors.construction_type}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building Type
                </label>
                <select
                  name="building_type"
                  value={formData.building_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Building Type</option>
                  <option value="Ground">Ground</option>
                  <option value="Ground + 1 Floor">Ground + 1 Floor</option>
                  <option value="Ground + 2 Floors">Ground + 2 Floors</option>
                  <option value="Ground + 3 Floors">Ground + 3 Floors</option>
                  <option value="Ground + 4 Floors">Ground + 4 Floors</option>
                  <option value="Stilt + 1 Floor">Stilt + 1 Floor</option>
                  <option value="Stilt + 2 Floors">Stilt + 2 Floors</option>
                  <option value="Stilt + 3 Floors">Stilt + 3 Floors</option>
                  <option value="Stilt + 4 Floors">Stilt + 4 Floors</option>
                  <option value="Stilt + 5 Floors">Stilt + 5 Floors</option>
                  <option value="Basement + Ground">Basement + Ground</option>
                  <option value="Basement + Ground + 1 Floor">Basement + Ground + 1 Floor</option>
                  <option value="Basement + Ground + 2 Floors">Basement + Ground + 2 Floors</option>
                  <option value="Basement + Stilt + Floors">Basement + Stilt + Floors</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approximate Area *
                  </label>
                  <input
                    type="number"
                    name="approximate_area"
                    value={formData.approximate_area}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.approximate_area ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter area"
                    min="1"
                  />
                  {errors.approximate_area && (
                    <p className="text-red-500 text-xs mt-1">{errors.approximate_area}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="area_unit"
                    value={formData.area_unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="sqft">Sq Ft</option>
                    <option value="sqmt">Sq Mt</option>
                    <option value="acres">Acres</option>
                    <option value="cents">Cents</option>
                  </select>
                </div>
              </div>

              {/* Package Selection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h4 className="text-md font-semibold text-blue-900">Package Selection</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Package
                  </label>
                  <select
                    name="package_id"
                    value={formData.package_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loadingPackages}
                  >
                    <option value="">
                      {loadingPackages ? 'Loading packages...' : 'Select a package (optional)'}
                    </option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.package_name} - ₹{pkg.total_price_per_sqft}/sq ft
                      </option>
                    ))}
                  </select>
                </div>

                {/* Package Cost Estimate */}
                {selectedPackageDetails && formData.approximate_area && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Cost Estimate</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <span className="ml-1 font-medium">{formData.approximate_area} {formData.area_unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate:</span>
                        <span className="ml-1 font-medium">₹{selectedPackageDetails.total_price_per_sqft}/sq ft</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Base Cost:</span>
                        <span className="ml-1 font-medium">{formatCurrency(selectedPackageDetails.estimated_base)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">GST (18%):</span>
                        <span className="ml-1 font-medium">{formatCurrency(selectedPackageDetails.estimated_gst)}</span>
                      </div>
                      <div className="col-span-2 border-t pt-1">
                        <span className="text-gray-700 font-semibold">Total Estimate:</span>
                        <span className="ml-1 font-bold text-green-600">{formatCurrency(selectedPackageDetails.estimated_total)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">*This is an approximate estimate. Final cost may vary based on specifications and site conditions.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Budget Range
                </label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Budget Range</option>
                  <option value="Under 25 Lakhs">Under ₹25 Lakhs</option>
                  <option value="25-50 Lakhs">₹25-50 Lakhs</option>
                  <option value="50-75 Lakhs">₹50-75 Lakhs</option>
                  <option value="75 Lakhs - 1 Crore">₹75 Lakhs - 1 Crore</option>
                  <option value="1-2 Crores">₹1-2 Crores</option>
                  <option value="2-5 Crores">₹2-5 Crores</option>
                  <option value="Above 5 Crores">Above ₹5 Crores</option>
                  <option value="Not sure">Not sure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Expected Timeline
                </label>
                <select
                  name="expected_timeline"
                  value={formData.expected_timeline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Timeline</option>
                  <option value="Immediate (Within 1 month)">Immediate (Within 1 month)</option>
                  <option value="1-3 months">1-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="More than 1 year">More than 1 year</option>
                  <option value="Not decided">Not decided</option>
                </select>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              {/* Marketing Source Tracking */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Globe className="h-5 w-5 text-purple-500" />
                  <h4 className="text-lg font-semibold text-gray-900">Source Tracking</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTM Source
                    </label>
                    <input
                      type="text"
                      name="utm_source"
                      value={formData.utm_source}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="google, facebook, direct"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTM Medium
                    </label>
                    <input
                      type="text"
                      name="utm_medium"
                      value={formData.utm_medium}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="cpc, social, email"
                    />
                  </div>
                </div>
              </div>

              {/* Qualification Flags */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Lead Qualification</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_specific_location"
                      checked={formData.has_specific_location}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has specific location identified</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_realistic_budget"
                      checked={formData.has_realistic_budget}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has realistic budget</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="has_immediate_timeline"
                      checked={formData.has_immediate_timeline}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has immediate timeline</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_repeat_visitor"
                      checked={formData.is_repeat_visitor}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Repeat visitor</span>
                  </label>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="enquiry_notes"
                  value={formData.enquiry_notes}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any additional information about the enquiry..."
                />
              </div>

              {/* Classification Preview */}
              {formData.contact_person_name && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Auto Classification</h5>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      getEnquiryClassification(formData) === 'Hot' ? 'bg-red-100 text-red-800' :
                      getEnquiryClassification(formData) === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getEnquiryClassification(formData)} Lead
                    </span>
                    <span className="text-xs text-gray-600">
                      ({Math.round(calculateFormCompletionScore(formData) * 100)}% complete)
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {getClassificationReason(formData)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 flex items-center space-x-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Enquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEnquiryForm;