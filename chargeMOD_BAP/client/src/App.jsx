import React, { useState } from "react";
import { searchEnergyDealers } from "./services/api";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchEnergyDealers(query);
      console.log("Text entered in App.jsx: ", query);
      setResults(data); // backend already returns an array
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-blue-700 mb-6">
        Energy Dealer Search (BAP Demo)
      </h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for solar, wind, etc."
          className="border rounded-lg px-3 py-2 w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />  
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(results) ? (
          results.map((dealer, index) => (
            <div key={index} className="bg-white shadow rounded-xl p-4">
              <h3 className="text-lg font-semibold">{dealer.name}</h3>
              <p className="text-gray-600 text-sm">Type: {dealer.type}</p>
              <p className="text-gray-600 text-sm">
                Energy Available: {dealer.energy} kWh
              </p>
            </div>
          ))
        ) : (
          <div>No results found</div>
        )}
      </div>
    </div>
  );
}

export default App;
