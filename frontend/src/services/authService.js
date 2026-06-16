import API_BASE from "../config";

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/protected`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("User not authenticated");
  }

  const data = await response.json();
  const email = data.message.split(" ")[1];

  return {
    username: email.split("@")[0],
    email: email
  };
}