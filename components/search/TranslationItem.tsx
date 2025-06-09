"use client";

import { Card, Flex, CheckboxField, Badge, Text } from "@aws-amplify/ui-react";

export interface Translation {
  type: "Formal" | "Informal";
  text: string;
}

interface TranslationItemProps {
  translation: Translation;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}

export default function TranslationItem({
  translation,
  isSelected,
  onSelectionChange,
}: TranslationItemProps) {
  const { type, text } = translation;

  return (
    <Card variation="elevated" width="100%">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex direction="column" gap="small">
          <Badge variation={type === "Formal" ? "info" : "success"}>
            {type}
          </Badge>
          <Text fontSize="large" fontWeight="bold">
            {text}
          </Text>
        </Flex>
        <CheckboxField
          label="Select"
          name={`select-${type}`}
          value={type}
          checked={isSelected}
          onChange={(e) => onSelectionChange(e.target.checked)}
          labelHidden
          size="large"
        />
      </Flex>
    </Card>
  );
}
