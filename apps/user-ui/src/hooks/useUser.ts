import { useQuery } from "@tanstack/react-query"
import axiosInstance from "../utils/axiosInstance";

//fetch userData
const fetchUser = async () => {
    const { data } = await axiosInstance.get("/api/logged-in-user")
    if (data.success) {
        return data.user;
    }

}


const useUser = () => {
    const {
        data: user,
        isLoading,
        isError,
        refetch
    } = useQuery({
        queryKey: ["user"],
        queryFn: fetchUser,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    })
    return {
        user,
        isLoading,
        isError,
        refetch
    }
}

export default useUser