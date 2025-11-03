import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001", // your BAP backend
});

// Send a search request to backend
export const searchEnergyDealers = async (query) => {
  console.log("Searched text in api.js: ", query);
  
  const response = await API.post("/search", { searchTerm: query });
  console.log("API posted", API);
  console.log("query value posted", query);
  
  return response.data;
};
