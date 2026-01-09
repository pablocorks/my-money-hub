interface CategoryTagProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

export function CategoryTag({ name, color, size = 'sm' }: CategoryTagProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {name}
    </span>
  );
}
