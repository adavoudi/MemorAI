"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flex,
  Heading,
  Button,
  Menu,
  MenuItem,
  useTheme,
  View,
  Badge,
  Icon,
  Divider,
} from "@aws-amplify/ui-react";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { useAuthenticator } from "@aws-amplify/ui-react";

// --- New Notification Feature ---
interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  link?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    message: 'Your review file for "Business Travel" is ready.',
    isRead: false,
    link: "/review",
  },
  {
    id: "n2",
    message: 'You have 15 cards due in "Restaurant Phrases".',
    isRead: true,
    link: "/review",
  },
];
// --- End Notification Feature ---

export default function Header() {
  const { tokens } = useTheme();
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // --- Notification State ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    // In a real app, you would fetch notifications from an API
    // and potentially use WebSockets for real-time updates.
    setNotifications(mockNotifications);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(
      notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    // API call would go here: await markNotificationAsRead(notificationId);
  };
  // --- End Notification State ---

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
      // boxShadow={tokens.shadows.small}
      backgroundColor={tokens.colors.background.secondary}
    >
      <Flex
        as="nav"
        alignItems="center"
        justifyContent="space-between"
        height="5rem"
        maxWidth="1280px"
        margin="0 auto"
      >
        <Link href="/" passHref style={{ textDecoration: "none" }}>
          <Heading level={3} color={tokens.colors.font.primary}>
            MemorAI
          </Heading>
        </Link>

        <Flex as="ul" gap={tokens.space.large} style={{ listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                passHref
                style={{
                  textDecoration: "none",
                  // color: tokens.colors.font.secondary,
                  // fontWeight: tokens.fontWeights.bold,
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </Flex>

        {/* --- Updated Right-side Menu --- */}
        {user && (
          <Flex alignItems="center" gap="medium">
            {/* Notification Bell Menu */}
            <Menu
              trigger={
                <Button variation="link" size="large" position="relative">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge
                      variation="info"
                      position="absolute"
                      size="small"
                      top="0"
                      right="0"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              }
            >
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <MenuItem
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id)}
                    style={{ fontWeight: n.isRead ? "normal" : "bold" }}
                  >
                    {n.message}
                  </MenuItem>
                ))
              ) : (
                <MenuItem isDisabled>No new notifications</MenuItem>
              )}
            </Menu>

            <Divider orientation="vertical" />

            {/* User Profile Menu */}
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
          </Flex>
        )}
      </Flex>
    </View>
  );
}
