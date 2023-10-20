import axios from 'axios';

export const postToAPI = async (dataToSend: any): Promise<string> => {
  const authKey = 'your-secret-auth-key';
  const url = 'https://treadmill.mikebush.org';
  dataToSend.timestamp = new Date().toISOString();
  try {
    const response = await axios.post(url + '/data', dataToSend, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: authKey,
      },
    });
    return response.data.message; // or whatever response field you want to return
  } catch (error) {
    console.error('Error posting data:', error);
    return 'Failed to post data.';
  }
};
