"use client";

import { useState } from "react";
import { SearchResult } from "@/types";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([
    { id: 1, text: "", label: "Formal", checked: false },
    { id: 2, text: "", label: "Informal", checked: false },
  ]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
      setResults([
        {
          id: 1,
          text: `Formal response for: ${searchQuery}`,
          label: "Formal",
          checked: false,
        },
        {
          id: 2,
          text: `Informal response for: ${searchQuery}`,
          label: "Informal",
          checked: false,
        },
      ]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCheckboxChange = (id: number) => {
    setResults(
      results.map((result) =>
        result.id === id ? { ...result, checked: !result.checked } : result
      )
    );
  };

  const handleTextChange = (id: number, newText: string) => {
    setResults(
      results.map((result) =>
        result.id === id ? { ...result, text: newText } : result
      )
    );
  };

  const handleAddMore = () => {
    // Add logic for adding more results
    console.log("Add more results");
  };

  return {
    searchQuery,
    setSearchQuery,
    showResults,
    results,
    handleSearch,
    handleKeyPress,
    handleCheckboxChange,
    handleTextChange,
    handleAddMore,
  };
}
