"use client";

import { Card, Flex, Heading, Text, Icon, View } from "@aws-amplify/ui-react";
import { IconType } from "react-icons"; // Allows passing any react-icon as a prop
import { MdEmail, MdPhone } from "react-icons/md";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconType;
}

export default function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <Card variation="elevated" flex="1" minWidth="200px">
      <Flex alignItems="center" gap="large">
        <Icon as={icon} width="1" height="1" color="brand.primary.80" />
        <Flex direction="column">
          <Text color="font.secondary">{title}</Text>
          <Heading level={3}>{value}</Heading>
        </Flex>
      </Flex>
    </Card>
  );
}
