import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarProps = {
  name?: string | null;
  url?: string | null;
  gender?: "male" | "female" | "other" | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: "none" | "online" | "offline" | "warning" | "danger";
  className?: string;
};

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

const ringMap = {
  none: "",
  online: "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
  offline: "ring-2 ring-muted ring-offset-2 ring-offset-background opacity-70",
  warning: "ring-2 ring-amber-500 ring-offset-2 ring-offset-background",
  danger: "ring-2 ring-destructive ring-offset-2 ring-offset-background",
};

// Cute illustrated avatars by gender — DiceBear avatars (deterministic from name)
function fallbackAvatar(name: string, gender?: string | null): string {
  const seed = encodeURIComponent(name || "user");
  const style =
    gender === "female" ? "adventurer&backgroundType=gradientLinear&backgroundColor=fbcfe8,fda4af"
    : gender === "male" ? "adventurer&backgroundType=gradientLinear&backgroundColor=bae6fd,a5b4fc"
    : "thumbs&backgroundType=gradientLinear&backgroundColor=d9f99d,fde68a";
  return `https://api.dicebear.com/9.x/${style}&seed=${seed}`;
}

export function UserAvatar({ name, url, gender, size = "md", ring = "none", className }: UserAvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const src = url || fallbackAvatar(name || "user", gender);
  return (
    <div className="relative inline-flex">
      <Avatar className={cn(sizeMap[size], ringMap[ring], "transition-shadow", className)}>
        <AvatarImage src={src} alt={name || "avatar"} />
        <AvatarFallback className={cn(
          gender === "female" ? "bg-pink-100 text-pink-700" :
          gender === "male" ? "bg-sky-100 text-sky-700" :
          "bg-muted text-foreground"
        )}>{initials}</AvatarFallback>
      </Avatar>
      {ring === "online" && <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />}
      {ring === "offline" && <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/60 border-2 border-background" />}
    </div>
  );
}
