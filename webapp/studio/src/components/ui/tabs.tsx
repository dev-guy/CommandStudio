import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: TabsPrimitive.TabsProps & { className?: string }) {
  return <TabsPrimitive.Root className={cn("w-full", className)} {...props} />;
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.TabsListProps & { className?: string }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-600",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: TabsPrimitive.TabsTriggerProps & { className?: string }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.TabsContentProps & { className?: string }) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 outline-none focus-visible:ring-2 focus-visible:ring-orange-300", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
