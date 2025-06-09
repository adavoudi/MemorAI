"use client";

import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { redirect } from "next/navigation";

Amplify.configure(outputs);

export default function App() {
  redirect("/dashboard");
}
