import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance"

//fetch sellerData
const fetchSeller = async () => {
    const { data } = await axiosInstance.get("/api/logged-in-seller")
    if (data.success) {
        return data.seller;
    }

}


const useSeller = () => {
    const {
        data: seller,
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ["seller"],
        queryFn: fetchSeller,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    })
    return {
        seller,
        isLoading,
        isError,
        refetch
    }
}

export default useSeller