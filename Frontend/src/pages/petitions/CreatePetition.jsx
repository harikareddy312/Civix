import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import petitionService from "../../services/petitionService";

const CreatePetition = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get petition ID from URL for edit mode
  const location = useLocation(); // Get petition data from navigation state
  
  // Determine if we're in edit mode
  const isEditMode = !!id || !!location.state?.petition;
  const petitionData = location.state?.petition;
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    signatureGoal: 100,
    location: "",
    lat: null,
    lng: null
  });

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    'Environment', 'Infrastructure', 'Education', 'Transportation',
    'Public Safety', 'Healthcare', 'Housing'
  ];

  // Load petition data for edit mode
  useEffect(() => {
    if (isEditMode && petitionData) {
      console.log("Loading petition data for editing:", petitionData);
      setFormData({
        title: petitionData.title || "",
        category: petitionData.category || "",
        description: petitionData.description || "",
        signatureGoal: petitionData.signatureGoal || 100,
        location: petitionData.location || "",
        lat: petitionData.lat || null,
        lng: petitionData.lng || null
      });
    } else if (isEditMode && id) {
      // Fetch petition data from API if not provided in state
      const fetchPetition = async () => {
        try {
          const response = await petitionService.getPetitionById(id);
          const petition = response.petition;
          setFormData({
            title: petition.title || "",
            category: petition.category || "",
            description: petition.description || "",
            signatureGoal: petition.signatureGoal || 100,
            location: petition.location || "",
            lat: petition.lat || null,
            lng: petition.lng || null
          });
        } catch (error) {
          console.error("Failed to load petition:", error);
          alert("Error loading petition data");
          navigate("/dashboard/petitions");
        }
      };
      fetchPetition();
    }
  }, [isEditMode, petitionData, id, navigate]);

  // Auto-detect location only for create mode
  useEffect(() => {
    if (!isEditMode && !formData.location) {
      const detectLocation = async () => {
        if (!navigator.geolocation) return;
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || '';
              const country = data.address.country || '';
              setFormData(prev => ({
                ...prev,
                location: city && country ? `${city}, ${country}` : country || city,
                lat: latitude,
                lng: longitude
              }));
            }
          } catch (err) {
            console.error("Failed to detect location:", err);
          } finally {
            setLoadingLocation(false);
          }
        }, (err) => {
          console.warn("User denied location or error:", err);
          setLoadingLocation(false);
        });
      };
      detectLocation();
    }
  }, [isEditMode, formData.location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.location) {
        alert("Please enter a location");
        setLoading(false);
        return;
      }

      if (isEditMode) {
        // Update existing petition
        const petitionId = id || petitionData._id;
        await petitionService.updatePetition(petitionId, formData);
        // alert("Petition updated successfully!");
      } else {
        // Create new petition
        await petitionService.createPetition(formData);
        // alert("Petition created successfully!");
      }
      
      navigate("/dashboard/petitions");
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} petition:`, error);
      alert(`Error ${isEditMode ? 'updating' : 'creating'} petition`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl ml-8 mr-4 px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* Header - Dynamic based on mode */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Petition' : 'Create a New Petition'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode 
              ? 'Update the details of your petition.' 
              : 'Complete the form below to create a petition in your community.'
            }
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Title */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Petition Title</h2>
              <p className="text-gray-500 text-sm mb-3">Give your petition a clear and specific title</p>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter petition title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Category, Location, Goal */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={loadingLocation ? "Detecting location..." : "Enter your city or area"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Signature Goal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Goal</label>
                  <input
                    type="number"
                    name="signatureGoal"
                    value={formData.signatureGoal}
                    onChange={handleChange}
                    min="10"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-500 text-sm mb-3">Describe the issue and the change that you would like to see</p>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                placeholder="Describe your petition in detail..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                required
              />
            </div>

            {/* Important Info - Dynamic based on mode */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-semibold text-yellow-800">Important Information:</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {isEditMode 
                      ? 'Changes to your petition will be saved immediately. Make sure all information is accurate.'
                      : 'By submitting this petition, you acknowledge that the content is factual to the best of your knowledge and does not contain misleading information.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons - Dynamic based on mode */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard/petitions')}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading 
                  ? (isEditMode ? "Updating..." : "Creating...") 
                  : (isEditMode ? "Update Petition" : "Create Petition")
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePetition;
