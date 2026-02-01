import { forwardRef, type HTMLAttributes } from "react";

type DecoratorColor = "red" | "blue" | "yellow" | "none";
type DecoratorPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  decorator?: DecoratorColor;
  decoratorPosition?: DecoratorPosition;
}

const decoratorColorStyles: Record<Exclude<DecoratorColor, "none">, string> = {
  red: "bg-primary-red",
  blue: "bg-primary-blue",
  yellow: "bg-primary-yellow",
};

const decoratorPositionStyles: Record<DecoratorPosition, string> = {
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", decorator = "none", decoratorPosition = "top-right", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative bg-white border-4 border-foreground shadow-xl transition-transform duration-200 hover:-translate-y-1 ${className}`}
        {...props}
      >
        {decorator !== "none" && (
          <div
            className={`absolute w-4 h-4 ${decoratorColorStyles[decorator]} ${decoratorPositionStyles[decoratorPosition]}`}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-6 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`p-6 border-t-2 border-foreground/20 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  type CardProps,
  type CardHeaderProps,
  type CardContentProps,
  type CardFooterProps,
  type DecoratorColor,
  type DecoratorPosition,
};
