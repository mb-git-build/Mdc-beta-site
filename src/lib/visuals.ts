type VisualTone = {
  gradient: string;
  accent: string;
  panel: string;
  chip: string;
};

export function slugToAccent(slug: string) {
  const map: Record<string, VisualTone> = {
    "modular-prefab": {
      gradient: "linear-gradient(135deg,#102c3c 0%,#1d5369 100%)",
      accent: "#73E0FF",
      panel: "#143446",
      chip: "#dff7ff",
    },
    "liquid-cooling": {
      gradient: "linear-gradient(135deg,#0f3b4a 0%,#1a6b87 100%)",
      accent: "#8ef0ff",
      panel: "#12566b",
      chip: "#dafcff",
    },
    "ai-colocation-gpu-hosting": {
      gradient: "linear-gradient(135deg,#1f2345 0%,#3b4ea1 100%)",
      accent: "#a9bbff",
      panel: "#2b3775",
      chip: "#e4e9ff",
    },
    "power-and-electrical": {
      gradient: "linear-gradient(135deg,#35220f 0%,#8c5416 100%)",
      accent: "#ffd27a",
      panel: "#6c410f",
      chip: "#fff1d6",
    },
    "epc-and-commissioning": {
      gradient: "linear-gradient(135deg,#203227 0%,#3d7a55 100%)",
      accent: "#a6f1bf",
      panel: "#315c43",
      chip: "#e1fae8",
    },
  };

  return map[slug] ?? {
    gradient: "linear-gradient(135deg,#102c3c 0%,#295a74 100%)",
    accent: "#8ed1e8",
    panel: "#143446",
    chip: "#e8f6fb",
  };
}

export function categoryGlyph(slug: string) {
  const map: Record<string, string> = {
    "modular-prefab": "◫",
    "liquid-cooling": "◌",
    "ai-colocation-gpu-hosting": "⬡",
    "power-and-electrical": "⚡",
    "epc-and-commissioning": "▦",
  };

  return map[slug] ?? "◈";
}

export function vendorGlyph(slug: string) {
  const first = slug.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
  return first || "MD";
}

export function vendorPrimaryCategory(slugs: string[]) {
  return slugs[0] ?? "default";
}
