import { API_URLS } from '../config/apiConfig';
import axios, { getAxiosDebugContext, toApiErrorMessage } from './apiClient';

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
            console.error('AuthService login error:', getAxiosDebugContext(error));
            throw handleAxiosError(error);
        }
    },

    signup: async (user) => {
        try {
            const response = await axios.post(`${API_URL}/signup`, user);
            return response.data;
        } catch (error) {
            console.error('AuthService signup error:', getAxiosDebugContext(error));
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
        console.log('Error data:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
    }

    return toApiErrorMessage(error);
};

export default AuthService;
