import React, { useState, useRef, MouseEvent } from "react";

interface ThreeDTiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  id?: string;
  calmMode: boolean;
  motionLevel: "full" | "subtle" | "off";
  maxTilt?: number; // Maximum rotation in degrees
  key?: React.Key;
}

export function ThreeDTiltCard({
  children,
  className = "",
  id,
  calmMode,
  motionLevel,
  maxTilt = 8,
}: ThreeDTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, shineX: 50, shineY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  // If motion is off or calm mode is on, we do not want to execute tilt or shine math to preserve CPU and respect sensitivity
  const isMotionDisabled = calmMode || motionLevel === "off";
  const tiltScale = motionLevel === "subtle" ? 0.35 : 1.0;
  const activeMaxTilt = maxTilt * tiltScale;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isMotionDisabled) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse coordinates relative to the card center (range -0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // X-axis mouse movement tilts Y, Y-axis movement tilts X
    const rotateY = mouseX * activeMaxTilt * 2;
    const rotateX = -mouseY * activeMaxTilt * 2;

    // Reflection coordinates (0% to 100%)
    const shineX = ((e.clientX - rect.left) / width) * 100;
    const shineY = ((e.clientY - rect.top) / height) * 100;

    // Shadow offset calculations
    const shadowX = mouseX * 15;
    const shadowY = mouseY * 15;

    setCoords({ rotateX, rotateY, shadowX, shadowY, shineX, shineY });
  };

  const handleMouseEnter = () => {
    if (isMotionDisabled) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ rotateX: 0, rotateY: 0, shadowX: 0, shadowY: 0, shineX: 50, shineY: 50 });
  };

  const cardStyle: React.CSSProperties = isMotionDisabled
    ? {}
    : {
        transform: isHovered
          ? `perspective(800px) rotateX(${coords.rotateX}deg) rotateY(${coords.rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
        boxShadow: isHovered
          ? `${-coords.shadowX}px ${-coords.shadowY}px 24px -4px rgba(0, 0, 0, 0.12), 0 10px 15px -3px rgba(0, 0, 0, 0.08)`
          : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        transition: isHovered ? "transform 0.08s ease-out, box-shadow 0.08s ease-out" : "transform 0.4s ease-out, box-shadow 0.4s ease-out",
        transformStyle: "preserve-3d",
      };

  return (
    <div
      ref={cardRef}
      id={id}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
    >
      {/* Light Reflection Sheen Sheath Layer */}
      {isHovered && !isMotionDisabled && (
        <div
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge z-30 opacity-40 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 220px at ${coords.shineX}% ${coords.shineY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 100%)`,
          }}
        />
      )}

      {/* Layer for nested absolute elements or relative boundaries */}
      <div 
        className="w-full h-full"
        style={isMotionDisabled ? {} : { transform: "translateZ(8px)" }}
      >
        {children}
      </div>
    </div>
  );
}
