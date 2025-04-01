import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

export const fetchFranceData = async () => {
  try {
    // Try to fetch from the API endpoint
    const response = await API.get("/france");
    return response.data;
  } catch (error) {
    // If API fails, try to fetch the aggregated JSON file directly
    console.error("Error fetching France data from API:", error);

    try {
      // Fallback to fetching the aggregated JSON file from the correct path
      const jsonResponse = await fetch("output/fr-aggregated.json");
      if (!jsonResponse.ok) {
        throw new Error(
          `Failed to fetch aggregated JSON: ${jsonResponse.status} ${jsonResponse.statusText}`
        );
      }

      const data = await jsonResponse.json();
      if (!data || !data.months) {
        throw new Error("Invalid data format in aggregated JSON");
      }

      return data;
    } catch (jsonError) {
      console.error("Error fetching France aggregated JSON:", jsonError);
      throw jsonError;
    }
  }
};

export const fetchGermanyData = async () => {
  try {
    const response = await API.get("/germany");
    return response.data;
  } catch (error) {
    console.error("Error fetching Germany data:", error);
    throw error;
  }
};

export const fetchUKData = async () => {
  try {
    const response = await API.get("/uk");
    return response.data;
  } catch (error) {
    console.error("Error fetching UK data:", error);
    throw error;
  }
};

export default API;
