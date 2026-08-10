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

        // No `response` means the request never reached the server at all —
        // connection refused, CORS rejection, timeout, or an aborted request.
        // There is no token to refresh in that case, so surface the real error.
        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

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
                // Plain `axios`, not `axiosInstance`: if the refresh call itself
                // returns 401 it would re-enter this interceptor as a fresh
                // request (no `_retry` flag) and recurse until the stack blows.
                await axios.post(
                    `${process.env.NEXT_PUBLIC_SERVER_URI}/api/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                isRefreshing = false;
                onRefreshSuccess();

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];
                handleLogout();
                // Without this the interceptor resolves with `undefined`, so
                // callers reading `res.data` crash instead of seeing the error.
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance