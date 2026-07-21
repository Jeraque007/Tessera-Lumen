import { useState, useEffect } from "react";
import { Blurhash } from "react-blurhash";

export default function ProgressiveImage({ src, blurhash, alt, className, style }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ ...style }}>
      {!isLoaded && blurhash && (
        <div className="absolute inset-0 z-0">
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
