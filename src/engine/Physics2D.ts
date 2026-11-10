import { RoverState, MazeWall, LineSegment } from '../types/simulator';

// ============================================================================
// 2D Differential Drive Kinematics, Raycasting & Optical Line Sensor Engine
// ============================================================================

export const ROVER_WHEELBASE = 34; // pixels between left & right wheel centers
export const ROVER_RADIUS = 18;
export const MAX_RAY_DISTANCE = 220; // pixels

/**
 * Compute intersection distance of a ray (origin rx,ry with direction dx,dy)
 * against a line segment (x1,y1)-(x2,y2). Returns distance or null.
 */
function intersectRaySegment(
  rx: number,
  ry: number,
  dx: number,
  dy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number | null {
  const v1x = rx - x1;
  const v1y = ry - y1;
  const v2x = x2 - x1;
  const v2y = y2 - y1;
  const v3x = -dy;
  const v3y = dx;

  const dot = v2x * v3x + v2y * v3y;
  if (Math.abs(dot) < 1e-6) return null;

  const t1 = (v2x * v1y - v2y * v1x) / dot;
  const t2 = (v1x * v3x + v1y * v3y) / dot;

  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return t1;
  }
  return null;
}

/**
 * Shortest distance from a point (px, py) to a line segment (x1,y1)-(x2,y2).
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Raycast ultrasonic sensor forward from the front nose of the Rover.
 */
export function computeUltrasonicDistance(
  x: number,
  y: number,
  angle: number,
  walls: MazeWall[],
  canvasWidth: number,
  canvasHeight: number
): number {
  const noseX = x + Math.cos(angle) * ROVER_RADIUS;
  const noseY = y + Math.sin(angle) * ROVER_RADIUS;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  let minDist = MAX_RAY_DISTANCE;

  // Include outer arena borders + user walls
  const allSegments: MazeWall[] = [
    ...walls,
    { id: 'b-top', x1: 0, y1: 0, x2: canvasWidth, y2: 0 },
    { id: 'b-bottom', x1: 0, y1: canvasHeight, x2: canvasWidth, y2: canvasHeight },
    { id: 'b-left', x1: 0, y1: 0, x2: 0, y2: canvasHeight },
    { id: 'b-right', x1: canvasWidth, y1: 0, x2: canvasWidth, y2: canvasHeight },
  ];

  for (const w of allSegments) {
    const d = intersectRaySegment(noseX, noseY, dx, dy, w.x1, w.y1, w.x2, w.y2);
    if (d !== null && d < minDist) {
      minDist = d;
    }
  }

  return Math.round(minDist);
}

/**
 * Evaluate left & right optical infrared line-following sensors positioned on the front bumper.
 */
export function computeOpticalLineSensors(
  x: number,
  y: number,
  angle: number,
  lines: LineSegment[]
): {
  leftSensor: boolean;
  rightSensor: boolean;
  leftPt: { x: number; y: number };
  rightPt: { x: number; y: number };
  leftDist: number;
  rightDist: number;
} {
  const forwardOffset = ROVER_RADIUS + 4;
  const sideOffset = 9;

  const leftPt = {
    x: x + Math.cos(angle) * forwardOffset + Math.cos(angle - Math.PI / 2) * sideOffset,
    y: y + Math.sin(angle) * forwardOffset + Math.sin(angle - Math.PI / 2) * sideOffset,
  };

  const rightPt = {
    x: x + Math.cos(angle) * forwardOffset + Math.cos(angle + Math.PI / 2) * sideOffset,
    y: y + Math.sin(angle) * forwardOffset + Math.sin(angle + Math.PI / 2) * sideOffset,
  };

  const lineThicknessThreshold = 11;

  let leftDist = Infinity;
  let rightDist = Infinity;

  for (const seg of lines) {
    const dl = pointToSegmentDistance(leftPt.x, leftPt.y, seg.x1, seg.y1, seg.x2, seg.y2);
    if (dl < leftDist) leftDist = dl;
    const dr = pointToSegmentDistance(rightPt.x, rightPt.y, seg.x1, seg.y1, seg.x2, seg.y2);
    if (dr < rightDist) rightDist = dr;
  }

  const leftSensor = leftDist <= lineThicknessThreshold;
  const rightSensor = rightDist <= lineThicknessThreshold;

  return { leftSensor, rightSensor, leftPt, rightPt, leftDist, rightDist };
}

/**
 * Step the 2D Differential Drive Rover forward by dt seconds.
 * In 2D canvas coordinates (x right, y down, angle clockwise from +x):
 *   v = (v_L + v_R) / 2
 *   omega = (v_L - v_R) / L  (v_L > v_R turns clockwise/right; v_R > v_L turns counter-clockwise/left)
 */
export function stepRoverPhysics(
  state: RoverState,
  dt: number,
  walls: MazeWall[],
  lines: LineSegment[],
  canvasWidth: number,
  canvasHeight: number
): RoverState {
  const speedScale = 1.15;
  const vL = state.vLeft * speedScale;
  const vR = state.vRight * speedScale;

  const linearV = (vL + vR) / 2;
  const omega = (vL - vR) / ROVER_WHEELBASE;

  const nextAngle = state.angle + omega * dt;
  const midAngle = state.angle + 0.5 * omega * dt;
  let nextX = state.x + linearV * Math.cos(midAngle) * dt;
  let nextY = state.y + linearV * Math.sin(midAngle) * dt;

  // Clamp inside arena walls
  nextX = Math.max(ROVER_RADIUS + 4, Math.min(canvasWidth - ROVER_RADIUS - 4, nextX));
  nextY = Math.max(ROVER_RADIUS + 4, Math.min(canvasHeight - ROVER_RADIUS - 4, nextY));

  // Prevent passing through interior maze walls
  const hitWall = walls.some(
    (w) =>
      pointToSegmentDistance(nextX, nextY, w.x1, w.y1, w.x2, w.y2) < ROVER_RADIUS + 3
  );

  if (hitWall) {
    nextX = state.x;
    nextY = state.y;
  }

  const ultrasonicDistance = computeUltrasonicDistance(
    nextX,
    nextY,
    nextAngle,
    walls,
    canvasWidth,
    canvasHeight
  );

  const { leftSensor, rightSensor } = computeOpticalLineSensors(
    nextX,
    nextY,
    nextAngle,
    lines
  );

  const nextTrail =
    Math.hypot(nextX - state.x, nextY - state.y) > 2
      ? [...state.trail.slice(-180), { x: nextX, y: nextY }]
      : state.trail;

  return {
    ...state,
    x: nextX,
    y: nextY,
    angle: nextAngle,
    ultrasonicDistance,
    leftLineSensor: leftSensor,
    rightLineSensor: rightSensor,
    trail: nextTrail,
  };
}
