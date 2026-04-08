import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'https://civix-engagement.onrender.com';

// Get user from localStorage
const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

const petitionService = {
  // Get all petitions with signature counts
  getAllPetitions: async (params = {}) => {
    try {
      const response = await api.get('/petitions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching petitions:', error);
      throw error;
    }
  },

  // Get petition by ID
  getPetitionById: async (id) => {
    try {
      const response = await api.get(`/petitions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching petition:', error);
      throw error;
    }
  },

  // Create petition
  createPetition: async (petitionData) => {
    try {
      const user = getUserFromStorage();
      const response = await api.post('/petitions', {
        ...petitionData,
        userId: user?.user?.id || user?.id // Include user ID from localStorage
      });
      return response.data;
    } catch (error) {
      console.error('Error creating petition:', error);
      throw error;
    }
  },

  // Sign petition - FIXED TO USE CORRECT ENDPOINT
  signPetition: async (petitionId) => {
    try {
      const user = getUserFromStorage();
      
      if (!user || (!user.user?.id && !user.id)) {
        throw new Error('User not authenticated. Please login first.');
      }

      const userId = user.user?.id || user.id;
      
      console.log('Signing petition:', petitionId, 'with user:', userId);
      
      // Use the correct endpoint format: /petitions/:id/sign
      const response = await api.post(`/petitions/${petitionId}/sign`, {
        userId: userId
      });
      
      return response.data;
    } catch (error) {
      console.error('Error signing petition:', error);
      throw error;
    }
  },

  // Update petition
  updatePetition: async (id, petitionData) => {
    try {
      const response = await api.put(`/petitions/${id}`, petitionData);
      return response.data;
    } catch (error) {
      console.error('Error updating petition:', error);
      throw error;
    }
  },

  // Delete petition
  deletePetition: async (id) => {
    try {
      const response = await api.delete(`/petitions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting petition:', error);
      throw error;
    }
  },

  // Get petition signatures
  getPetitionSignatures: async (petitionId) => {
    try {
      const response = await api.get(`/petitions/${petitionId}/signatures`);
      return response.data;
    } catch (error) {
      console.error('Error fetching signatures:', error);
      throw error;
    }
  },

  // Get comments for a petition
  getComments: async (petitionId) => {
    try {
      console.log('Fetching comments for petition:', petitionId);
      const response = await api.get(`/comments/petition/${petitionId}`);
      console.log('Comments fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  // Add comment to a petition
  addComment: async (petitionId, text) => {
    try {
      console.log('Adding comment to petition:', petitionId);
      const response = await api.post(`/comments/petition/${petitionId}`, { text });
      console.log('Comment added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (petitionId, commentId, text) => {
    try {
      console.log('Updating comment:', commentId);
      const response = await api.put(`/comments/petition/${petitionId}/${commentId}`, { text });
      console.log('Comment updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (petitionId, commentId) => {
    try {
      console.log('Deleting comment:', commentId);
      const response = await api.delete(`/comments/petition/${petitionId}/${commentId}`);
      console.log('Comment deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  // Like a comment
  likeComment: async (petitionId, commentId) => {
    try {
      const response = await api.post(`/comments/petition/${petitionId}/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Like comment error:', error);
      throw error;
    }
  },

  // Dislike a comment
  dislikeComment: async (petitionId, commentId) => {
    try {
      const response = await api.post(`/comments/petition/${petitionId}/${commentId}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Dislike comment error:', error);
      throw error;
    }
  },

  // Add reply to a comment
  addReply: async (petitionId, commentId, text) => {
    try {
      const response = await api.post(`/comments/petition/${petitionId}/${commentId}/reply`, { text });
      return response.data;
    } catch (error) {
      console.error('Add reply error:', error);
      throw error;
    }
  },

  // Like a reply
  likeReply: async (petitionId, commentId, replyId) => {
    try {
      const response = await api.post(`/comments/petition/${petitionId}/${commentId}/reply/${replyId}/like`);
      return response.data;
    } catch (error) {
      console.error('Like reply error:', error);
      throw error;
    }
  },

  // Dislike a reply
  dislikeReply: async (petitionId, commentId, replyId) => {
    try {
      const response = await api.post(`/comments/petition/${petitionId}/${commentId}/reply/${replyId}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Dislike reply error:', error);
      throw error;
    }
  },

  // Delete a reply
  deleteReply: async (petitionId, commentId, replyId) => {
    try {
      const response = await api.delete(`/comments/petition/${petitionId}/${commentId}/reply/${replyId}`);
      return response.data;
    } catch (error) {
      console.error('Delete reply error:', error);
      throw error;
    }
  },

  // Get comment count for a petition
  getCommentCount: async (petitionId) => {
    try {
      const response = await api.get(`/comments/petition/${petitionId}/count`);
      return response.data;
    } catch (error) {
      console.error('Get comment count error:', error);
      throw error;
    }
  },

  // Get user's comments
  getUserComments: async () => {
    try {
      const response = await api.get('/comments/my-comments');
      return response.data;
    } catch (error) {
      console.error('Get user comments error:', error);
      throw error;
    }
  },

  // Search petitions
  searchPetitions: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams({
        query,
        ...filters
      });
      
      const response = await api.get(`/petitions/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching petitions:', error);
      throw error;
    }
  },
};

export default petitionService;
