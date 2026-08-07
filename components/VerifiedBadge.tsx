export default function VerifiedBadge({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`inline-block align-[-2px] ${className}`}
      aria-label="Verified"
      role="img"
    >
      <path
        d="M12 1.5l2.7 2 3.3-.4 1.2 3.1 2.9 1.7-.7 3.3.7 3.3-2.9 1.7-1.2 3.1-3.3-.4-2.7 2-2.7-2-3.3.4-1.2-3.1-2.9-1.7.7-3.3-.7-3.3 2.9-1.7 1.2-3.1 3.3.4z"
        fill="#3a5bc7"
      />
      <path
        d="M8.4 12.2l2.4 2.4 4.8-4.9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
