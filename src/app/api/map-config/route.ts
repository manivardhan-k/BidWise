import { json } from "@/lib/http";
export async function GET() {
  const token = process.env["NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"];
  if (!token?.startsWith("pk.")) return json({ error: "Map public-token configuration is unavailable." }, 503);
  return json({ token });
}
