import React from 'react';

interface Top10RankSVGProps {
  rank: number; // 1 to 10
}

export const Top10RankSVG: React.FC<Top10RankSVGProps> = ({ rank }) => {
  return (
    <div className="absolute left-[-15px] bottom-[-10px] z-10 pointer-events-none select-none h-[85%] w-[50%] flex items-end">
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x={rank === 10 ? "5" : "10"}
          y="105"
          fontSize="115"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontWeight="900"
          fill="#000000"
          stroke="#595959"
          strokeWidth="4"
          strokeLinejoin="round"
          letterSpacing={rank === 10 ? "-10" : "0"}
        >
          {rank}
        </text>
        <text
          x={rank === 10 ? "5" : "10"}
          y="105"
          fontSize="115"
          fontFamily="Impact, 'Arial Black', sans-serif"
          fontWeight="900"
          fill="#000000"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
          letterSpacing={rank === 10 ? "-10" : "0"}
        >
          {rank}
        </text>
      </svg>
    </div>
  );
};
