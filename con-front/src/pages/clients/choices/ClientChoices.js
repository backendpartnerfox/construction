import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { choicesApi } from '../../../services/clientsApi';

const ClientChoices = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [choices, setChoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChoices();
  }, [id]);

  const loadChoices = async () => {
    try {
      const response = await choicesApi.getByProject(id);
      setChoices(response.data || []);
    } catch (error) {
      console.error('Error loading choices:', error);
      setChoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (choiceId) => {
    if (window.confirm('Are you sure you want to delete this choice?')) {
      try {
        await choicesApi.delete(choiceId);
        loadChoices();
      } catch (error) {
        console.error('Error deleting choice:', error);
        alert('Failed to delete choice');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Client Choices</h1>
          <button
            onClick={() => navigate(`/clients/${id}/choices/new`)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Choice</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : choices.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No choices found</p>
            <p className="text-sm text-gray-400 mt-1">Add material choices to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {choices.map((choice) => (
              <div key={choice.choice_id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{choice.choice_value}</h3>
                  <p className="text-sm text-gray-600 mt-1">Item ID: {choice.item_id}</p>
                  {choice.notes && (
                    <p className="text-sm text-gray-500 mt-1">{choice.notes}</p>
                  )}
                  {choice.is_default && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      Default Choice
                    </span>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => navigate(`/clients/${id}/choices/${choice.choice_id}/edit`)}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(choice.choice_id)}
                    className="text-red-600 hover:text-red-900 p-2"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientChoices;
