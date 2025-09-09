import React, { useEffect, useRef, useState } from 'react';
import type { Character, Relationship } from '../types';

interface Node {
  id: string;
  name: string;
  type: Character['type'];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: Node;
  target: Node;
  relationship: Relationship;
}

interface RelationshipGraphProps {
  characters: Character[];
  relationships: Relationship[];
  onCharacterClick?: (character: Character) => void;
  onRelationshipClick?: (relationship: Relationship) => void;
}

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  characters,
  relationships,
  onCharacterClick,
  onRelationshipClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize nodes and edges
  useEffect(() => {
    const nodeMap = new Map<string, Node>();

    // Create nodes for characters that have relationships
    const connectedCharacterIds = new Set<string>();
    relationships.forEach(rel => {
      connectedCharacterIds.add(rel.from);
      connectedCharacterIds.add(rel.to);
    });

    const newNodes: Node[] = [];
    characters.forEach(character => {
      if (connectedCharacterIds.has(character.id)) {
        const node: Node = {
          id: character.id,
          name: character.name,
          type: character.type,
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          vx: 0,
          vy: 0,
        };
        newNodes.push(node);
        nodeMap.set(character.id, node);
      }
    });

    // Create edges
    const newEdges: Edge[] = [];
    relationships.forEach(relationship => {
      const source = nodeMap.get(relationship.from);
      const target = nodeMap.get(relationship.to);
      if (source && target) {
        newEdges.push({
          source,
          target,
          relationship,
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [characters, relationships, dimensions]);

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force simulation
  useEffect(() => {
    const simulate = () => {
      const alpha = 0.1;
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;

      setNodes(prevNodes => {
        return prevNodes.map(node => {
          let fx = 0, fy = 0;

          // Repulsion from other nodes
          prevNodes.forEach(other => {
            if (other.id !== node.id) {
              const dx = node.x - other.x;
              const dy = node.y - other.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance > 0) {
                const force = 200 / distance;
                fx += (dx / distance) * force;
                fy += (dy / distance) * force;
              }
            }
          });

          // Attraction to connected nodes
          edges.forEach(edge => {
            let target: Node | null = null;
            if (edge.source.id === node.id) target = edge.target;
            if (edge.target.id === node.id) target = edge.source;

            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const idealDistance = 150;
              const force = (distance - idealDistance) * 0.1;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          });

          // Centering force
          fx += (centerX - node.x) * 0.01;
          fy += (centerY - node.y) * 0.01;

          // Update velocity and position
          node.vx = (node.vx + fx) * 0.8;
          node.vy = (node.vy + fy) * 0.8;

          const newX = Math.max(30, Math.min(dimensions.width - 30, node.x + node.vx));
          const newY = Math.max(30, Math.min(dimensions.height - 30, node.y + node.vy));

          return {
            ...node,
            x: newX,
            y: newY,
          };
        });
      });

      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    if (nodes.length > 0) {
      simulate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes.length, edges, dimensions]);

  // Drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw edges
    edges.forEach(edge => {
      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      
      const relationshipColors = {
        ally: '#22c55e',
        enemy: '#ef4444',
        family: '#8b5cf6',
        mentor: '#f59e0b',
        neutral: '#6b7280',
      };
      
      ctx.strokeStyle = relationshipColors[edge.relationship.type] || '#6b7280';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw relationship label
      const midX = (edge.source.x + edge.target.x) / 2;
      const midY = (edge.source.y + edge.target.y) / 2;
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(edge.relationship.type, midX, midY);
    });

    // Draw nodes
    nodes.forEach(node => {
      const radius = node === selectedNode ? 25 : node === hoveredNode ? 22 : 20;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      
      const typeColors = {
        PC: '#3b82f6',
        NPC: '#6b7280',
        Villain: '#ef4444',
        Ally: '#22c55e',
      };
      
      ctx.fillStyle = typeColors[node.type] || '#6b7280';
      ctx.fill();
      
      // Border
      ctx.strokeStyle = node === selectedNode ? '#1d4ed8' : '#ffffff';
      ctx.lineWidth = node === selectedNode ? 3 : 2;
      ctx.stroke();

      // Character name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 4);
    });
  }, [nodes, edges, dimensions, hoveredNode, selectedNode]);

  // Mouse event handlers
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - mouseX) ** 2 + (node.y - mouseY) ** 2);
      return distance <= 25;
    });

    setHoveredNode(hoveredNode || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - mouseX) ** 2 + (node.y - mouseY) ** 2);
      return distance <= 25;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      const character = characters.find(c => c.id === clickedNode.id);
      if (character && onCharacterClick) {
        onCharacterClick(character);
      }
    } else {
      setSelectedNode(null);
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Character Relationships</h3>
        <p className="text-gray-500">No relationships to display. Create some character relationships to see the network graph.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Relationship Network</h3>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-96 border border-gray-200 rounded"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
        />
        
        {/* Legend */}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded p-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>PC</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>NPC</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Villain</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Ally</span>
            </div>
          </div>
          <hr className="my-2" />
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span>Ally</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span>Enemy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-purple-500"></div>
              <span>Family</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-yellow-500"></div>
              <span>Mentor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-gray-500"></div>
              <span>Neutral</span>
            </div>
          </div>
        </div>

        {/* Selected character info */}
        {selectedNode && (
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded p-3 max-w-xs">
            <h4 className="font-semibold">{selectedNode.name}</h4>
            <p className="text-sm text-gray-600">{selectedNode.type}</p>
            <div className="mt-2 text-xs">
              <p>Connections: {edges.filter(e => e.source.id === selectedNode.id || e.target.id === selectedNode.id).length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};