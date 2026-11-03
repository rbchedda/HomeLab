import { ReactFlow, Background, Controls, BackgroundVariant, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { flowEdges, flowNodes } from "./layout";
import { nodeTypes } from "./nodes";
import "./styles.css";

const nodes: Node[] = flowNodes.map((node) => ({
  id: node.id,
  type: node.type,
  parentId: node.parentId,
  position: node.position,
  data: node.data,
  draggable: node.draggable ?? true,
  zIndex: node.zIndex,
  width: node.width,
  height: node.height,
  style: { width: node.width, height: node.height },
  extent: node.parentId ? "parent" : undefined,
}));

const edges: Edge[] = flowEdges.map((edge) => ({
  id: edge.id,
  source: edge.source,
  target: edge.target,
  type: "default",
}));

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.06 }}
        nodesConnectable={false}
        minZoom={0.2}
        maxZoom={1.75}
        proOptions={{ hideAttribution: false }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.1} color="#d4d4d8" />
        <Controls showInteractive />
      </ReactFlow>
    </div>
  );
}
