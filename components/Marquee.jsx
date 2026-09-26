import { Sparkle } from "lucide-react";

// Infinite horizontal ticker. Items are rendered twice so the -50% loop is seamless.
export default function Marquee({ items, className = "" }) {
  const row = (hidden) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-8 pr-8">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-8 whitespace-nowrap">
          {item}
          <Sparkle size={20} className="fill-current" />
        </span>
      ))}
    </div>
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex w-max animate-marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
