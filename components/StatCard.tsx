import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, onClick, className }: StatCardProps) {
  const isClickable = !!onClick;
  const CardWrapper = isClickable ? "button" : "div";

  return (
    <CardWrapper
      onClick={onClick}
      className={cn(
        "flex flex-col text-left p-6 bg-card border border-border rounded-xl shadow-sm transition-all duration-200",
        {
          "hover:border-neutral-500 hover:bg-neutral-900/40 cursor-pointer active:scale-[0.99]": isClickable,
        },
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {value}
        </span>
        {trend && (
          <span
            className={cn("text-xs font-medium px-1.5 py-0.5 rounded", {
              "bg-green-500/10 text-green-500": trend.isPositive,
              "bg-red-500/10 text-red-500": !trend.isPositive,
            })}
          >
            {trend.value}
          </span>
        )}
      </div>
      {description && (
        <span className="text-xs text-muted-foreground mt-1.5">
          {description}
        </span>
      )}
    </CardWrapper>
  );
}
