'use client';

import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { Subscription } from '@/types/subscription';
import { Trash2, X, Wallet } from 'lucide-react';

interface VisualizerProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
}

interface Spark {
  x: number;
  y: number;
  color: string;
  life: number;
  velocity: { x: number; y: number };
  size?: number;
  hot?: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ subscriptions, onDelete }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  const mouseRef = useRef<Matter.Mouse | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const subscriptionsRef = useRef<Subscription[]>(subscriptions);

  const [isReady, setIsReady] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedPos, setSelectedPos] = useState({ x: 0, y: 0 });

  // Update subscriptions ref whenever they change
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);

  // Initial Setup
  useEffect(() => {
    if (!sceneRef.current) return;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
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
    const thickness = 2000;

    const wallOptions = { 
      isStatic: true, 
      friction: 0, 
      restitution: 0.95, // High bounce like glass
      render: { visible: false } 
    };

    const ground = Matter.Bodies.rectangle(
      width / 2,
      height + thickness / 2,
      width,
      thickness,
      wallOptions
    );
    const leftWall = Matter.Bodies.rectangle(
      -thickness / 2,
      height / 2,
      thickness,
      height,
      wallOptions
    );
    const rightWall = Matter.Bodies.rectangle(
      width + thickness / 2,
      height / 2,
      thickness,
      height,
      wallOptions
    );
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -thickness / 2,
      width,
      thickness,
      wallOptions
    );

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall, ceiling]);

    // Create Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // Start Render
    Matter.Render.run(render);

    // Mouse constraints for interaction
    const mouse = Matter.Mouse.create(render.canvas);
    mouseRef.current = mouse;
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

    // Collision Spark System (Initial Impact)
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const relVelX = bodyA.velocity.x - bodyB.velocity.x;
        const relVelY = bodyA.velocity.y - bodyB.velocity.y;
        const impact = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
        
        if (impact > 0.5) {
            const sparkCount = Math.min(18, Math.floor(impact * 2.5) + 3);
            const color = bodyA.render.fillStyle || bodyB.render.fillStyle || '#ffffff';
            const contact = (pair.activeContacts && pair.activeContacts.length > 0) 
                ? pair.activeContacts[0] 
                : (pair.contacts && pair.contacts.length > 0) ? pair.contacts[0] : null;
                
            if (contact && contact.vertex) {
                for (let i = 0; i < sparkCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * impact * 0.5 + 2.5;
                    sparksRef.current.push({
                        x: contact.vertex.x,
                        y: contact.vertex.y,
                        color: color,
                        life: 1.0,
                        hot: impact > 3,
                        size: Math.random() * 2 + 1,
                        velocity: {
                            x: Math.cos(angle) * speed,
                            y: Math.sin(angle) * speed
                        }
                    });
                }
            }
        }
      });
    });

    // Friction Spark System (Ongoing Sliding)
    Matter.Events.on(engine, 'collisionActive', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const relVelX = bodyA.velocity.x - bodyB.velocity.x;
        const relVelY = bodyA.velocity.y - bodyB.velocity.y;
        const speed = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
        
        if (speed > 1.2 && Math.random() > 0.85) {
          const color = bodyA.render.fillStyle || bodyB.render.fillStyle || '#ffffff';
          const contact = (pair.activeContacts && pair.activeContacts.length > 0) 
              ? pair.activeContacts[0] 
              : (pair.contacts && pair.contacts.length > 0) ? pair.contacts[0] : null;
              
          if (contact && contact.vertex) {
            sparksRef.current.push({
                x: contact.vertex.x,
                y: contact.vertex.y,
                color: color,
                life: 0.7,
                hot: false,
                size: Math.random() * 1.5 + 1,
                velocity: {
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4
                }
            });
          }
        }
      });
    });

    // Update Loop
    const updateLoop = () => {
      if (!engineRef.current) return;

      // Update Sparks (with physics)
      const sparks = sparksRef.current;
      const gravity = 0.12;
      const drag = 0.985;
      
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.velocity.y += gravity;
        s.velocity.x *= drag;
        s.velocity.y *= drag;
        s.x += s.velocity.x;
        s.y += s.velocity.y;
        s.life -= 0.015;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      const mouse = mouseRef.current;
      if (mouse) {
        const mousePos = mouse.position;
        const bodies = Array.from(bodiesRef.current.values());

        // Apply subtle repulsion force from mouse to all nearby bubbles
        bodies.forEach(body => {
          const dx = body.position.x - mousePos.x;
          const dy = body.position.y - mousePos.y;
          const distSq = dx * dx + dy * dy;
          const forceRadius = 250;
          
          if (distSq < forceRadius * forceRadius) {
            const distance = Math.sqrt(distSq);
            // Decoupled from mass to make heavier (more expensive) bubbles harder to move
            const forceMagnitude = (1 - distance / forceRadius) * 0.05; 
            Matter.Body.applyForce(body, body.position, {
              x: (dx / distance) * forceMagnitude,
              y: (dy / distance) * forceMagnitude
            });
          }

          // Subtle floating force (random drift, slightly scaled by mass for variety)
          Matter.Body.applyForce(body, body.position, {
            x: Math.sin(Date.now() * 0.001 + (body.id as any)) * 0.0002 * body.mass,
            y: Math.cos(Date.now() * 0.0012 + (body.id as any)) * 0.0002 * body.mass
          });
        });
      }

      if (selectedSubId) {
        const body = bodiesRef.current.get(selectedSubId);
        if (body) {
          setSelectedPos({ x: body.position.x, y: body.position.y });
        } else {
          setSelectedSubId(null);
        }
      }
      requestAnimationFrame(updateLoop);
    };
    const animId = requestAnimationFrame(updateLoop);

    // Custom rendering for background, names, and prices
    Matter.Events.on(render, 'afterRender', () => {
      const context = render.context;
      const time = Date.now() * 0.002;
      const width = render.options.width!;
      const height = render.options.height!;
      const mouse = mouseRef.current;
      if (!mouse) return;

      // --- Draw Reactive Grid (Background) ---
      context.save();
      context.globalCompositeOperation = 'destination-over'; // Draw behind everything
      context.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      context.lineWidth = 1;
      
      const gridSize = 80;
      const bodies = Array.from(bodiesRef.current.values());
      const mousePos = mouse.position;

      for (let ix = 0; ix <= width; ix += gridSize) {
          context.beginPath();
          for (let iy = 0; iy <= height; iy += 20) {
              let dx = 0;
              let dy = 0;
              
              // Mouse warp
              const mdist = Math.hypot(ix - mousePos.x, iy - mousePos.y);
              if (mdist < 200) {
                  const mag = (1 - mdist / 200) * 20;
                  dx += (ix - mousePos.x) / mdist * mag;
                  dy += (iy - mousePos.y) / mdist * mag;
              }

              // Bubble warp
              bodies.forEach(body => {
                  const bdist = Math.hypot(ix - body.position.x, iy - body.position.y);
                  const radius = body.circleRadius!;
                  if (bdist < radius + 100) {
                      const mag = (1 - bdist / (radius + 100)) * 25;
                      dx += (ix - body.position.x) / bdist * mag;
                      dy += (iy - body.position.y) / bdist * mag;
                  }
              });

              if (iy === 0) context.moveTo(ix + dx, iy + dy);
              else context.lineTo(ix + dx, iy + dy);
          }
          context.stroke();
      }

      for (let iy = 0; iy <= height; iy += gridSize) {
          context.beginPath();
          for (let ix = 0; ix <= width; ix += 20) {
              let dx = 0;
              let dy = 0;
              
              // Mouse warp
              const mdist = Math.hypot(ix - mousePos.x, iy - mousePos.y);
              if (mdist < 200) {
                  const mag = (1 - mdist / 200) * 20;
                  dx += (ix - mousePos.x) / mdist * mag;
                  dy += (iy - mousePos.y) / mdist * mag;
              }

              // Bubble warp
              bodies.forEach(body => {
                  const bdist = Math.hypot(ix - body.position.x, iy - body.position.y);
                  const radius = body.circleRadius!;
                  if (bdist < radius + 100) {
                      const mag = (1 - bdist / (radius + 100)) * 25;
                      dx += (ix - body.position.x) / bdist * mag;
                      dy += (iy - body.position.y) / bdist * mag;
                  }
              });

              if (ix === 0) context.moveTo(ix + dx, iy + dy);
              else context.lineTo(ix + dx, iy + dy);
          }
          context.stroke();
      }
      context.restore();

      // --- Draw Sparks ---
      context.save();
      sparksRef.current.forEach(spark => {
          const vx = spark.velocity.x;
          const vy = spark.velocity.y;
          const speed = Math.sqrt(vx * vx + vy * vy);
          const life = spark.life;
          
          context.globalAlpha = life;
          
          // Streak effect (line along velocity)
          const length = Math.max(2, speed * 2 * life);
          const angle = Math.atan2(vy, vx);
          
          context.save();
          context.translate(spark.x, spark.y);
          context.rotate(angle);
          
          // Draw Glow
          context.shadowBlur = spark.hot ? 20 * life : 10 * life;
          context.shadowColor = spark.color;
          
          // Draw Main Streak
          context.beginPath();
          context.strokeStyle = (spark.hot && life > 0.6) ? '#ffffff' : spark.color;
          context.lineWidth = (spark.size || 2) * life;
          context.lineCap = 'round';
          context.moveTo(-length, 0);
          context.lineTo(0, 0);
          context.stroke();
          
          // Hot core for first half of life
          if (spark.hot && life > 0.5) {
              context.beginPath();
              context.strokeStyle = '#ffffff';
              context.lineWidth = context.lineWidth * 0.5;
              context.moveTo(-length * 0.5, 0);
              context.lineTo(0, 0);
              context.stroke();
          }
          
          context.restore();
      });
      context.restore();

      subscriptionsRef.current.forEach(sub => {
        const body = bodiesRef.current.get(sub.id);
        if (body) {
          const { x, y } = body.position;
          const radius = body.circleRadius!;
          
          const time = Date.now() * 0.002;
          const pulse = Math.sin(time + sub.price) * 5;
          const glowPulse = Math.sin(time * 0.5 + sub.price) * 10 + 20;
          
          // Draw Glow
          context.save();
          context.beginPath();
          context.arc(x, y, radius + pulse, 0, Math.PI * 2);
          context.shadowBlur = glowPulse;
          context.shadowColor = sub.color;
          context.fillStyle = 'transparent';
          context.fill();
          context.restore();

          // Draw Inner Gradient (with slight wobble)
          const gradientX = x - radius/3 + Math.cos(time) * 2;
          const gradientY = y - radius/3 + Math.sin(time) * 2;
          const gradient = context.createRadialGradient(gradientX, gradientY, 0, x, y, radius);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(0.2, sub.color);
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
          
          context.save();
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = gradient;
          context.fill();
          
          // Draw highlight / sheen (animated)
          const sheenX = x - radius/4 + Math.sin(time * 0.7) * 3;
          const sheenY = y - radius/3 + Math.cos(time * 0.7) * 3;
          context.beginPath();
          context.ellipse(sheenX, sheenY, radius/3, radius/4, Math.PI/4 + Math.sin(time) * 0.1, 0, Math.PI * 2);
          context.fillStyle = 'rgba(255, 255, 255, 0.3)';
          context.fill();
          context.restore();

          // --- Draw Atom Orbits (Coupled to Physics) ---
          context.save();
          const orbitColor = `${sub.color}44`; 
          const electronColor = sub.color;
          
          // Base rotation from the body itself
          const bodyAngle = body.angle;
          
          // Orbit 1 (Dynamic rotation based on body angle)
          context.beginPath();
          const orbit1Tilt = bodyAngle + Math.PI / 4 + time * 0.1;
          context.ellipse(x, y, radius * 0.8, radius * 0.3, orbit1Tilt, 0, Math.PI * 2);
          context.strokeStyle = orbitColor;
          context.lineWidth = 1;
          context.stroke();
          
          // Electron 1 (Speed affected by angular velocity - very minimal for grace)
          const e1Angle = time * (0.3 + Math.abs(body.angularVelocity) * 0.4);
          const e1X = x + Math.cos(e1Angle) * radius * 0.8 * Math.cos(orbit1Tilt) - Math.sin(e1Angle) * radius * 0.3 * Math.sin(orbit1Tilt);
          const e1Y = y + Math.cos(e1Angle) * radius * 0.8 * Math.sin(orbit1Tilt) + Math.sin(e1Angle) * radius * 0.3 * Math.cos(orbit1Tilt);
          context.beginPath();
          context.arc(e1X, e1Y, 2.2, 0, Math.PI * 2);
          context.fillStyle = electronColor;
          context.shadowBlur = 10;
          context.shadowColor = electronColor;
          context.fill();
          context.restore();

          // Orbit 2 (Counter-rotation)
          context.save();
          context.beginPath();
          const orbit2Tilt = bodyAngle - Math.PI / 4 - time * 0.15;
          context.ellipse(x, y, radius * 0.8, radius * 0.3, orbit2Tilt, 0, Math.PI * 2);
          context.strokeStyle = orbitColor;
          context.lineWidth = 1;
          context.stroke();
          
          // Electron 2 (Minimal speed)
          const e2Angle = -time * (0.4 + Math.abs(body.angularVelocity) * 0.5) + 2;
          const e2X = x + Math.cos(e2Angle) * radius * 0.8 * Math.cos(orbit2Tilt) - Math.sin(e2Angle) * radius * 0.3 * Math.sin(orbit2Tilt);
          const e2Y = y + Math.cos(e2Angle) * radius * 0.8 * Math.sin(orbit2Tilt) + Math.sin(e2Angle) * radius * 0.3 * Math.cos(orbit2Tilt);
          context.beginPath();
          context.arc(e2X, e2Y, 2.2, 0, Math.PI * 2);
          context.fillStyle = electronColor;
          context.shadowBlur = 10;
          context.shadowColor = electronColor;
          context.fill();
          context.restore();

          // Draw Text with better scaling and motion
          const nameSize = Math.max(14, Math.min(radius / 4.5, 32));
          const priceSize = Math.max(12, Math.min(radius / 7, 20));
          
          // Text Motion (Sway + Inertia)
          const textSwayX = Math.sin(time * 0.8 + sub.price) * (radius * 0.05);
          const textSwayY = Math.cos(time * 0.8 + sub.price) * (radius * 0.05);
          
          // Lag effect based on velocity
          const lagX = -body.velocity.x * 2;
          const lagY = -body.velocity.y * 2;
          
          const totalOffsetX = textSwayX + lagX;
          const totalOffsetY = textSwayY + lagY;

          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          // Shadow for text legibility
          context.shadowBlur = 4;
          context.shadowColor = 'rgba(0,0,0,0.5)';
          
          // Draw Sub Name
          context.font = `800 ${nameSize}px Inter, sans-serif`;
          context.fillStyle = 'white';
          context.fillText(sub.name, x + totalOffsetX, y - (priceSize * 0.6) + totalOffsetY);
          
          // Draw Sub Price
          context.font = `600 ${priceSize}px Inter, sans-serif`;
          context.fillStyle = 'rgba(255,255,255,0.9)';
          const formattedPrice = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(sub.price);
          context.fillText(formattedPrice, x + totalOffsetX, y + (priceSize * 0.8) + totalOffsetY);
        }
      });
    });

    // Initial sync trigger
    setIsReady(true);

    // Resize handling
    const handleResize = () => {
      if (!sceneRef.current || !renderRef.current) return;
      const newWidth = sceneRef.current.clientWidth;
      const newHeight = sceneRef.current.clientHeight;
      
      renderRef.current.canvas.width = newWidth;
      renderRef.current.canvas.height = newHeight;
      renderRef.current.options.width = newWidth;
      renderRef.current.options.height = newHeight;
      
      Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + thickness / 2 });
      Matter.Body.setPosition(rightWall, { x: newWidth + thickness / 2, y: newHeight / 2 });
      Matter.Body.setPosition(ceiling, { x: newWidth / 2, y: -thickness / 2 });
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
    if (!engineRef.current || !isReady) return;

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
        const scaleFactor = Math.min(sub.price / 1200, 200);
        const radius = baseRadius + scaleFactor;
        
        const x = Math.random() * (sceneRef.current?.clientWidth || 500);
        const y = 50; // Spawn slightly below the ceiling to avoid collision

        const body = Matter.Bodies.circle(x, y, radius, {
          restitution: 0.9, // High bounce
          friction: 0,      // No friction
          frictionAir: 0.005, // Very slight air resistance to prevent infinite speed
          label: sub.id,
          mass: 1 + (sub.price / 2000), // Custom mass based on price
          render: {
            fillStyle: sub.color,
            strokeStyle: 'rgba(255,255,255,0.2)',
            lineWidth: 2,
          }
        });

        bodiesRef.current.set(sub.id, body);
        Matter.Composite.add(engineRef.current!.world, body);
      }
    });

  }, [subscriptions, isReady]);


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

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[150px] opacity-20" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-rose-600/20 rounded-full blur-[150px] opacity-20" />
        
        {/* Animated Noise / Grain */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No active bubbles</h2>
            <p className="text-zinc-500 max-w-xs">
                Visualize the beautiful mess of your monthly subscriptions as interactive, zero-gravity bubbles.
            </p>
        </div>
      )}
    </div>
  );
};

