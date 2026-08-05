import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("tl_user");
      return saved ? JSON.parse(saved) : { name: "", email: "", dob: "" };
    } catch (e) { return { name: "", email: "", dob: "" }; }
  });

  const [uploadedImage, setUploadedImage] = useState(() => {
    try { return localStorage.getItem("tl_uploaded_image") || null; } catch (e) { return null; }
  });

  useEffect(() => {
    localStorage.setItem("tl_user", JSON.stringify(user));
    if (uploadedImage) localStorage.setItem("tl_uploaded_image", uploadedImage);
    else localStorage.removeItem("tl_uploaded_image");
  }, [user, uploadedImage]);

  const logout = () => {
    setUser({ name: "", email: "", dob: "" });
    setUploadedImage(null);
    localStorage.removeItem("tl_user");
    localStorage.removeItem("tl_uploaded_image");
  };

  return (
    <UserContext.Provider value={{ user, setUser, uploadedImage, setUploadedImage, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
