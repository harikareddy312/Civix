import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://civix-engagement.onrender.com";

// Fetch petitions signed by a specific user
export const getSignedPetitions = async (userId) => {
  if (!userId) throw new Error("User ID is required");
  
  try {
    const res = await axios.get(`${API_URL}/signatures/user/${userId}`, {
      withCredentials: true
    });
    
    // Handle the updated response structure
    return res.data.petitions || res.data || [];
  } catch (err) {
    console.error("Error fetching signed petitions:", err);
    // Return empty array instead of throwing error for stats
    return [];
  }
};

// Get signature count for a petition
export const getPetitionSignatureCount = async (petitionId) => {
  if (!petitionId) throw new Error("Petition ID is required");
  
  try {
    const res = await axios.get(`${API_URL}/petitions/${petitionId}`, {
      withCredentials: true
    });
    
    return res.data.petition?.signaturesCount || 0;
  } catch (err) {
    console.error("Error fetching signature count:", err);
    return 0;
  }
};

// Check if user has signed a petition
export const hasUserSignedPetition = async (petitionId, userId) => {
  if (!petitionId || !userId) return false;
  
  try {
    const signedPetitions = await getSignedPetitions(userId);
    return signedPetitions.some(p => p._id.toString() === petitionId.toString());
  } catch (err) {
    console.error("Error checking if user signed petition:", err);
    return false;
  }
};
