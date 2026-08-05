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
  const [drawHistory, setDrawHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("tl_draw_history");
      return saved ? JSON.parse(saved) : { daily: { date: "", count: 0 }, monthly: { month: "", count: 0 } };
    } catch (e) { return { daily: { date: "", count: 0 }, monthly: { month: "", count: 0 } }; }
  });

  const [immutableReadings, setImmutableReadings] = useState(() => {
    try {
      const saved = localStorage.getItem("tl_immutable_readings");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem("tl_intention", intention);
    localStorage.setItem("tl_drawn_cards", JSON.stringify(drawnCards));
    localStorage.setItem("tl_selected_pkg", JSON.stringify(selectedPackage));
    localStorage.setItem("tl_draw_history", JSON.stringify(drawHistory));
    localStorage.setItem("tl_immutable_readings", JSON.stringify(immutableReadings.map(r => ({...r, export: { ...r.export, blob: null, dataUrl: null }}))));
  }, [intention, drawnCards, selectedPackage, drawHistory, immutableReadings]);

  const clearReading = () => {
    setIntention("");
    setDrawnCards([]);
    setSelectedPackage(null);
    setImmutableReadings([]);
  };

  return (
    <ReadingContext.Provider value={{
      intention, setIntention,
      drawnCards, setDrawnCards,
      selectedPackage, setSelectedPackage,
      drawHistory, setDrawHistory,
      immutableReadings, setImmutableReadings,
      clearReading
    }}>
      {children}
    </ReadingContext.Provider>
  );
}

export const useReading = () => useContext(ReadingContext);
