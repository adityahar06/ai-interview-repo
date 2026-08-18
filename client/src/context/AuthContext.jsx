import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
// When a user visits your site, this useEffect runs immediately. It checks the browser's localStorage (a small piece of memory in the user's browser).
// This is the secret JWT (JSON Web Token) that proves the user is authenticated.
// This is usually a basic JSON string containing the user's name and email, saved so the app can load the UI instantly without waiting for the database.
  useEffect(() => {
    const token = localStorage.getItem('ai-interview-token');
    const savedUser = localStorage.getItem('ai-interview-user');
// If the app finds both a token and user data in local storage, it immediately updates the user state.
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify token is still valid
        //Even though the app loaded instantly using the saved data, it cannot trust local storage blindly. What if the token expired yesterday? What if the user was banned?
        // It fires a silent request (authAPI.getMe()) to your backend server. The backend looks at the token and verifies it
        authAPI.getMe()
          .then(res => setUser(res.data.user))
          .catch(() => logout())
          .finally(() => setLoading(false));
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);
// When a user types in their email and password and hits "Submit", your backend sends back a secure token and their userData. This function handles saving them.
// localStorage.setItem permanently saves the token and user data to the browser. (JSON.stringify is 
// required because localStorage can only hold plain text strings, not JavaScript objects). 
// By doing this, the user won't get logged out if they accidentally close the tab.
  const login = (token, userData) => {
    localStorage.setItem('ai-interview-token', token);
    localStorage.setItem('ai-interview-user', JSON.stringify(userData));
// setUser(userData) instantly updates React's memory. This tells your entire app: "Hey! Someone just logged in. Change the 'Login' button in the navbar to say 'My Dashboard'."
    setUser(userData);
  };

  const logout = () => {
    // localStorage.removeItem deletes the secure token and the saved user data from the browser.
    localStorage.removeItem('ai-interview-token');
    localStorage.removeItem('ai-interview-user');
    // now there si no user
    setUser(null);
  };

  const updateUser = (updatedData) => {
    //takes all the old user data (like their email, role, and ID) and merges it with the new data (their new name). If you didn't do this, updating their name might accidentally delete their email from React's memory!
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('ai-interview-user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
