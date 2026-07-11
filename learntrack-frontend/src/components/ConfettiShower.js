import React, { useEffect, useRef } from 'react';

const ConfettiShower = ({ duration = 3000, onComplete }) => {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Start playing the children cheering sound effect
    const audio = new Audio('/kids_cheering.mp3');
    audio.play().catch(e => console.log('Cheering audio failed to play:', e));

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const startTime = Date.now();

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Confetti particles definition
    const colors = [
      '#FFC107', '#FF5722', '#E91E63', '#9C27B0', 
      '#3F51B5', '#00BCD4', '#4CAF50', '#8BC34A'
    ];
    const particleCount = 150;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 10 - 5
      });
    }

    const fadeOutDuration = 2000;
    const totalDuration = duration + fadeOutDuration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalDuration) {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resizeCanvas);
        if (onCompleteRef.current) onCompleteRef.current();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let opacity = 1;
      if (elapsed > duration) {
        opacity = 1 - (elapsed - duration) / fadeOutDuration;
      }

      particles.forEach(p => {
        // Move particle
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Wrap horizontal edges
        if (p.x > canvas.width) p.x = 0;
        else if (p.x < 0) p.x = canvas.width;

        // Reset particle if it falls off bottom (only if not fading out)
        if (p.y > canvas.height) {
          if (elapsed <= duration) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
          }
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999
      }}
    />
  );
};

export default ConfettiShower;
