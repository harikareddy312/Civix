import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import petitionService from "../../services/petitionService";
import { getSignedPetitions } from "../../services/signatureService";
import { getCurrentUserId } from "../../utils/auth";

const PetitionStats = ({ onCreatePetition }) => {
  const navigate = useNavigate(); // Add navigation hook
  
  // Get userId from localStorage
  const userId = getCurrentUserId();

  // Dynamic count states
  const [myPetitionsCount, setMyPetitionsCount] = useState(0);
  const [signedPetitionsCount, setSignedPetitionsCount] = useState(0);
  const [successfulPetitionsCount, setSuccessfulPetitionsCount] = useState(0);
  const [activePetitionsCount, setActivePetitionsCount] = useState(0);
  
  // Additional states for better UX
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);

  // Fetch stats function - now with better error handling
  const fetchStats = async () => {
    try {
      if (!userId) {
        console.warn("User ID not found. Make sure the user is logged in.");
        setError("Please log in to view your statistics");
        return;
      }

      setError(null);
      console.log('Fetching petition stats for user:', userId);

      // Fetch all petitions
      const data = await petitionService.getAllPetitions();
      const petitions = data.petitions || data;

      console.log('All petitions fetched:', petitions.length);

      // My Petitions - Dynamic count
      const myPetitions = petitions.filter(p => p.creator?._id === userId);
      setMyPetitionsCount(myPetitions.length);
      console.log('My petitions:', myPetitions.length);

      // Active Petitions - Dynamic count 
      const activePetitions = petitions.filter(p => p.status === "active");
      setActivePetitionsCount(activePetitions.length);
      console.log('Active petitions:', activePetitions.length);

      // Successful Petitions - Dynamic count (multiple success states)
      const successful = petitions.filter(p => 
        p.status === "closed" || 
        p.status === "successful" || 
        p.status === "under_review"
      );
      setSuccessfulPetitionsCount(successful.length);
      console.log('Successful petitions:', successful.length);

      // Signed Petitions - Dynamic count
      try {
        const signed = await getSignedPetitions(userId);
        setSignedPetitionsCount(signed.length);
        console.log('Signed petitions:', signed.length);
      } catch (signError) {
        console.error('Error fetching signed petitions:', signError);
        setSignedPetitionsCount(0);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching petition stats:", err);
      setError("Failed to load statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchStats();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [userId]);

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  // Enhanced stats with more categories
  const stats = [
    { 
      title: "My Petitions", 
      count: myPetitionsCount, 
      link: "View My Petitions",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Petitions you created"
    },
    { 
      title: "Signed Petitions", 
      count: signedPetitionsCount, 
      link: "View Signed",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Petitions you supported"
    },
    { 
      title: "Active Petitions", 
      count: activePetitionsCount, 
      link: "Browse Active",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Currently collecting signatures"
    },
    { 
      title: "Successful Petitions", 
      count: successfulPetitionsCount, 
      link: "View Success Stories",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Completed or under review"
    },
  ];

  if (loading && myPetitionsCount === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle create petition click
  const handleCreatePetition = () => {
    if (onCreatePetition) {
      onCreatePetition();
    } else {
      // Fallback navigation if prop is not provided
      navigate('/dashboard/petitions/create');
    }
  };

  return (
    <div>
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Error loading statistics</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Grid - ALL 5 CONTAINERS IN ONE LINE */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        {/* First 4 stat cards */}
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bgColor} rounded-lg shadow-sm border ${stat.borderColor} p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-md`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-semibold text-gray-900 leading-tight">{stat.title}</h3>
              {loading && (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              )}
            </div>
            
            <div className="mb-3">
              <span className={`text-3xl font-bold ${stat.color} transition-all duration-500`}>
                {stat.count}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 mb-3 leading-tight">
              {stat.description}
            </p>
            
            <button className={`${stat.color} hover:opacity-80 text-xs font-medium transition-colors`}>
              {stat.link} →
            </button>
          </div>
        ))}

        {/* 5th container - Enhanced Create New Petition Card */}
        <div
          className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-xl"
          onClick={handleCreatePetition}
        >
          <div className="w-full h-full flex flex-col items-center justify-center text-center text-white">
            <div className="text-4xl mb-3 font-light opacity-90">+</div>
            <h3 className="text-base font-bold mb-2 leading-tight">Create New Petition</h3>
            <p className="text-blue-100 text-xs leading-tight">
              Start a new petition for your community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetitionStats;
