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
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource"; // Adjust path if needed

// Initialize the Amplify Data client
const client = generateClient<Schema>();
// Define the type for a single notification based on your schema
type Notification = Schema["Notification"]["type"];

export default function Header() {
  const { tokens } = useTheme();
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  // --- Live Notification State ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    // Don't run fetch or subscriptions if there's no authenticated user
    if (!user) return;

    // 1. Fetch initial notifications for the user
    const fetchInitialNotifications = async () => {
      // The `owner` field is implicitly used for authorization but can be used for filtering in a `list` query.
      const { data } = await client.models.Notification.list({
        filter: { owner: { eq: user.userId } },
      });
      // Sort by creation date to show newest first
      data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(data);
    };

    fetchInitialNotifications();

    // 2. Subscribe to NEW notifications.
    // FIX: Removed the explicit `filter` property. Amplify automatically scopes owner-based
    // subscriptions to the currently authenticated user.
    const createSub = client.models.Notification.onCreate().subscribe({
      next: (newNotification) => {
        // Add the new notification to the top of the list
        setNotifications((prevNotifications) => [
          newNotification,
          ...prevNotifications,
        ]);
      },
      error: (error) => console.warn(error),
    });

    // 3. Subscribe to UPDATES on notifications.
    // FIX: Removed the explicit `filter` property here as well.
    const updateSub = client.models.Notification.onUpdate().subscribe({
      next: (updatedNotification) => {
        // Replace the old notification with the updated one in the list
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === updatedNotification.id ? updatedNotification : n
          )
        );
      },
      error: (error) => console.warn(error),
    });

    // 4. Cleanup function to unsubscribe when the component unmounts or the user changes
    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
    };
  }, [user]); // Rerun this effect if the user changes

  const handleMarkAsRead = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    // Only update if it's currently unread to avoid unnecessary API calls
    if (notification && !notification.isRead) {
      await client.models.Notification.update({
        id: notificationId,
        isRead: true,
      });
      // The UI will update automatically via the onUpdate subscription
    }
  };
  // --- End Live Notification Logic ---

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
        <Link href="/dashboard" passHref style={{ textDecoration: "none" }}>
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
                style={{ textDecoration: "none" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </Flex>

        {user && (
          <Flex alignItems="center" gap="medium">
            <Menu
              trigger={
                <Button variation="link" size="large" position="relative">
                  <FaBell aria-label="Notifications" />
                  {unreadCount > 0 && (
                    <Badge
                      variation="error"
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
