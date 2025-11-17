"use client";
import * as React from "react";

import { Home, Image, Video, Tags, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const searchItems = [
  { group: "Detection", icon: Home, label: "Home", url: "/dashboard/default" },
  { group: "Detection", icon: Image, label: "Image Detection", url: "/dashboard/images" },
  { group: "Detection", icon: Video, label: "Video Detection", url: "/dashboard/video" },
  { group: "Detection", icon: Tags, label: "Classification", url: "/dashboard/classification" },
];

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <Button
        variant="link"
        className="text-muted-foreground !px-0 font-normal hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(
            searchItems.reduce(
              (acc, item) => {
                if (!acc[item.group]) {
                  acc[item.group] = [];
                }
                acc[item.group].push(item);
                return acc;
              },
              {} as Record<string, typeof searchItems>,
            ),
          ).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.label}
                    value={item.label}
                    onSelect={() => handleSelect(item.url)}
                    className="!py-1.5"
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{item.label}</span>
                    </CommandItem>
                );
              })}
              </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
