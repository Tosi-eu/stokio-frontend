import { useState } from "react";
import { AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof AvatarImage>;

export function FadeInAvatarImage({ className, onLoad, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <AvatarImage
      key={rest.src}
      {...rest}
      className={cn(
        "transition-opacity duration-700 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      onLoad={(e) => {
        setVisible(true);
        onLoad?.(e);
      }}
      onError={() => setVisible(false)}
    />
  );
}
