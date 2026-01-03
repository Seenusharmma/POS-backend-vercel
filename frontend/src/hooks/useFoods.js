import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import API_BASE from "../config/api";

const fetchFoods = async () => {
  const { data } = await axios.get(`${API_BASE}/api/foods`);
  return data;
};

export const useFoods = () => {
  return useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch just because user clicked window
  });
};
