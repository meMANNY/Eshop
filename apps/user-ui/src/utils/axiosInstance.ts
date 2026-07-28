import axios from 'axios';
//logic for refreshing access token via axios interceptor. This is some new shit!
// Request A ───────────────┐
//                          │
// Request B ───────401─────┤
//                          │
// Request C ───────401─────┤
//                          │
//                  isRefreshing?
//                          │
//                  false ──┴──► Request A refreshes token
//                          │
//                   true for B and C
//                          │
//         B and C are added to refreshSubscribers
//                          │
//               Refresh succeeds
//                          │
//           onRefreshSuccess()
//                          │
//      retry B    retry C
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URI,
    withCredentials: true,
})

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const handleLogout = async () => {
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const subscribeTokenRefresh = (callback: () => void) => {
    refreshSubscribers.push(callback);
};

const onRefreshSuccess = () => {
    refreshSubscribers.forEach((callback) => callback());
    refreshSubscribers = [];
};
//handle api requests
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);
//handle expired tokens and refresh logic
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        //originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }
            isRefreshing = true;
            originalRequest._retry = true;

            //const refreshToken = localStorage.getItem('refresh_token');

            try {
                await axiosInstance.post(
                    `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token-user`,
                    {},
                    { withCredentials: true }
                );

                isRefreshing = false;
                onRefreshSuccess();

                return axiosInstance(originalRequest);
            } catch (error) {
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();

            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance