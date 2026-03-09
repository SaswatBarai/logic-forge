import "@/styles/story-theme.css";
import { StorySFXProvider } from "@/components/story/story-sfx-context";
import { AudioManagerProvider } from "@/contexts/audio-manager-context";
import { NarrationProvider } from "@/contexts/narration-context";

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorySFXProvider>
      <AudioManagerProvider>
        <NarrationProvider>
          <div className="story-mode min-h-full">{children}</div>
        </NarrationProvider>
      </AudioManagerProvider>
    </StorySFXProvider>
  );
}
