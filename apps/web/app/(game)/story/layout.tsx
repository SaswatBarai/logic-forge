import "@/styles/story-theme.css";
import { StorySFXProvider } from "@/components/story/story-sfx-context";

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorySFXProvider>
      <div className="story-mode min-h-full">{children}</div>
    </StorySFXProvider>
  );
}
