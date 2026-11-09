import React, { useEffect, useRef } from 'react';
import {
  FoundationGridMap,
  FloorBotState,
  CardinalDirection,
} from '../../types/simulator';

interface FloorBotCanvasProps {
  map: FoundationGridMap;
  botState: FloorBotState;
  showCoordinates: boolean;
  activeStepIndex: number | null;
}

const DIRECTION_ANGLES: Record<CardinalDirection, number> = {
  N: 0,
  E: Math.PI / 2,
  S: Math.PI,
  W: (3 * Math.PI) / 2,
};

export const FloorBotCanvas: React.FC<FloorBotCanvasProps> = ({
  map,
  botState,
  showCoordinates,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const gridCount = map.gridSize;
    const cellSize = size / gridCount;

    // 1. Clear background
    ctx.fillStyle = map.bgColor;
    ctx.fillRect(0, 0, size, size);

    // 2. Draw checkerboard tiles
    for (let y = 0; y < gridCount; y++) {
      for (let x = 0; x < gridCount; x++) {
        const isAlt = (x + y) % 2 === 1;
        ctx.fillStyle = isAlt ? map.tileAltColor : map.tileColor;
        const pad = 3;
        ctx.beginPath();
        ctx.roundRect(
          x * cellSize + pad,
          y * cellSize + pad,
          cellSize - pad * 2,
          cellSize - pad * 2,
          10
        );
        ctx.fill();

        // Optional grid coordinates for Grade 2-3 spatial awareness
        if (showCoordinates) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(
            `${String.fromCharCode(65 + x)}${y + 1}`,
            x * cellSize + 8,
            y * cellSize + 6
          );
        }
      }
    }

    // 3. Draw Start Tile Marker
    const startCx = (map.startPos.x + 0.5) * cellSize;
    const startCy = (map.startPos.y + 0.5) * cellSize;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.roundRect(
      map.startPos.x * cellSize + 8,
      map.startPos.y * cellSize + 8,
      cellSize - 16,
      cellSize - 16,
      8
    );
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', startCx, (map.startPos.y + 1) * cellSize - 10);

    // 4. Draw Breadcrumb Path History
    if (botState.pathHistory.length > 1) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      botState.pathHistory.forEach((pt, index) => {
        const px = (pt.x + 0.5) * cellSize;
        const py = (pt.y + 0.5) * cellSize;
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 5. Draw Checkpoints
    map.checkpoints.forEach((cp) => {
      const visited = botState.visitedCheckpoints.includes(cp.order);
      const cx = (cp.x + 0.5) * cellSize;
      const cy = (cp.y + 0.5) * cellSize;

      ctx.fillStyle = visited
        ? 'rgba(16, 185, 129, 0.32)'
        : 'rgba(245, 158, 11, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.36, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = visited ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = `${Math.floor(cellSize * 0.4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cp.emoji, cx, cy - 2);

      // Badge Star
      ctx.fillStyle = visited ? '#10b981' : '#f59e0b';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(visited ? '✓' : `★${cp.order}`, cx, cy + cellSize * 0.32);
    });

    // 6. Draw Obstacles
    map.obstacles.forEach((obs) => {
      const ox = (obs.x + 0.5) * cellSize;
      const oy = (obs.y + 0.5) * cellSize;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.beginPath();
      ctx.roundRect(
        obs.x * cellSize + 8,
        obs.y * cellSize + 8,
        cellSize - 16,
        cellSize - 16,
        10
      );
      ctx.fill();

      ctx.strokeStyle = 'rgba(248, 113, 113, 0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${Math.floor(cellSize * 0.44)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(obs.emoji, ox, oy);
    });

    // 7. Draw Goal Target Tile
    const tx = (map.targetPos.x + 0.5) * cellSize;
    const ty = (map.targetPos.y + 0.5) * cellSize;

    const goalGrad = ctx.createRadialGradient(
      tx,
      ty,
      6,
      tx,
      ty,
      cellSize * 0.44
    );
    goalGrad.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
    goalGrad.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
    ctx.fillStyle = goalGrad;
    ctx.beginPath();
    ctx.roundRect(
      map.targetPos.x * cellSize + 6,
      map.targetPos.y * cellSize + 6,
      cellSize - 12,
      cellSize - 12,
      12
    );
    ctx.fill();

    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `${Math.floor(cellSize * 0.46)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(map.targetEmoji, tx, ty - 3);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('GOAL', tx, ty + cellSize * 0.34);

    // 8. Draw the Rotatable Floor Bot (Bee-Bot / Kazi-Bot style)
    const bx = (botState.x + 0.5) * cellSize;
    const by = (botState.y + 0.5) * cellSize;
    const botRadius = cellSize * 0.36;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(DIRECTION_ANGLES[botState.direction]);

    // Flash Halo Effect
    if (botState.isFlashing) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, botRadius * 1.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beep Acoustic Ring Effect
    if (botState.isBeeping) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, botRadius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Wheels (Left & Right)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-botRadius * 1.05, -botRadius * 0.55, botRadius * 0.28, botRadius * 1.1);
    ctx.fillRect(botRadius * 0.77, -botRadius * 0.55, botRadius * 0.28, botRadius * 1.1);

    // Robot Shell Body (Yellow/Gold Bee-Bot inspired)
    ctx.fillStyle = botState.hasCollided
      ? '#ef4444'
      : botState.isFlashing
      ? '#fef08a'
      : '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, botRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    // Decorative Stripes on Back
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-botRadius * 0.65, botRadius * 0.1, botRadius * 1.3, botRadius * 0.22, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-botRadius * 0.5, botRadius * 0.42, botRadius * 1.0, botRadius * 0.18, 4);
    ctx.fill();

    // Forward Directional Pointer Arrow on Roof
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(0, -botRadius * 0.78);
    ctx.lineTo(-botRadius * 0.32, -botRadius * 0.25);
    ctx.lineTo(botRadius * 0.32, -botRadius * 0.25);
    ctx.closePath();
    ctx.fill();

    // Robot Eyes (Facing Forward / North in local coords)
    ctx.fillStyle = botState.isFlashing ? '#38bdf8' : '#ffffff';
    ctx.beginPath();
    ctx.arc(-botRadius * 0.34, -botRadius * 0.42, botRadius * 0.17, 0, Math.PI * 2);
    ctx.arc(botRadius * 0.34, -botRadius * 0.42, botRadius * 0.17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-botRadius * 0.34, -botRadius * 0.46, botRadius * 0.08, 0, Math.PI * 2);
    ctx.arc(botRadius * 0.34, -botRadius * 0.46, botRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [map, botState, showCoordinates]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="p-3 rounded-2xl bg-slate-900 border-2 border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={450}
          height={450}
          className="w-full max-w-[430px] aspect-square rounded-xl block"
        />
      </div>

      {/* Overlay Status Banner */}
      {botState.hasReachedGoal && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-sm flex items-center gap-2 animate-bounce">
          <span>🎉</span>
          <span>Halala! Kazi-Bot reached the {map.targetLabel}!</span>
        </div>
      )}

      {botState.hasCollided && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-300 font-bold text-sm flex items-center gap-2">
          <span>💥</span>
          <span>Oops! Kazi-Bot bumped into an obstacle. Press Reset & try again!</span>
        </div>
      )}
    </div>
  );
};
