import { Fragment, type ReactNode } from "react";
import { cn } from "../lib/utils";

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-[var(--muted)] px-1 py-0.5 text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function Block({ line }: { line: string }) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2];
    const className = cn(
      "font-semibold text-[var(--foreground)]",
      level === 1 && "text-xl mt-4 mb-2",
      level === 2 && "text-lg mt-4 mb-2",
      level === 3 && "text-base mt-3 mb-1",
    );
    if (level === 1) return <h2 className={className}>{formatInline(text)}</h2>;
    if (level === 2) return <h3 className={className}>{formatInline(text)}</h3>;
    return <h4 className={className}>{formatInline(text)}</h4>;
  }

  const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
  if (bulletMatch) {
    return (
      <li className="ml-5 list-disc text-sm leading-relaxed">
        {formatInline(bulletMatch[1])}
      </li>
    );
  }

  const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
  if (numberedMatch) {
    return (
      <li className="ml-5 list-decimal text-sm leading-relaxed">
        {formatInline(numberedMatch[1])}
      </li>
    );
  }

  return (
    <p className="text-sm leading-relaxed text-[var(--foreground)]">
      {formatInline(trimmed)}
    </p>
  );
}

interface Props {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({ content, className }: Props) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length === 0 || !listType) return;
    const ListTag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={cn(
          "my-2 space-y-1",
          listType === "ol" ? "list-decimal" : "list-disc",
          "pl-5",
        )}
      >
        {listItems}
      </ListTag>,
    );
    listItems = [];
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = /^[-*•]\s+/.test(trimmed);
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      const type = isNumbered ? "ol" : "ul";
      if (listType && listType !== type) flushList();
      listType = type;
      const match = trimmed.match(isNumbered ? /^\d+\.\s+(.+)$/ : /^[-*•]\s+(.+)$/);
      if (match) {
        listItems.push(
          <li key={listItems.length} className="text-sm leading-relaxed">
            {formatInline(match[1])}
          </li>,
        );
      }
      continue;
    }

    flushList();
    if (!trimmed) {
      blocks.push(<div key={`sp-${blocks.length}`} className="h-2" />);
      continue;
    }
    blocks.push(<Block key={`b-${blocks.length}`} line={line} />);
  }
  flushList();

  return (
    <div className={cn("space-y-1", className)}>{blocks}</div>
  );
}
