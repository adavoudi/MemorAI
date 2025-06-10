"use client";

import "./../app/app.css";
import "@aws-amplify/ui-react/styles.css";
import { redirect } from "next/navigation";
import "@/hooks/auth";

export default function App() {
  redirect("/dashboard");
}
