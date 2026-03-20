'use client';

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Subscription } from '@/types/subscription';
import { Trash2, X, Wallet } from 'lucide-react';

interface VisualizerProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ subscriptions, onDelete }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState({ x: 0, y: 0 });

  // Initial Setup
  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 1 },
    });
    engineRef.current = engine;

    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: sceneRef.current.clientHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio,
      },
    });
    renderRef.current = render;

    // Create Boundaries
    const width = sceneRef.current.clientWidth;
    const height = sceneRef.current.clientHeight;
    const thickness = 100;

    const ground = Matter.Bodies.rectangle(
      width / 2,
      height + thickness / 2,
      width,
      thickness,
      { isStatic: true, render: { visible: false } }
    );
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2,
      height / 2,
      thickness,
      height,
      { isStatic: true, render: { visible: false } }
    );
    const rightWall = Matter.Bodies.rectangle(
      width + thickness / 2,
      height / 2,
      thickness,
      height,
      { isStatic: true, render: { visible: false } }
    );

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    // Create Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // Start Render
    Matter.Render.run(render);

    // Mouse constraints for interaction
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    // Click handler for selection
    Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
      const mousePosition = event.mouse.position;
      const foundBody = Matter.Query.point(Array.from(bodiesRef.current.values()), mousePosition)[0];
      
      if (foundBody) {
        const subId = foundBody.label;
        setSelectedSubId(subId);
        setSelectedPos({ x: foundBody.position.x, y: foundBody.position.y });
      } else {
        setSelectedSubId(null);
      }
    });

    // Update selected position as physics runs
    const updatePosition = () => {
      if (selectedSubId) {
        const body = bodiesRef.current.get(selectedSubId);
        if (body) {
          setSelectedPos({ x: body.position.x, y: body.position.y });
        } else {
          setSelectedSubId(null);
        }
      }
      requestAnimationFrame(updatePosition);
    };
    const animId = requestAnimationFrame(updatePosition);

    // Resize handling
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return;
      const newWidth = sceneRef.current.clientWidth;
      const newHeight = sceneRef.current.clientHeight;
      
      renderRef.current.canvas.width = newWidth;
      renderRef.current.canvas.height = newHeight;
      Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + thickness / 2 });
      Matter.Body.setPosition(rightWall, { x: newWidth + thickness / 2, y: newHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  // Synchronize Subscriptions
  useEffect(() => {
    if (!engineRef.current) return;

    const currentSubIds = new Set(subscriptions.map(s => s.id));
    const trackedSubIds = new Set(bodiesRef.current.keys());

    // Remove deleted ones
    trackedSubIds.forEach(id => {
      if (!currentSubIds.has(id)) {
        const body = bodiesRef.current.get(id);
        if (body) {
          Matter.Composite.remove(engineRef.current!.world, body);
          bodiesRef.current.delete(id);
        }
      }
    });

    // Add new ones
    subscriptions.forEach(sub => {
      if (!bodiesRef.current.has(sub.id)) {
        // Linear scale for price -> radius (can be improved)
        // Min radius: 40, Max radius: 150
        // Assume price range: 0 - 500.000 for scaling
        const baseRadius = 40;
        const scaleFactor = Math.min(sub.price / 5000, 150);
        const radius = baseRadius + scaleFactor;
        
        const x = Math.random() * (sceneRef.current?.clientWidth || 500);
        const y = -radius; // Start above screen

        const body = Matter.Bodies.circle(x, y, radius, {
          restitution: 0.6,
          friction: 0.1,
          label: sub.id,
          render: {
            fillStyle: sub.color,
            strokeStyle: 'rgba(255,255,255,0.2)',
            lineWidth: 2,
          }
        });

        // Add custom text rendering hook to Matter.js Render
        // We'll actually render text in each frame if possible or just use React overlays
        // But for performance with Matter.js Render, it's easier to use native canvas drawing or React portals
        
        bodiesRef.current.set(sub.id, body);
        Matter.Composite.add(engineRef.current!.world, body);
      }
    });

    // Custom rendering for names and prices
    const render = renderRef.current;
    if (render) {
      Matter.Events.on(render, 'afterRender', () => {
        const context = render.context;
        context.font = '700 14px Inter, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        subscriptions.forEach(sub => {
          const body = bodiesRef.current.get(sub.id);
          if (body) {
            const { x, y } = body.position;
            const radius = body.circleRadius!;
            
            // Draw Sub Name
            context.fillStyle = 'white';
            context.fillText(sub.name, x, y - 8);
            
            // Draw Sub Price
            context.font = '400 12px Inter, sans-serif';
            context.fillStyle = 'rgba(255,255,255,0.8)';
            const formattedPrice = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(sub.price);
            context.fillText(formattedPrice, x, y + 12);
            context.font = '700 14px Inter, sans-serif';
          }
        });
      });
    }

  }, [subscriptions]);

  return (
    <div ref={sceneRef} className="w-full h-screen bg-slate-950 overflow-hidden touch-none relative">
      {/* Selection Overlay */}
      {selectedSubId && (
        <div 
          className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: selectedPos.x, top: selectedPos.y }}
        >
          <div className="flex flex-col items-center gap-2 pointer-events-auto animate-in zoom-in-50 fade-in duration-200">
            <button
              onClick={() => {
                onDelete(selectedSubId);
                setSelectedSubId(null);
              }}
              className="p-3 bg-red-500 hover:bg-red-400 text-white rounded-full shadow-lg shadow-red-500/40 transition-all hover:scale-110 active:scale-90"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedSubId(null)}
              className="p-1 px-3 bg-white/10 backdrop-blur-md rounded-full text-xs text-white/60 hover:text-white border border-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No active bubbles</h2>
            <p className="text-zinc-500 max-w-xs">
                Add your monthly subscriptions to visualize your burn as interactive bubbles!
            </p>
        </div>
      )}
    </div>
  );
};

