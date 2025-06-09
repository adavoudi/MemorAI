"use client";

import Link from "next/link";
import {
  Flex,
  Heading,
  Button,
  Menu,
  MenuItem,
  useTheme,
  View,
} from "@aws-amplify/ui-react";
import { FaUserCircle } from "react-icons/fa"; // Using react-icons for a user icon
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function Header() {
  const { tokens } = useTheme();
  const { user, signOut } = useAuthenticator();

  const navLinks = [
    { href: "/search", label: "Search" },
    { href: "/deck", label: "Decks" },
    { href: "/review", label: "Review" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <View
      as="header"
      width="100%"
      padding={`0 ${tokens.space.medium}`}
      //   boxShadow={tokens.shadows.small}
      backgroundColor={tokens.colors.background.secondary}
    >
      <Flex
        as="nav"
        alignItems="center"
        justifyContent="space-between"
        height="5rem" // A common height for headers
        maxWidth="1280px" // Or your preferred max width
        margin="0 auto"
      >
        {/* App Logo/Name */}
        <Link href="/" passHref style={{ textDecoration: "none" }}>
          <Heading level={3} color={tokens.colors.font.primary}>
            MemorAI
          </Heading>
        </Link>

        {/* Navigation Links */}
        <Flex as="ul" gap={tokens.space.large} style={{ listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                passHref
                style={{
                  textDecoration: "none",
                  //   color: tokens.colors.font.secondary,
                  //   fontWeight: tokens.fontWeights.bold,
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </Flex>

        {/* User Menu */}
        {user && (
          <Menu
            trigger={
              <Button variation="link" size="large">
                <FaUserCircle size="24" />
              </Button>
            }
          >
            <MenuItem isDisabled>
              {user.signInDetails?.loginId || "Welcome"}
            </MenuItem>
            <MenuItem onClick={signOut}>Sign Out</MenuItem>
          </Menu>
        )}
      </Flex>
    </View>
  );
}
