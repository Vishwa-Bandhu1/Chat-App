import axios from 'axios';

import { API_URLS } from '../config/apiConfig';

const API_URL = API_URLS.AUTH;

// TEMPORARILY DISABLED — OTP Phone Auth
// import auth from '@react-native-firebase/auth';

const AuthService = {
    login: async (usernameOrEmail, password) => {
        try {
            const response = await axios.post(`${API_URL}/signin`, {
                usernameOrEmail,
                password
            });
            return response.data;
        } catch (error) {
            console.error('AuthService login error:', error);
            throw handleAxiosError(error);
        }
    },

    signup: async (user) => {
        try {
            const response = await axios.post(`${API_URL}/signup`, user);
            return response.data;
        } catch (error) {
            console.error('AuthService signup error:', error);
            throw handleAxiosError(error);
        }
    },

    // ==========================================================================
    // TEMPORARILY DISABLED — OTP Phone Auth Methods
    // ==========================================================================
    // signInWithPhoneNumber: async (phoneNumber) => {
    //     try {
    //         const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    //         return confirmation;
    //     } catch (error) {
    //         console.error('AuthService signInWithPhoneNumber error:', error);
    //         throw error;
    //     }
    // },
    //
    // verifyIdToken: async (phoneNumber, idToken) => {
    //     try {
    //         const response = await axios.post(`${API_URL}/verify-otp`, { phoneNumber, idToken });
    //         return response.data;
    //     } catch (error) {
    //         console.error('AuthService verifyIdToken error:', error);
    //         throw handleAxiosError(error);
    //     }
    // }
    // ==========================================================================
};

const handleAxiosError = (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error data:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);

        // Return descriptive error even if data is empty
        return error.response.data || `Server Error: ${error.response.status}`;
    } else if (error.request) {
        // The request was made but no response was received
        console.log('Error request:', error.request);
        return 'Network Error: No response received from server. Check if backend is running.';
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error message:', error.message);
        return error.message || 'Error setting up request';
    }
};

export default AuthService;
