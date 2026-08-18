import axios from 'axios';
// I configured the baseURL dynamically using Vite's environment variables (import.meta.env). 
// You are coding on your laptop. You have a .env file with VITE_API_URL=http://localhost:5000/api. When you run the app, every request starts with http://localhost:5000/api
//You upload your code to Vercel. In Vercel's dashboard, you set VITE_API_URL=https://my-backend.onrender.com/api. Without changing a single line of code, the app now points to the live server.
//If you forget to set the variable, and your frontend is hosted at www.myinterviewapp.com, the app will automatically try to fetch data from www.myinterviewapp.com/api.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
// this is used for authentication API to tokens
//The config parameter represents the "envelope" of the API call you are about to make. 
// It contains the URL, the data you are sending, and the headers. The interceptor catches 
// this envelope before it goes out.
API.interceptors.request.use((config) => {
  //While the request is paused, the code looks into the browser's localStorage to see if the
  //  user is currently logged in. If they are, it grabs their secret JWT (JSON Web Token).
  const token = localStorage.getItem('ai-interview-token');
  // If a token is found, we need to prove to the backend server that we are allowed to access private data.
  //We do this by attaching the token to the Authorization header.
 // Why the word Bearer? This is a strict internet security standard. It basically tells the server: "Grant access to the bearer (the person holding) this exact token."
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally
// this handle when What happens if the user's login token expires while they are using the app?
//Every single time your app talks to the backend, this code intercepts the message.
// It grabs your secret JWT (JSON Web Token) from storage.
//It stamps Authorization: Bearer <token> onto the request headers.
//Bearer is the rule you are telling the server to use ("Let this person in because they are holding this token").
// So when you write Authorization: Bearer <Your_JWT>, you are saying: "I am presenting a ticket (Bearer) and here is the ticket itself (the JWT)."
API.interceptors.response.use(
  //The first one handles success. If the backend says, "Everything is fine, here is your data (200 OK)", 
  // this line just takes the response and passes it straight through to your React components 
  // without touching it.
  (response) => response,
  // now if any error comes
  (error) => {
     //If a user leaves their laptop open all weekend, their token might expire. When they finally click 
     // "View Dashboard" on Monday, the backend looks at their expired token and rejects it with 
     // a 401 error.
    if (error.response?.status === 401) {
      // It deletes the expired token from the browser.
      localStorage.removeItem('ai-interview-token');
      // removes the user 
      localStorage.removeItem('ai-interview-user');
      // It forces the browser window to instantly redirect to the /login page so they can sign in again.
      // We use window.location.href here instead of React Router's Maps() because Axios lives outside of React. 
      // Standard JavaScript files cannot use React Hooks!
      // as this interceptor part is  written in the .js part not in the react part so we used winodws.location.href
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Interview
export const interviewAPI = {
  start: (data) => API.post('/interview/start', data),
  submitAnswer: (data) => API.post('/interview/answer', data),
  complete: (data) => API.post('/interview/complete', data),
  getHistory: () => API.get('/interview/history'),
  getById: (id) => API.get(`/interview/${id}`),
};

// Report
export const reportAPI = {
  getAll: () => API.get('/report'),
  getById: (id) => API.get(`/report/${id}`),
};

export default API;
