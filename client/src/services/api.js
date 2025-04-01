import axios from "axios";

const API = axios.create({
  baseURL: "/api",
});

export const fetchFranceData = async () => {
  try {
    const response = await API.get("/france");
    return response.data;
  } catch (error) {
    console.error("Error fetching France data:", error);
    throw error;
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
