import { useState } from "react";
import { Dumbbell, Footprints, Flame, Heart } from "lucide-react";

export type Exercise = {
  id: string;
  name: string;
  target: string;
  gifUrl?: string;
};

const ICONS: Record<string, React.ReactNode> = {
  pushups: <Dumbbell size={22} />,
  squats: <Footprints size={22} />,
  planks: <Flame size={22} />,
};

export default function ExerciseItem({
  exercise,
  selected,
  isFavorite,
  onPress,
  onToggleFavorite,
}: {
  exercise: Exercise;
  selected: boolean;
  isFavorite?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div
      className={`mb-2 flex w-full items-center rounded-xl border p-4 text-left ${
        selected
          ? "border-accent bg-surfaceAlt"
          : "border-border bg-surface"
      }`}
    >
      <button
        onClick={onPress}
        className="flex flex-1 items-center text-left active:opacity-85"
      >
        {exercise.gifUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="mr-4 h-10 w-10 rounded-xl bg-surfaceAlt object-cover"
          />
        ) : (
          <span
            className={`mr-4 flex h-10 w-10 items-center justify-center rounded-xl ${
              selected ? "bg-accent text-background" : "bg-surfaceAlt text-accent"
            }`}
          >
            {ICONS[exercise.id] ?? <Dumbbell size={22} />}
          </span>
        )}
        <span className="flex-1">
          <span className="block text-[18px] font-semibold text-white">
            {exercise.name}
          </span>
          <span className="mt-0.5 block text-[12px] text-secondary">
            {exercise.target}
          </span>
        </span>
        <span
          className={`mr-2 h-4 w-4 rounded-full border-2 ${
            selected ? "border-accent bg-accent" : "border-muted"
          }`}
        />
      </button>
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? "Hapus favorit" : "Tambah favorit"}
          className={`rounded-full p-2 transition-colors ${
            isFavorite ? "text-accent" : "text-muted hover:text-white"
          }`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}
