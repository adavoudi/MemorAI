"use client";

import { Flex, Loader } from "@aws-amplify/ui-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useProfileCheck } from "@/hooks/useProfileCheck";

function ProtectedPages({ children }: { children: React.ReactNode }) {
  const { isChecking } = useProfileCheck();

  if (isChecking) {
    return (
      <Flex justifyContent="center" alignItems="center" minHeight="100vh">
        <Loader size="large" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minHeight="100vh">
      <Header />
      <Flex
        as="main"
        direction="column"
        flex="1"
        width="100%"
        maxWidth="1280px"
        margin="0 auto"
        padding="2rem"
      >
        {children}
      </Flex>
      <Footer />
    </Flex>
  );
}

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedPages>{children}</ProtectedPages>;
}
