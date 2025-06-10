"use client";

import DeckList from "@/components/deck/DeckList";
import { Flex } from "@aws-amplify/ui-react";
import "@/hooks/auth";

export default function DecksPage() {
  return (
    <Flex direction="column" gap="large">
      <DeckList />
    </Flex>
  );
}
