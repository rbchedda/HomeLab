import { flowEdges, flowNodes, type FlowNode } from "./layout";

type Box = FlowNode & { ax: number; ay: number };

function absolutes(nodes: FlowNode[]): Box[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const cache = new Map<string, { x: number; y: number }>();
  function origin(id: string): { x: number; y: number } {
    const cached = cache.get(id);
    if (cached) return cached;
    const node = byId.get(id);
    if (!node) throw new Error(`missing node ${id}`);
    const point = node.parentId
      ? {
          x: origin(node.parentId).x + node.position.x,
          y: origin(node.parentId).y + node.position.y,
        }
      : node.position;
    cache.set(id, point);
    return point;
  }
  return nodes.map((node) => {
    const point = origin(node.id);
    return { ...node, ax: point.x, ay: point.y };
  });
}

function isAncestor(nodes: Map<string, FlowNode>, ancestorId: string, nodeId: string): boolean {
  let current = nodes.get(nodeId)?.parentId;
  while (current) {
    if (current === ancestorId) return true;
    current = nodes.get(current)?.parentId;
  }
  return false;
}

function intersects(a: Box, b: Box): boolean {
  const left = Math.max(a.ax, b.ax);
  const right = Math.min(a.ax + a.width, b.ax + b.width);
  const top = Math.max(a.ay, b.ay);
  const bottom = Math.min(a.ay + a.height, b.ay + b.height);
  return right - left > 1 && bottom - top > 1;
}

function inside(child: Box, parent: Box, inset: number): boolean {
  return (
    child.ax >= parent.ax + inset &&
    child.ay >= parent.ay + inset &&
    child.ax + child.width <= parent.ax + parent.width - inset &&
    child.ay + child.height <= parent.ay + parent.height - inset
  );
}

const requiredEdges = [
  "printer->ap-office",
  "omarchy->ap-office",
  "windows->switch-office",
  "ap-office->switch-office",
  "switch-office->switch-basement",
  "tv-bed->ap-first",
  "tv-living->ap-first",
  "bazzite->ap-first",
  "ap-first->switch-basement",
  "switch-basement->router",
  "switch-basement->host-1",
  "switch-basement->host-2",
  "switch-basement->host-3",
  "switch-basement->host-4",
];

const boxes = absolutes(flowNodes);
const byId = new Map(flowNodes.map((node) => [node.id, node]));
const boxById = new Map(boxes.map((box) => [box.id, box]));
const errors: string[] = [];

for (const box of boxes) {
  if (box.width <= 0 || box.height <= 0) errors.push(`${box.id} has empty size`);
  if (!box.parentId) continue;
  const parent = boxById.get(box.parentId);
  if (!parent) {
    errors.push(`${box.id} parent ${box.parentId} missing`);
    continue;
  }
  const inset = box.type === "guest" ? 8 : 12;
  if (!inside(box, parent, inset)) {
    errors.push(
      `${box.id} is outside ${box.parentId} ` +
        `(child ${box.ax},${box.ay} ${box.width}x${box.height}; parent ${parent.ax},${parent.ay} ${parent.width}x${parent.height})`,
    );
  }
}

for (let i = 0; i < boxes.length; i++) {
  for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i];
    const b = boxes[j];
    if (isAncestor(byId, a.id, b.id) || isAncestor(byId, b.id, a.id)) continue;
    if (intersects(a, b)) {
      errors.push(`${a.id} overlaps ${b.id}`);
    }
  }
}

const edgeIds = flowEdges.map((edge) => edge.id).sort();
const expected = [...requiredEdges].sort();
if (edgeIds.join() !== expected.join()) {
  errors.push(`edge set mismatch:\n  got ${edgeIds.join(", ")}\n  want ${expected.join(", ")}`);
}

for (const edge of flowEdges) {
  const source = boxById.get(edge.source);
  const target = boxById.get(edge.target);
  if (!source || !target) {
    errors.push(`edge ${edge.id} is missing an endpoint`);
    continue;
  }
  const sx = source.ax + source.width / 2;
  const sy = source.ay + source.height;
  const tx = target.ax + target.width / 2;
  const ty = target.ay;
  if (ty + 1 < sy) {
    errors.push(`${edge.id} target is above its source, so the curve can bulge`);
  }
  const span = {
    ax: Math.min(sx, tx) + 4,
    ay: Math.min(sy, ty) + 4,
    width: Math.abs(tx - sx) - 8,
    height: Math.abs(ty - sy) - 8,
  };
  if (span.width <= 0 || span.height <= 0) continue;
  for (const box of boxes) {
    if (box.id === source.id || box.id === target.id) continue;
    if (box.type === "room") continue;
    if (isAncestor(byId, box.id, source.id) || isAncestor(byId, box.id, target.id)) continue;
    const fake = { ...box };
    if (intersects(fake, { ...box, ax: span.ax, ay: span.ay, width: span.width, height: span.height })) {
      errors.push(`edge ${edge.id} crosses ${box.id}`);
    }
  }
}

const rooms = boxes.filter((box) => box.type === "room");
console.log(
  rooms
    .map((room) => `${room.id} ${room.width}x${room.height} at ${room.ax},${room.ay}`)
    .join("\n"),
);
console.log(
  boxes
    .filter((box) => box.type === "host")
    .map((host) => `${host.id} ${host.width}x${host.height} at ${host.ax},${host.ay}`)
    .join("\n"),
);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`layout ok (${boxes.length} nodes, ${flowEdges.length} edges)`);
