import axios from 'axios';

// Replace with your local machine's IP address if running on emulator/device
const API_URL = 'http://10.0.2.2:8080/api/users';

const UserService = {
    searchUsers: async (query, currentUserId, token) => {
        try {
            const response = await axios.get(`${API_URL}/search`, {
                params: { query, currentUserId },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },

    uploadAvatar: async (userId, fileUri, token) => {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('file', {
            uri: fileUri,
            type: 'image/jpeg', // Adjust based on file type if needed
            name: 'avatar.jpg',
        });

        try {
            const response = await axios.post(`${API_URL}/upload-avatar`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },

    updateProfile: async (userId, fullName, token) => {
        try {
            const response = await axios.put(`${API_URL}/${userId}`, { fullName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }
};

export default UserService;
