// src/services/pollService.js
import axios from "axios";
import api from './api'; // Add this import

const API_URL = import.meta.env.VITE_API_URL || "https://civix-engagement.onrender.com";
const DEFAULT_CONFIG = { withCredentials: true };

// Get polls with optional filters
export async function getPolls(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const res = await axios.get(`${API_URL}/polls?${params.toString()}`);
    return res.data.polls || [];
  } catch (err) {
    console.error("Error fetching polls:", err);
    return [];
  }
}

// Get single poll by id (returns poll object)
export async function getPollById(pollId) {
  try {
    const res = await axios.get(`${API_URL}/polls/${pollId}`);
    return res.data.poll || res.data;
  } catch (err) {
    console.error("Error fetching poll by id:", err);
    throw err;
  }
}

// Create a new poll (returns created poll)
export async function createPoll(pollData) {
  try {
    const res = await axios.post(`${API_URL}/polls`, pollData, DEFAULT_CONFIG);
    return res.data.poll || res.data;
  } catch (err) {
    console.error("Error creating poll:", err);
    throw err;
  }
}

// Vote on a poll
export const votePoll = async (pollId, optionIndex) => {
  try {
    const response = await api.post(`/polls/${pollId}/vote`, {
      option: Number(optionIndex)
    });
    console.log("Vote response data:", response.data);
    return response.data.poll || response.data;
  } catch (error) {
    console.error("Error voting on poll:", error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
};

// Delete a poll (only creator)
export async function deletePoll(pollId) {
  try {
    const res = await axios.delete(`${API_URL}/polls/${pollId}`, DEFAULT_CONFIG);
    return res.data;
  } catch (err) {
    console.error("Error deleting poll:", err);
    throw err;
  }
}

// Edit a poll (only creator)
export async function editPoll(pollId, updatedData) {
  try {
    const res = await axios.put(`${API_URL}/polls/${pollId}`, updatedData, DEFAULT_CONFIG);
    return res.data.poll || res.data;
  } catch (err) {
    console.error("Error editing poll:", err);
    throw err;
  }
}

// Add this method to your pollService object
export const pollService = {
  getPolls,
  getPollById,
  createPoll,
  votePoll,
  deletePoll,
  editPoll,

  // Get polls that user has voted on
  getVotedPolls: async (userId) => {
    if (USE_DUMMY_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Filter polls where user has voted
      const votedPolls = dummyPolls.filter(poll => 
        poll.votes && poll.votes.some(vote => 
          vote.user === userId || vote.user?._id === userId
        )
      );
      console.log('📊 Found voted polls for user:', userId, votedPolls.length);
      return votedPolls;
    }

    try {
      const response = await api.get(`/polls/user/${userId}/voted`);
      return response.data.polls || [];
    } catch (error) {
      console.error('Error fetching voted polls:', error);
      // Fallback: calculate from all polls
      const allPolls = await this.getPolls();
      return allPolls.filter(poll => poll.userHasVoted);
    }
  },

  // Get comprehensive poll statistics
  getPollStats: async (userId) => {
    if (USE_DUMMY_DATA) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const normalizeId = (u) => typeof u === "string" ? u : (u?._id || u?.id || "");
      
      const stats = {
        totalPolls: dummyPolls.length,
        activePolls: dummyPolls.filter(p => p.status === 'active').length,
        closedPolls: dummyPolls.filter(p => p.status === 'closed').length,
        draftPolls: dummyPolls.filter(p => p.status === 'draft').length,
        myPolls: dummyPolls.filter(p => normalizeId(p.creator) === String(userId)).length,
        votedPolls: dummyPolls.filter(p => 
          p.votes && p.votes.some(v => normalizeId(v.user) === String(userId))
        ).length,
        totalVotes: dummyPolls.reduce((sum, poll) => sum + (poll.votes?.length || 0), 0)
      };
      
      console.log('📊 Generated comprehensive poll stats:', stats);
      return stats;
    }

    try {
      const response = await api.get(`/polls/stats${userId ? `?userId=${userId}` : ''}`);
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching poll stats:', error);
      // Fallback calculation
      const allPolls = await this.getPolls();
      const normalizeId = (u) => typeof u === "string" ? u : (u?._id || u?.id || "");
      
      return {
        totalPolls: allPolls.length,
        activePolls: allPolls.filter(p => p.status === 'active').length,
        closedPolls: allPolls.filter(p => p.status === 'closed').length,
        draftPolls: allPolls.filter(p => p.status === 'draft').length,
        myPolls: allPolls.filter(p => normalizeId(p.creator) === String(userId)).length,
        votedPolls: allPolls.filter(p => p.userHasVoted).length,
        totalVotes: allPolls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0)
      };
    }
  },
};
