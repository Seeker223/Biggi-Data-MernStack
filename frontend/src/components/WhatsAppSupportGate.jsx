import React, { useContext } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import WhatsAppSupport from "./WhatsAppSupport";

const PUBLIC_PATHS = new Set([
  "/launch",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
]);

export default function WhatsAppSupportGate() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return null;
  if (PUBLIC_PATHS.has(location.pathname)) return null;

  return <WhatsAppSupport />;
}

