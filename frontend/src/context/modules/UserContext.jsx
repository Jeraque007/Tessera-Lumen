import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("tl_user");
      return saved ? JSON.parse(saved) : { name: "", email: "", dob: "" };
    } catch (e) { return { name: "", email: "", dob: "" }; }
  });

  useEffect(() => {
    localStorage.setItem("tl_user", JSON.stringify(user));
  }, [user]);

  const logout = () => {
    setUser({ name: "", email: "", dob: "" });
    localStorage.removeItem("tl_user");
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
