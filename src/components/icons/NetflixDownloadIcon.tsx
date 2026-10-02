import React from 'react';

export interface NetflixDownloadIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Netflix-style download icon — a downward arrow with a horizontal line below it.
 * Used for top-level download control and quality download menus in Vidstack Player.
 */
export const NetflixDownloadIcon: React.FC<NetflixDownloadIconProps> = ({
  className = '',
  size = 22,
  ...props
}) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
};

export default NetflixDownloadIcon;
