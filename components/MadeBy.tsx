import Link from "next/link";

type MadeByProps = {
  name?: string;
  href?: string;
  className?: string;
};

export default function MadeBy({
  name = "Team Hamilton SBSSU",
  href = "/madeby",
  className = "",
}: MadeByProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Website made by ${name}`}
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border border-gray-200 dark:border-white/10
        bg-gray-50 dark:bg-zinc-900
        px-3 py-1.5
        text-xs
        text-gray-500 dark:text-gray-400
        transition-colors duration-200
        hover:border-gray-300 dark:hover:border-white/20
        hover:text-gray-900 dark:hover:text-white
        ${className}
      `}
    >
      <span>Made by</span>

      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {name}
      </span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </svg>
    </Link>
  );
}
