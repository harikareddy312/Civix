import React, { useState } from "react";
import { Info, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function CreatePoll() {
  const [options, setOptions] = useState(["", ""]);

  const handleGoToCreate = () => {
    navigate("/create"); // go to CreatePoll.jsx
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const navigate = useNavigate();

const handleCreatePoll = () => {
  // later you can add API call here
  navigate("/"); // go back to PollList after creating
};


  return (
    <div className="w-full min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="w-[900px] bg-white p-10 rounded shadow">
        {/* Header */}
        <h1 className="text-xl font-semibold flex items-center mb-1">
           Create a New Poll
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Create a poll to gather community feedback on local issues.
        </p>

        {/* Poll Question */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Poll Question
          </label>
          <input
            type="text"
            placeholder="What do you want to ask the community?"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="mb-2">
          <label className="block text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            rows="3"
            placeholder="provide more context about poll."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <p className="text-xs text-gray-500 mb-8">
          Give community members enough information to make an informed choice.
        </p>

        {/* Poll Options */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Poll Options
          </label>
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2 focus:outline-none"
            />
          ))}

          <button
            type="button"
            onClick={addOption}
            className="flex items-center text-sm text-black border rounded px-3 py-1 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Option
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Add atleast 2 options, upto a maximum 10.
          </p>
        </div>

        {/* Target Location & Closes On */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Target Location
            </label>
            <input
              type="text"
              defaultValue="San Diego, CA"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              The area this poll is relevent to.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">
              Closes On
            </label>
            <input
              type="text"
              defaultValue="24 - 10 - 2025 "
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Choose when this poll will close(max 30days).
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-100 border border-yellow-300 rounded p-4 mb-8 flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <p className="text-sm text-gray-700">
            <span className="font-semibold">important information</span> <br />
            Polls should be designed to gather genuine community feedback on
            issues that affect your area. Polls that are misleading or designed
            to push a specific agenda may be removed.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
  <button
    onClick={handleCreatePoll}
    className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-6 py-2 rounded"
  >
    Create Poll
  </button>
     </div>

      </div>
    </div>
  );
}
