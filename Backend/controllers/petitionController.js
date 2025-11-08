import Petition from "../models/Petition.js";
import Signature from "../models/Signature.js";
import User from "../models/User.js";
import Comment from '../models/Comment.js';
import mongoose from "mongoose";
import { logAdminAction } from "./adminLogController.js";

// Get all petitions (alias for compatibility)
export const getPetitions = async (req, res) => {
  return getAllPetitions(req, res);
};

// Get all petitions with signature counts
export const getAllPetitions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    // Get all petitions with creator info
    const petitions = await Petition.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    // Get signature counts for all petitions
    const petitionIds = petitions.map(p => p._id);
    const signatureCounts = await Signature.aggregate([
      { $match: { petition: { $in: petitionIds } } },
      { $group: { _id: "$petition", count: { $sum: 1 } } }
    ]);

    // Get comment counts for all petitions
    const commentCounts = await Comment.aggregate([
      { $match: { petition: { $in: petitionIds } } },
      { $group: { _id: "$petition", count: { $sum: 1 } } }
    ]);

    // Get user's signed petitions if authenticated
    let userSignedPetitions = [];
    if (userId) {
      const userSignatures = await Signature.find({ user: userId });
      userSignedPetitions = userSignatures.map(sig => sig.petition.toString());
    }

    // Map signature counts to petitions
    const petitionsWithCounts = petitions.map(petition => {
      const signatureData = signatureCounts.find(
        sc => sc._id.toString() === petition._id.toString()
      );
      
      const commentData = commentCounts.find(
        cc => cc._id.toString() === petition._id.toString()
      );
      
      const signaturesCount = signatureData ? signatureData.count : 0;
      const commentsCount = commentData ? commentData.count : 0;
      const userHasSigned = userSignedPetitions.includes(petition._id.toString());

      return {
        ...petition.toObject(),
        signaturesCount,
        commentsCount,
        userHasSigned,
        signedByCurrentUser: userHasSigned
      };
    });
    
    res.json({
      success: true,
      petitions: petitionsWithCounts,
      total: petitionsWithCounts.length
    });

  } catch (error) {
    console.error("Error fetching petitions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching petitions",
      error: error.message
    });
  }
};

// Create petition
export const createPetition = async (req, res) => {
  try {
    const { title, description, category, location, signatureGoal } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create petition'
      });
    }

    if (!title || !description || !category || !location || !signatureGoal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const petition = new Petition({
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      signatureGoal: parseInt(signatureGoal),
      creator: userId,
      status: 'active'
    });

    await petition.save();
    await petition.populate('creator', 'name email');

    res.status(201).json({
      success: true,
      petition: {
        ...petition.toObject(),
        signaturesCount: 0,
        userHasSigned: false
      }
    });

  } catch (error) {
    console.error('Create petition error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating petition',
      error: error.message
    });
  }
};

// Sign a petition
export const signPetition = async (req, res) => {
  try {
    const petitionId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required. Please login again.'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(petitionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Check if petition exists
    const petition = await Petition.findById(petitionId);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Check if petition is closed
    const closedStatuses = ['closed', 'successful', 'rejected', 'expired'];
    if (closedStatuses.includes(petition.status)) {
      return res.status(400).json({
        success: false,
        message: `This petition is ${petition.status} and no longer accepting signatures`
      });
    }

    // Check if user is the petition creator
    if (petition.creator.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot sign your own petition'
      });
    }

    // Check if user already signed this petition
    const existingSignature = await Signature.findOne({
      petition: petitionId,
      user: userId
    });

    if (existingSignature) {
      const totalSignatures = await Signature.countDocuments({ petition: petitionId });
      return res.status(400).json({
        success: false,
        message: 'You have already signed this petition',
        signatureCount: totalSignatures
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create new signature
    const signature = new Signature({
      petition: petitionId,
      user: userId
    });

    const savedSignature = await signature.save();

    // Get updated signature count
    const totalSignatures = await Signature.countDocuments({ petition: petitionId });

    res.json({
      success: true,
      message: 'Petition signed successfully',
      signatureCount: totalSignatures,
      signature: {
        id: savedSignature._id,
        createdAt: savedSignature.createdAt
      }
    });

  } catch (error) {
    console.error('Petition signing error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      try {
        const totalSignatures = await Signature.countDocuments({ petition: req.params.id });
        return res.status(400).json({
          success: false,
          message: 'You have already signed this petition',
          signatureCount: totalSignatures
        });
      } catch (countError) {
        console.error('Error counting signatures:', countError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while signing petition',
      error: error.message
    });
  }
};

// Get petition by ID
export const getPetitionById = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id)
      .populate('creator', 'name email role');

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Get signature count and signatures from Signature collection
    const signatureCount = await Signature.countDocuments({ petition: req.params.id });
    const signatures = await Signature.find({ petition: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Get comment count
    const commentsCount = await Comment.countDocuments({ petition: req.params.id });

    // Check if current user has signed
    let userHasSigned = false;
    if (req.user) {
      const userSignature = await Signature.findOne({ 
        petition: req.params.id, 
        user: req.user.id 
      });
      userHasSigned = !!userSignature;
    }

    const petitionWithSignatures = {
      ...petition.toObject(),
      signaturesCount: signatureCount,
      signatures: signatures,
      commentsCount: commentsCount,
      userHasSigned: userHasSigned,
      signedByCurrentUser: userHasSigned
    };

    res.json({
      success: true,
      petition: petitionWithSignatures
    });
  } catch (error) {
    console.error('Get petition by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching petition",
      error: error.message 
    });
  }
};

// Update/Edit petition
export const editPetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: "Petition not found"
      });
    }

    if (petition.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can edit this petition"
      });
    }

    // Only allow editing certain fields
    const allowedUpdates = ['title', 'description', 'category', 'location', 'signatureGoal'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(petition, updates);
    await petition.save();

    // Get updated petition with signature count
    const signatureCount = await Signature.countDocuments({ petition: petition._id });

    res.json({ 
      success: true,
      message: "Petition updated successfully", 
      petition: {
        ...petition.toObject(),
        signaturesCount: signatureCount
      }
    });
  } catch (err) {
    console.error("Error editing petition:", err);
    res.status(500).json({ 
      success: false,
      message: "Error editing petition", 
      error: err.message 
    });
  }
};

// Delete petition
export const deletePetition = async (req, res) => {
  try {
    const petition = await Petition.findById(req.params.id);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: "Petition not found"
      });
    }

    if (petition.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can delete this petition"
      });
    }

    // Delete the petition
    await petition.deleteOne();
    
    // Delete all associated signatures from Signature collection
    await Signature.deleteMany({ petition: req.params.id });

    res.json({ 
      success: true,
      message: "Petition deleted successfully" 
    });
  } catch (err) {
    console.error("Error deleting petition:", err);
    res.status(500).json({ 
      success: false,
      message: "Error deleting petition", 
      error: err.message 
    });
  }
};

// Get analytics for public officials
export const getOfficialAnalytics = async (req, res) => {
  try {
    // Basic overview counts
    const totalPetitions = await Petition.countDocuments();
    const activePetitions = await Petition.countDocuments({ status: 'active' });
    const reviewedPetitions = await Petition.countDocuments({ 
      status: { $in: ['under_review', 'reviewed', 'in_progress'] } 
    });
    const closedPetitions = await Petition.countDocuments({ 
      status: { $in: ['closed', 'successful', 'rejected', 'expired'] } 
    });

    // Calculate total signatures across all petitions
    const totalSignatures = await Signature.countDocuments();

    // Petitions by category
    let petitionsByCategory = [];
    try {
      petitionsByCategory = await Petition.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    } catch (err) {
      console.error('Error in petitionsByCategory aggregation:', err);
      petitionsByCategory = [];
    }

    // Petitions by location (top 10)
    let petitionsByLocation = [];
    try {
      petitionsByLocation = await Petition.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
    } catch (err) {
      console.error('Error in petitionsByLocation aggregation:', err);
      petitionsByLocation = [];
    }

    // Date range for trending data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Trending petitions
    let trendingPetitions = [];
    try {
      trendingPetitions = await Petition.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $lookup: {
            from: 'signatures',
            localField: '_id',
            foreignField: 'petition',
            as: 'signatures'
          }
        },
        {
          $addFields: {
            signatureCount: { $size: '$signatures' }
          }
        },
        {
          $sort: { signatureCount: -1 }
        },
        {
          $limit: 10
        },
        {
          $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator'
          }
        },
        {
          $unwind: {
            path: '$creator',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            category: 1,
            location: 1,
            signatureCount: 1,
            'creator.name': 1,
            createdAt: 1
          }
        }
      ]);
    } catch (err) {
      console.error('Error in trendingPetitions aggregation:', err);
      trendingPetitions = [];
    }

    // Signature trends
    let signatureTrends = [];
    try {
      const signatureExists = await mongoose.connection.db.listCollections({ name: 'signatures' }).hasNext();
      
      if (signatureExists) {
        signatureTrends = await Signature.aggregate([
          {
            $match: {
              createdAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      }
    } catch (err) {
      console.error('Error in signatureTrends aggregation:', err);
      signatureTrends = [];
    }

    res.json({
      success: true,
      analytics: {
        overview: {
          totalPetitions,
          activePetitions,
          reviewedPetitions,
          closedPetitions,
          totalSignatures
        },
        petitionsByCategory,
        petitionsByLocation,
        trendingPetitions,
        signatureTrends
      }
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching analytics",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update petition status (Public Officials only)
export const updatePetitionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, officialResponse } = req.body;
    const officialId = req.user?.id;

    // Verify user is public official
    if (req.user.role !== 'public-official' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only public officials can update petition status'
      });
    }

    const petition = await Petition.findById(id).populate('creator', 'name email');
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    const previousStatus = petition.status;

    // Update petition
    petition.status = status;
    if (officialResponse) {
      petition.officialResponse = officialResponse;
    }
    petition.reviewedBy = officialId;
    petition.reviewedAt = new Date();

    // Add to timeline
    petition.timeline.push({
      status: status,
      date: new Date(),
      note: officialResponse,
      official: officialId
    });

    await petition.save();

    // Get official details
    const official = await User.findById(officialId).select('name department position');

    // Create admin log
    await logAdminAction(
      `Updated petition status to "${status}"`,
      petition.creator._id,
      petition._id,
      null,
      {
        petitionTitle: petition.title,
        previousStatus: previousStatus,
        newStatus: status,
        officialId: officialId,
        officialName: official?.name || 'Official',
        officialDepartment: official?.department || 'N/A',
        officialPosition: official?.position || 'N/A',
        officialResponse: officialResponse
      }
    );

    res.json({
      success: true,
      message: 'Petition status updated successfully',
      petition
    });

  } catch (error) {
    console.error('Update petition status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating petition status',
      error: error.message
    });
  }
};

// Verify petition (Public Officials only)
export const verifyPetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, verificationNote } = req.body;
    const officialId = req.user?.id;

    // Verify user is public official
    if (req.user.role !== 'public-official' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only public officials can verify petitions'
      });
    }

    const petition = await Petition.findById(id).populate('creator', 'name email');
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Update petition
    petition.verified = verified;
    petition.verifiedBy = officialId;
    petition.verifiedAt = new Date();
    
    if (verificationNote) {
      petition.verificationNote = verificationNote;
    }

    // Add to timeline
    petition.timeline.push({
      status: verified ? 'verified' : 'unverified',
      date: new Date(),
      note: verificationNote,
      official: officialId
    });

    await petition.save();

    // Get official details
    const official = await User.findById(officialId).select('name department position');

    // Create admin log
    const action = verified ? 'Verified petition' : 'Marked petition as invalid';
    await logAdminAction(
      action,
      petition.creator._id,
      petition._id,
      null,
      {
        petitionTitle: petition.title,
        verified: verified,
        verificationNote: verificationNote,
        officialId: officialId,
        officialName: official?.name || 'Official',
        officialDepartment: official?.department || 'N/A',
        officialPosition: official?.position || 'N/A'
      }
    );

    res.json({
      success: true,
      message: verified ? 'Petition verified successfully' : 'Petition marked as invalid',
      petition
    });

  } catch (error) {
    console.error('Verify petition error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying petition',
      error: error.message
    });
  }
};

// Add official response
export const addOfficialResponse = async (req, res) => {
  try {
    const { petitionId } = req.params;
    const { message, type, isPublic } = req.body;
    const officialId = req.user?.id;

    // Verify user is public official
    if (req.user.role !== 'public-official' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only public officials can add responses'
      });
    }

    const petition = await Petition.findById(petitionId).populate('creator', 'name email');
    
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Create official response
    const response = new OfficialResponse({
      petition: petitionId,
      official: officialId,
      message,
      type: type || 'general_response',
      isPublic: isPublic !== undefined ? isPublic : true
    });

    await response.save();
    await response.populate('official', 'name department position');

    // Get official details
    const official = await User.findById(officialId).select('name department position');

    // Create admin log
    await logAdminAction(
      'Added official response to petition',
      petition.creator._id,
      petition._id,
      null,
      {
        petitionTitle: petition.title,
        responseType: type,
        responseMessage: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        officialId: officialId,
        officialName: official?.name || 'Official',
        officialDepartment: official?.department || 'N/A',
        officialPosition: official?.position || 'N/A',
        isPublic: isPublic
      }
    );

    res.json({
      success: true,
      message: 'Official response added successfully',
      response
    });

  } catch (error) {
    console.error('Add official response error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding official response',
      error: error.message
    });
  }
};

// Get petitions for official review
export const getPetitionsForReview = async (req, res) => {
  try {
    const { status, category, location, limit = 50 } = req.query;

    const filter = {};
    
    // Only add status filter if explicitly provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') filter.category = category;
    if (location && location !== 'all') filter.location = { $regex: location, $options: 'i' };

    const petitions = await Petition.find(filter)
      .populate("creator", "name email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Add signature counts for each petition
    const petitionsWithCounts = await Promise.all(
      petitions.map(async (petition) => {
        const signatureCount = await Signature.countDocuments({ petition: petition._id });
        
        return {
          ...petition.toObject(),
          signaturesCount: signatureCount
        };
      })
    );

    res.json({
      success: true,
      petitions: petitionsWithCounts,
      count: petitionsWithCounts.length
    });
  } catch (error) {
    console.error("Get petitions for review error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching petitions for review",
      error: error.message 
    });
  }
};

// Get official responses for a petition
export const getOfficialResponses = async (req, res) => {
  try {
    const { petitionId } = req.params;

    const petition = await Petition.findById(petitionId)
      .populate('reviewedBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .populate('internalNotes.author', 'name email role');

    if (!petition) {
      return res.status(404).json({
        success: false,
        message: "Petition not found"
      });
    }

    const responses = {
      officialResponse: petition.officialResponse,
      reviewedBy: petition.reviewedBy,
      reviewedAt: petition.reviewedAt,
      verified: petition.verified,
      verifiedBy: petition.verifiedBy,
      verifiedAt: petition.verifiedAt,
      verificationNote: petition.verificationNote,
      timeline: petition.timeline || [],
      internalNotes: petition.internalNotes || []
    };

    res.json({
      success: true,
      responses,
      petition: {
        _id: petition._id,
        title: petition.title,
        status: petition.status
      }
    });
  } catch (error) {
    console.error("Get official responses error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching official responses",
      error: error.message 
    });
  }
};

// Get petition signatures
export const getPetitionSignatures = async (req, res) => {
  try {
    const petitionId = req.params.id;

    // Validate petition exists
    const petition = await Petition.findById(petitionId);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: 'Petition not found'
      });
    }

    // Get signatures with user details
    const signatures = await Signature.find({ petition: petitionId })
      .populate('user', 'name email location')
      .sort({ createdAt: -1 });

    const signatureCount = signatures.length;

    res.json({
      success: true,
      signatures,
      count: signatureCount,
      petition: {
        _id: petition._id,
        title: petition.title,
        signatureGoal: petition.signatureGoal
      }
    });

  } catch (error) {
    console.error('Get petition signatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching petition signatures',
      error: error.message
    });
  }
};

// Update petition
export const updatePetition = async (req, res) => {
  try {
    const petitionId = req.params.id;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const petition = await Petition.findById(petitionId);
    if (!petition) {
      return res.status(404).json({
        success: false,
        message: "Petition not found"
      });
    }

    // Check if user is the creator
    if (petition.creator.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the petition creator can edit this petition"
      });
    }

    // Only allow editing certain fields
    const allowedUpdates = ['title', 'description', 'category', 'location', 'signatureGoal'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(petition, updates);
    await petition.save();

    // Get updated petition with signature count
    const signatureCount = await Signature.countDocuments({ petition: petition._id });

    res.json({ 
      success: true,
      message: "Petition updated successfully", 
      petition: {
        ...petition.toObject(),
        signaturesCount: signatureCount
      }
    });
  } catch (error) {
    console.error("Error updating petition:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating petition", 
      error: error.message 
    });
  }
};

// Search petitions
export const searchPetitions = async (req, res) => {
  try {
    const { query, location, category, status } = req.query;
    
    let filter = {};
    
    // Text search
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ];
    }
    
    // Additional filters
    if (location && location !== 'All Locations') {
      filter.location = location;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const petitions = await Petition.find(filter)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    
    // Add signature counts
    const petitionsWithCounts = await Promise.all(
      petitions.map(async (petition) => {
        const signatureCount = await Signature.countDocuments({ petition: petition._id });
        return {
          ...petition.toObject(),
          signaturesCount: signatureCount
        };
      })
    );
    
    res.json({
      success: true,
      results: petitionsWithCounts,
      count: petitionsWithCounts.length
    });
  } catch (error) {
    console.error('Search petitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching petitions',
      error: error.message
    });
  }
};