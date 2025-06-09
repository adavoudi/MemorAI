"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Flex, TextField, Button, Icon } from "@aws-amplify/ui-react";
import { MdSearch } from "react-icons/md";

interface SearchBarProps {
  // Pass the initial search query if the bar is on the results page
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (event: FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return; // Don't search if the query is empty
    }
    // Navigate to the search page with the query parameter
    router.push(`/search?query=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <Flex
      as="form"
      onSubmit={handleSearch}
      gap="small"
      width="100%"
      maxWidth="600px"
    >
      <TextField
        label="Search Phrase"
        // hideLabel
        placeholder="Enter an English phrase to translate..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="large"
        width="100%"
        hasError={false}
      />
      <Button type="submit" variation="primary" size="large">
        <Icon as={MdSearch} />
        Search
      </Button>
    </Flex>
  );
}
