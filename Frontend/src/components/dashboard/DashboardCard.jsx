import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PollIcon from '@mui/icons-material/Poll';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BarChartIcon from '@mui/icons-material/BarChart';
import petitionService from '../../services/petitionService';
import { pollService } from '../../services/pollService';
import { getCurrentUserId } from '../../utils/auth';

export default function DashboardCard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [pollsLoading, setPollsLoading] = useState(true);
    const userId = getCurrentUserId();

    // Responsive: detect mobile
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth <= 600 : false
    );

    useEffect(() => {
        const handleResize = () =>
            setIsMobile(typeof window !== 'undefined' ? window.innerWidth <= 600 : false);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Petitions state
    const [allPetitions, setAllPetitions] = useState([]);
    
    // Polls state
    const [allPolls, setAllPolls] = useState([]);
    const [pollStats, setPollStats] = useState({
        myPolls: 0,
        activePolls: 0,
        completedPolls: 0,
        totalPolls: 0
    });

    // Fetch petitions data
    useEffect(() => {
        const fetchAllPetitionsForStats = async () => {
            try {
                setLoading(true);
                const data = await petitionService.getAllPetitions();
                setAllPetitions(data.petitions || data);
            } catch (err) {
                console.error("Error fetching all petitions for stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllPetitionsForStats();
    }, []);

    // Fetch polls data with real-time updates
    const fetchPollsData = async (showLoading = true) => {
        try {
            if (showLoading) setPollsLoading(true);
            
            const data = await pollService.getPolls();
            const pollsArray = Array.isArray(data) ? data : data.polls || [];
            
            // Transform polls data to include vote counts
            const transformedPolls = pollsArray.map(poll => {
                let totalVotes = 0;
                
                // Calculate total votes from different data structures
                if (poll.votes) {
                    if (Array.isArray(poll.votes)) {
                        totalVotes = poll.votes.length;
                    } else if (typeof poll.votes === 'object') {
                        totalVotes = Object.values(poll.votes).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0);
                    }
                }
                
                return {
                    ...poll,
                    totalVotes: poll.totalVotes || totalVotes
                };
            });
            
            setAllPolls(transformedPolls);
            
            // Calculate dynamic stats - FIXED LOGIC matching petitions
            const myPollsCount = transformedPolls.filter(poll => {
                // Use the same logic as petitions: check creator._id
                const pollCreatorId = poll.creator?._id;
                return pollCreatorId === userId;
            }).length;
            
            const activePollsCount = transformedPolls.filter(poll => 
                poll.status === 'active' || poll.status === 'Active'
            ).length;
            
            const completedPollsCount = transformedPolls.filter(poll => 
                poll.status === 'closed' || poll.status === 'completed' || poll.status === 'Completed'
            ).length;
            
            // Update stats state
            setPollStats({
                myPolls: myPollsCount,
                activePolls: activePollsCount,
                completedPolls: completedPollsCount,
                totalPolls: transformedPolls.length
            });
            
        } catch (err) {
            console.error("Error fetching all polls for stats:", err);
        } finally {
            if (showLoading) setPollsLoading(false);
        }
    };

    // Initial fetch and auto-refresh setup
    useEffect(() => {
        fetchPollsData();

        // Auto-refresh polls every 30 seconds for real-time updates
        const pollInterval = setInterval(() => {
            fetchPollsData(false); // Don't show loading for background updates
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [userId]);

    // Calculate petition stats - SAME LOGIC as before
    const myPetitionsCount = allPetitions.filter(p => p.creator?._id === userId).length;
    const successfulPetitionsCount = allPetitions.filter(p => 
        p.status === 'closed' || p.status === 'successful' || p.status === 'under_review'
    ).length;
    const activePetitionsCount = allPetitions.filter(p => p.status === 'active').length;

    // Navigation handlers
    const handleViewAllPetitions = () => {
        navigate('/dashboard/petitions');
    };

    const handleCreatePetition = () => {
        navigate('/dashboard/petitions/create');
    };

    const handleViewMyPolls = () => {
        navigate('/dashboard/polls/my');
    };

    const handleViewActivePolls = () => {
        navigate('/dashboard/polls');
    };

    const handleViewCompletedPolls = () => {
        navigate('/dashboard/polls/completed');
    };

    const handleCreatePoll = () => {
        navigate('/dashboard/polls/create');
    };

    return (
      <>
        {/* Petitions Stats Cards */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Petitions Overview</h3>
          <div className={isMobile ? "flex flex-col gap-4" : "flex flex-row gap-8"}>
            {/* My Petitions */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#e3f2fd', color: '#111' }}
              onClick={() => navigate('/dashboard/petitions')}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">My Petitions</span>
                <span>
                  <EditIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1">{loading ? '...' : myPetitionsCount}</span>
              <span className="text-sm opacity-60">created by you</span>
            </div>

            {/* Active Petitions */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#e8f5e8', color: '#111' }}
              onClick={handleViewAllPetitions}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">Active Petitions</span>
                <span>
                  <TrendingUpIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1">{loading ? '...' : activePetitionsCount}</span>
              <span className="text-sm opacity-60">collecting signatures</span>
            </div>

            {/* Successful Petitions */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#fff3e0', color: '#111' }}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">Successful</span>
                <span>
                  <CheckCircleIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1">{loading ? '...' : successfulPetitionsCount}</span>
              <span className="text-sm opacity-60">completed or under review</span>
            </div>
          </div>
        </div>

        {/* Polls Stats Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Polls Overview</h3>
          </div>
          
          <div className={isMobile ? "flex flex-col gap-4" : "flex flex-row gap-8"}>
            {/* My Polls */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#e8f5e8', color: '#111' }}
              onClick={handleViewMyPolls}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">My Polls</span>
                <span>
                  <PollIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1" key={`my-polls-${pollStats.myPolls}`}>
                {pollsLoading ? '...' : pollStats.myPolls}
              </span>
              <span className="text-sm opacity-60">created by you</span>
            </div>

            {/* Active Polls */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#e0f2f1', color: '#111' }}
              onClick={handleViewActivePolls}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">Active Polls</span>
                <span>
                  <HowToVoteIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1" key={`active-polls-${pollStats.activePolls}`}>
                {pollsLoading ? '...' : pollStats.activePolls}
              </span>
              <span className="text-sm opacity-60">currently voting</span>
            </div>

            {/* Completed Polls */}
            <div 
              className="flex flex-col justify-center rounded-2xl shadow-lg flex-1 p-6 text-left cursor-pointer hover:shadow-xl transition-shadow" 
              style={{ background: '#f1f8e9', color: '#111' }}
              onClick={handleViewCompletedPolls}
            >
              <div className="flex flex-row items-center justify-between w-full mb-2">
                <span className="text-lg font-semibold">Completed Polls</span>
                <span>
                  <BarChartIcon style={{ fontSize: 32 }} />
                </span>
              </div>
              <span className="text-3xl font-bold mb-1" key={`completed-polls-${pollStats.completedPolls}`}>
                {pollsLoading ? '...' : pollStats.completedPolls}
              </span>
              <span className="text-sm opacity-60">finished voting</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Petition */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  Start a Petition
                </h4>
                <p className="text-gray-600 text-sm">
                  Gather support from your community for important causes
                </p>
              </div>
              <button
                onClick={handleCreatePetition}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Petition 
              </button>
            </div>
          </div>

          {/* Create Poll */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-lg">
                  Create a Poll
                </h4>
                <p className="text-gray-600 text-sm">
                  Get community opinions on important decisions
                </p>
              </div>
              <button
                onClick={handleCreatePoll}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Create Poll 
              </button>
            </div>
          </div>
        </div>

        {/* Community Engagement Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="text-center">
            <h4 className="font-bold text-gray-900 mb-3 text-xl">
              Make Your Voice Heard
            </h4>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of citizens making a difference in their communities. Whether it's through petitions or polls, 
              every voice matters in building a better future together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleViewAllPetitions}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Browse All Petitions
              </button>
              <button
                onClick={handleViewActivePolls}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                Participate in Polls
              </button>
            </div>
          </div>
        </div>
      </>
    );
}
