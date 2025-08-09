
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:4000' });
export const fetchScores = () => api.get('/scores').then(r => r.data.scores);
export const verifyText = text => api.post('/verify', { content: text }).then(r => r.data);