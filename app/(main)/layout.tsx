"use client";

import { Flex } from "@aws-amplify/ui-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
