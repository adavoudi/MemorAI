"use client";

import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Flex,
  Heading,
  Button,
  TextField,
  SelectField,
  Card,
  Text,
  Loader,
} from "@aws-amplify/ui-react";

const client = generateClient<Schema>();

export default function OnboardingPage() {
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  const router = useRouter();

  // State for the form
  const [formData, setFormData] = useState({ firstName: "", lastName: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // State to check if profile exists
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Effect to check for an existing profile and redirect if necessary
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    const checkForProfile = async () => {
      const { data: userProfile } = await client.models.User.get({
        owner: user.userId,
      });
      if (userProfile) {
        // Profile exists, user should not be here. Redirect to the main app.
        router.replace("/dashboard");
      } else {
        // No profile, user should be here. Stop checking.
        setIsCheckingProfile(false);
      }
    };
    checkForProfile();
  }, [authStatus, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!formData.firstName || !formData.lastName) {
      setError("First and last name are required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await client.models.User.create({
        owner: user.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        sourceLanguage: "English",
        targetLanguage: "German",
      });
      await client.models.Deck.create({ name: "Default Deck" });
      router.replace("/dashboard");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile. Please try again.");
      setIsLoading(false);
    }
  };

  // While checking for a profile, show a loader to prevent flicker.
  if (isCheckingProfile || authStatus !== "authenticated") {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Loader size="large" />
      </Flex>
    );
  }

  // Render the onboarding form
  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Card
        variation="elevated"
        padding="large"
        width={{ base: "90%", medium: "500px" }}
      >
        <Flex direction="column" gap="large">
          <Heading level={2}>Complete Your Profile</Heading>
          <Text color="font.secondary">
            Welcome to MemorAI! Let's get your profile set up.
          </Text>
          <TextField
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            isRequired
          />
          <TextField
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            isRequired
          />
          {error && <Text color="font.error">{error}</Text>}
          <Button
            variation="primary"
            size="large"
            onClick={handleSaveProfile}
            isLoading={isLoading}
            isFullWidth
          >
            Save and Continue
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
}
