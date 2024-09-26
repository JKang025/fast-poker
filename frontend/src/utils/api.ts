import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export const login = async (username: string, password?: string) => {
    // Create the payload with password only if it's provided
    const payload: { username: string; password?: string } = { username };
    if (password) {
      payload.password = password;
    }
    console.log(`${API_URL}/users/login`)
    const response = await axios.post(`${API_URL}/users/login`, payload);

    return response.data.token;
  };
  

export const createGame = async (token: string) => {
  const response = await axios.post(
    `${API_URL}/games`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.gameId;
};

export const joinGame = async (gameId: string, token: string) => {
  const response = await axios.post(
    `${API_URL}/games/${gameId}/join`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
