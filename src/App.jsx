import React from "react";
import { Routes, Route } from "react-router-dom";
import PollList from "./polls/PollList";
import PollDetail from "./polls/PollDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PollList />} />
      <Route path="/polldetail" element={<PollDetail />} />
    </Routes>
  );
}

export default App;
