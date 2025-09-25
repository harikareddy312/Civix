import React, { useState } from "react";
import { Search, Bell, Menu, MapPin, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PollsList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleCreatePoll = () => {
    navigate("/polldetail"); // go to PollDetail page
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between bg-blue-600 text-white px-4 py-3">
        <div className="flex items-center space-x-2">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-lg">CIVIX</span>
          <span className="bg-yellow-400 text-xs text-black font-semibold px-2 py-0.5 rounded">
            Beta
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="search text"
              className="rounded-full pl-10 pr-4 py-1 text-black text-sm w-48 md:w-64"
            />
            <Search className="w-4 h-4 absolute top-2 left-3 text-gray-500" />
          </div>
          <Bell className="w-5 h-5 cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
            Z
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block w-56 bg-gray-50 border-r min-h-screen p-4">
          <SidebarContent />
        </aside>

        {/* Sidebar (Mobile Drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-white shadow-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">CIVIX</span>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
            <div
              className="flex-1 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            ></div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Title and Create Poll */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h1 className="font-semibold text-lg">Polls</h1>
            <button
              onClick={handleCreatePoll}
              className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-6 py-2 rounded"
            >
              + Create Poll
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Participate in community polls and make your voice heard.
          </p>

          {/* Tabs + Location */}
          <div className="flex flex-wrap items-center justify-between border rounded px-4 py-2 mb-6 bg-gray-50">
            <div className="flex space-x-2 text-sm font-medium">
              <button className="px-3 py-1 rounded bg-gray-200">
                Active Polls
              </button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">
                Polls I Voted On
              </button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">
                My Polls
              </button>
              <button className="px-3 py-1 rounded hover:bg-gray-100">
                Closed Polls
              </button>
            </div>
            <div className="flex items-center text-sm text-gray-700 border rounded px-3 py-1 cursor-pointer">
              <MapPin className="w-4 h-4 mr-1 text-red-500" />
              San Diego, CA
            </div>
          </div>

          {/* Empty State */}
          <div className="border rounded-lg p-10 text-center text-gray-600 mb-6">
            <p className="mb-4">No polls found with the current filters.</p>
            <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
              Clear Filters
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-100 border border-blue-300 rounded p-6 text-center">
            <h2 className="font-semibold mb-2">
              Have a question for your community?
            </h2>
            <p className="text-sm text-gray-700">
              Create a poll to gather input and understand public sentiment on
              local issues.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent() {
  return (
    <div>
      <div className="mb-6">
        <div className="w-12 h-12 rounded-full border flex items-center justify-center text-lg font-semibold">
          Z
        </div>
        <p className="mt-2 font-medium">Zunaira</p>
        <p className="text-xs text-gray-500">Verified Account</p>
        <p className="text-xs text-gray-500 flex items-center">
          <MapPin className="w-3 h-3 mr-1" /> Kolkata
        </p>
        <p className="text-xs text-gray-500">zunaira12@gmail.com</p>
      </div>

      <nav className="space-y-2 text-sm">
        <p className="cursor-pointer hover:text-blue-600">Dashboard</p>
        <p className="cursor-pointer hover:text-blue-600">Petitions</p>
        <p className="cursor-pointer text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Polls
        </p>
        <p className="cursor-pointer hover:text-blue-600">Officials</p>
        <p className="cursor-pointer hover:text-blue-600">Reports</p>
        <p className="cursor-pointer hover:text-blue-600">Settings</p>
        <p className="cursor-pointer hover:text-blue-600">Help & Support</p>
      </nav>
    </div>
  );
}
