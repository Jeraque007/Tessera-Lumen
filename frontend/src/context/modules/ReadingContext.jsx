import React, { createContext, useContext, useState, useEffect } from "react";

const ReadingContext = createContext(null);

export function ReadingProvider({ children }) {
  const [intention, setIntention] = useState(() => localStorage.getItem("tl_intention") || "");
  const [drawnCards, setDrawnCards] = useState(() => {
    const saved = localStorage.getItem("tl_drawn_cards");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPackage, setSelectedPackage] = useState(() => {
    const saved = localStorage.getItem("tl_selected_pkg");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("tl_intention", intention);
    localStorage.setItem("tl_drawn_cards", JSON.stringify(drawnCards));
    localStorage.setItem("tl_selected_pkg", JSON.stringify(selectedPackage));
  }, [intention, drawnCards, selectedPackage]);

  const clearReading = () => {
    setIntention("");
    setDrawnCards([]);
    setSelectedPackage(null);
  };

  return (
    <ReadingContext.Provider value={{
      intention, setIntention,
      drawnCards, setDrawnCards,
      selectedPackage, setSelectedPackage,
      clearReading
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

export const useReading = () => useContext(ReadingContext);
