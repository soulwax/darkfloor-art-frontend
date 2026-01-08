// File: src/app/settings/page.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import { hapticLight, hapticToggle } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Eye,
  Music,
  Settings,
  Sparkles,
  User,
  Volume2
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  label: string;
  description?: string;
  type: "toggle" | "slider" | "select" | "link" | "button";
  value?: boolean | number | string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: boolean | number | string) => void;
  href?: string;
  action?: () => void;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const player = useGlobalPlayer();

  const { data: preferences, isLoading } = api.music.getUserPreferences.useQuery(
    undefined,
    { enabled: !!session },
  );

  const updatePreferences = api.music.updatePreferences.useMutation({
    onSuccess: () => {
      showToast("Settings saved", "success");
    },
    onError: () => {
      showToast("Failed to save settings", "error");
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    hapticToggle();
    updatePreferences.mutate({ [key]: value });
  };

  const handleSlider = (key: string, value: number) => {
    hapticLight();
    updatePreferences.mutate({ [key]: value });
  };

  const handleSelect = (key: string, value: string) => {
    hapticToggle();
    updatePreferences.mutate({ [key]: value });
  };

  const handleSignOut = async () => {
    hapticLight();
    await signOut({ callbackUrl: "/" });
  };

  if (!session) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="text-center"
        >
          <Settings className="mx-auto mb-4 h-16 w-16 text-[var(--color-muted)]" />
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
            Sign in required
          </h1>
          <p className="mb-6 text-[var(--color-subtext)]">
            Please sign in to access settings
          </p>
          <Link
            href="/api/auth/signin"
            className="touch-target-lg inline-block rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col px-4 py-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded bg-[var(--color-muted)]/20" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-[var(--color-muted)]/10"
            />
          ))}
        </div>
      </div>
    );
  }

  const playbackSection: SettingsSection = {
    id: "playback",
    title: "Playback",
    icon: <Music className="h-5 w-5" />,
    items: [
      {
        id: "volume",
        label: "Volume",
        description: `${Math.round((player.volume ?? 0.7) * 100)}%`,
        type: "slider",
        value: player.volume ?? 0.7,
        min: 0,
        max: 1,
        step: 0.01,
        onChange: (value) => {
          const vol = value as number;
          player.setVolume(vol);
          handleSlider("volume", vol);
        },
      },
      {
        id: "playbackRate",
        label: "Playback Speed",
        description: `${(player.playbackRate ?? 1.0).toFixed(1)}x`,
        type: "slider",
        value: player.playbackRate ?? 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.1,
        onChange: (value) => {
          const rate = value as number;
          player.setPlaybackRate(rate);
          handleSlider("playbackRate", rate);
        },
      },
      {
        id: "repeatMode",
        label: "Repeat",
        description:
          player.repeatMode === "none"
            ? "Off"
            : player.repeatMode === "one"
              ? "One"
              : "All",
        type: "select",
        value: player.repeatMode ?? "none",
        options: [
          { label: "Off", value: "none" },
          { label: "One", value: "one" },
          { label: "All", value: "all" },
        ],
        onChange: (value) => {
          const mode = value as "none" | "one" | "all";
          // Cycle through modes: none -> all -> one -> none
          // Keep cycling until we reach the target mode
          const modeOrder: ("none" | "one" | "all")[] = ["none", "all", "one"];
          const currentMode = player.repeatMode;
          const targetIndex = modeOrder.indexOf(mode);
          const currentIndex = modeOrder.indexOf(currentMode);
          
          // Calculate how many cycles needed
          const cyclesNeeded = (targetIndex - currentIndex + 3) % 3;
          for (let i = 0; i < cyclesNeeded; i++) {
            player.cycleRepeatMode();
          }
          handleSelect("repeatMode", mode);
        },
      },
      {
        id: "shuffleEnabled",
        label: "Shuffle",
        type: "toggle",
        value: player.isShuffled ?? false,
        onChange: (value) => {
          const enabled = value as boolean;
          if (enabled !== player.isShuffled) {
            player.toggleShuffle();
          }
          handleToggle("shuffleEnabled", enabled);
        },
      },
    ],
  };

  const audioSection: SettingsSection = {
    id: "audio",
    title: "Audio",
    icon: <Volume2 className="h-5 w-5" />,
    items: [
      {
        id: "equalizerEnabled",
        label: "Equalizer",
        description: "Enable audio equalizer",
        type: "toggle",
        value: preferences?.equalizerEnabled ?? false,
        onChange: (value) => handleToggle("equalizerEnabled", value as boolean),
      },
      {
        id: "equalizerPreset",
        label: "Equalizer Preset",
        description: preferences?.equalizerPreset ?? "Flat",
        type: "select",
        value: preferences?.equalizerPreset ?? "Flat",
        options: [
          { label: "Flat", value: "Flat" },
          { label: "Rock", value: "Rock" },
          { label: "Pop", value: "Pop" },
          { label: "Jazz", value: "Jazz" },
          { label: "Classical", value: "Classical" },
          { label: "Electronic", value: "Electronic" },
          { label: "Hip-Hop", value: "Hip-Hop" },
          { label: "Vocal", value: "Vocal" },
        ],
        onChange: (value) => handleSelect("equalizerPreset", value as string),
      },
    ],
  };

  const visualSection: SettingsSection = {
    id: "visual",
    title: "Visual",
    icon: <Eye className="h-5 w-5" />,
    items: [
      {
        id: "visualizerEnabled",
        label: "Visualizer",
        description: "Show audio visualizations",
        type: "toggle",
        value: preferences?.visualizerEnabled ?? true,
        onChange: (value) => handleToggle("visualizerEnabled", value as boolean),
      },
      {
        id: "visualizerType",
        label: "Visualizer Type",
        description: preferences?.visualizerType ?? "flowfield",
        type: "select",
        value: preferences?.visualizerType ?? "flowfield",
        options: [
          { label: "Flow Field", value: "flowfield" },
          { label: "Kaleidoscope", value: "kaleidoscope" },
        ],
        onChange: (value) => handleSelect("visualizerType", value as string),
      },
      {
        id: "compactMode",
        label: "Compact Mode",
        description: "Use compact player interface",
        type: "toggle",
        value: preferences?.compactMode ?? false,
        onChange: (value) => handleToggle("compactMode", value as boolean),
      },
    ],
  };

  const smartQueueSection: SettingsSection = {
    id: "smart-queue",
    title: "Smart Queue",
    icon: <Sparkles className="h-5 w-5" />,
    items: [
      {
        id: "autoQueueEnabled",
        label: "Auto Queue",
        description: "Automatically add similar tracks",
        type: "toggle",
        value: preferences?.autoQueueEnabled ?? false,
        onChange: (value) => handleToggle("autoQueueEnabled", value as boolean),
      },
      {
        id: "smartMixEnabled",
        label: "Smart Mix",
        description: "Generate personalized mixes",
        type: "toggle",
        value: preferences?.smartMixEnabled ?? true,
        onChange: (value) => handleToggle("smartMixEnabled", value as boolean),
      },
      {
        id: "similarityPreference",
        label: "Similarity",
        description:
          preferences?.similarityPreference === "strict"
            ? "Strict"
            : preferences?.similarityPreference === "diverse"
              ? "Diverse"
              : "Balanced",
        type: "select",
        value: preferences?.similarityPreference ?? "balanced",
        options: [
          { label: "Strict", value: "strict" },
          { label: "Balanced", value: "balanced" },
          { label: "Diverse", value: "diverse" },
        ],
        onChange: (value) =>
          handleSelect("similarityPreference", value as string),
      },
    ],
  };

  const accountSection: SettingsSection = {
    id: "account",
    title: "Account",
    icon: <User className="h-5 w-5" />,
    items: [
      {
        id: "profile",
        label: "Profile",
        description: "View your public profile",
        type: "link",
        href: session?.user?.name
          ? `/${session.user.name.toLowerCase().replace(/\s+/g, "")}`
          : "/profile",
      },
      {
        id: "signOut",
        label: "Sign Out",
        type: "button",
        action: handleSignOut,
      },
    ],
  };

  const sections: SettingsSection[] = [
    playbackSection,
    audioSection,
    visualSection,
    smartQueueSection,
    accountSection,
  ];

  return (
    <div className="container mx-auto flex min-h-screen flex-col px-4 py-4 md:px-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="mb-4 md:mb-8"
      >
        <h1 className="text-2xl font-bold text-[var(--color-text)] md:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-xs text-[var(--color-subtext)] md:mt-2 md:text-base">
          Customize your music experience
        </p>
      </motion.div>

      <div className="space-y-3 pb-4 md:space-y-6">
        {sections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springPresets.gentle,
              delay: sectionIndex * 0.05,
            }}
            className="rounded-xl border border-[rgba(244,178,102,0.12)] bg-[rgba(13,19,28,0.6)] p-3 backdrop-blur-sm md:rounded-2xl md:p-4"
          >
            <div className="mb-3 flex items-center gap-2 md:mb-4">
              <div className="text-[var(--color-accent)]">{section.icon}</div>
              <h2 className="text-base font-semibold text-[var(--color-text)] md:text-lg">
                {section.title}
              </h2>
            </div>

            <div className="space-y-0.5 md:space-y-1">
              {section.items.map((item, itemIndex) => (
                <SettingsItemComponent
                  key={item.id}
                  item={item}
                  index={itemIndex}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SettingsItemComponent({
  item,
  index,
}: {
  item: SettingsItem;
  index: number;
}) {
  const [localValue, setLocalValue] = useState(item.value);

  // Sync with item.value when it changes
  useEffect(() => {
    setLocalValue(item.value);
  }, [item.value]);

  const handleChange = (newValue: boolean | number | string) => {
    setLocalValue(newValue);
    item.onChange?.(newValue);
  };

  if (item.type === "toggle") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...springPresets.smooth,
          delay: index * 0.03,
        }}
        className="touch-target-lg flex items-center justify-between rounded-lg px-3 py-3 transition-colors active:bg-[rgba(244,178,102,0.12)] md:rounded-xl md:px-4 md:hover:bg-[rgba(244,178,102,0.08)]"
      >
        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--color-text)] md:text-base">{item.label}</div>
          {item.description && (
            <div className="mt-0.5 text-xs text-[var(--color-subtext)]">
              {item.description}
            </div>
          )}
        </div>
        <ToggleSwitch
          checked={localValue as boolean}
          onChange={(checked) => handleChange(checked)}
        />
      </motion.div>
    );
  }

  if (item.type === "slider") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...springPresets.smooth,
          delay: index * 0.03,
        }}
        className="rounded-lg px-3 py-3 transition-colors active:bg-[rgba(244,178,102,0.08)] md:rounded-xl md:px-4 md:hover:bg-[rgba(244,178,102,0.08)]"
      >
        <div className="mb-2 flex items-center justify-between md:mb-3">
          <div>
            <div className="text-sm font-medium text-[var(--color-text)] md:text-base">
              {item.label}
            </div>
            {item.description && (
              <div className="mt-0.5 text-xs font-semibold text-[var(--color-accent)]">
                {item.description}
              </div>
            )}
          </div>
        </div>
        <Slider
          value={localValue as number}
          min={item.min ?? 0}
          max={item.max ?? 100}
          step={item.step ?? 1}
          onChange={(value) => handleChange(value)}
        />
      </motion.div>
    );
  }

  if (item.type === "select") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...springPresets.smooth,
          delay: index * 0.03,
        }}
      >
        {item.href ? (
          <Link
            href={item.href}
            className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-[rgba(244,178,102,0.08)]"
          >
            <div className="flex-1">
              <div className="font-medium text-[var(--color-text)]">
                {item.label}
              </div>
              {item.description && (
                <div className="mt-0.5 text-xs text-[var(--color-subtext)]">
                  {item.description}
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--color-muted)]" />
          </Link>
        ) : (
          <SelectButton
            label={item.label}
            description={item.description}
            value={localValue as string}
            options={item.options ?? []}
            onChange={(value) => handleChange(value)}
          />
        )}
      </motion.div>
    );
  }

  if (item.type === "link") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...springPresets.smooth,
          delay: index * 0.03,
        }}
      >
        <Link
          href={item.href ?? "#"}
          className="touch-target-lg flex items-center justify-between rounded-lg px-3 py-3 transition-colors active:bg-[rgba(244,178,102,0.12)] md:rounded-xl md:px-4 md:hover:bg-[rgba(244,178,102,0.08)]"
        >
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--color-text)] md:text-base">
              {item.label}
            </div>
            {item.description && (
              <div className="mt-0.5 text-xs text-[var(--color-subtext)]">
                {item.description}
              </div>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--color-muted)] md:h-5 md:w-5" />
        </Link>
      </motion.div>
    );
  }

  if (item.type === "button") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...springPresets.smooth,
          delay: index * 0.03,
        }}
      >
        <button
          onClick={item.action}
          className="touch-target-lg flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors active:bg-[rgba(242,139,130,0.16)] md:rounded-xl md:px-4 md:hover:bg-[rgba(242,139,130,0.12)]"
        >
          <div className="text-sm font-medium text-[var(--color-text)] md:text-base">
            {item.label}
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--color-muted)] md:h-5 md:w-5" />
        </button>
      </motion.div>
    );
  }

  return null;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`touch-target relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        checked
          ? "bg-[var(--color-accent)]"
          : "bg-[rgba(255,255,255,0.2)]"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        animate={{
          x: checked ? 28 : 4,
        }}
        transition={springPresets.snappy}
        className="h-5 w-5 rounded-full bg-white shadow-lg"
      />
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="touch-target-lg h-2 w-full appearance-none rounded-full bg-[rgba(255,255,255,0.2)] outline-none"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, rgba(255,255,255,0.2) ${percentage}%, rgba(255,255,255,0.2) 100%)`,
        }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-accent);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

function SelectButton({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => {
          hapticLight();
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-[rgba(244,178,102,0.08)]"
      >
        <div className="flex-1 text-left">
          <div className="font-medium text-[var(--color-text)]">{label}</div>
          {description && (
            <div className="mt-0.5 text-xs text-[var(--color-subtext)]">
              {description}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-accent)]">
            {currentOption?.label ?? value}
          </span>
          <ChevronRight
            className={`h-5 w-5 text-[var(--color-muted)] transition-transform ${
              isOpen ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-[rgba(244,178,102,0.16)] bg-[rgba(13,19,28,0.98)] p-2 shadow-xl backdrop-blur-xl"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`touch-target w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                  value === option.value
                    ? "bg-[rgba(244,178,102,0.2)] text-[var(--color-accent)]"
                    : "text-[var(--color-text)] hover:bg-[rgba(244,178,102,0.08)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
