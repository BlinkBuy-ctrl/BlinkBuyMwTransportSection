import { useEffect } from "react";
import { useLocation } from "wouter";
export default function RegisterPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/post-transport"); }, []);
  return null;
}
