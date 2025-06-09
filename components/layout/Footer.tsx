"use client";

import {
  Flex,
  Text,
  View,
  useTheme,
  Link as AmplifyLink,
} from "@aws-amplify/ui-react";
import Link from "next/link";

export default function Footer() {
  const { tokens } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <View
      as="footer"
      width="100%"
      padding={`${tokens.space.large} ${tokens.space.medium}`}
      backgroundColor={tokens.colors.background.tertiary}
      marginTop="auto" // Pushes the footer to the bottom in a flex layout
    >
      <Flex
        direction={{ base: "column", medium: "row" }}
        justifyContent="space-between"
        alignItems="center"
        gap={tokens.space.medium}
        maxWidth="1280px"
        margin="0 auto"
      >
        <Text
          fontSize={tokens.fontSizes.small}
          color={tokens.colors.font.tertiary}
        >
          &copy; {currentYear} MemorAI. All Rights Reserved.
        </Text>
        <Flex
          as="ul"
          gap={tokens.space.large}
          style={{ listStyle: "none", padding: 0 }}
        >
          {/* Example links - you can create pages for these later */}
          <li>
            <Link href="/about" passHref legacyBehavior>
              <AmplifyLink>About</AmplifyLink>
            </Link>
          </li>
          <li>
            <Link href="/privacy" passHref legacyBehavior>
              <AmplifyLink>Privacy Policy</AmplifyLink>
            </Link>
          </li>
        </Flex>
      </Flex>
    </View>
  );
}
