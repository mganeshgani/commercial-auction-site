import React, { useState, useEffect, useRef } from 'react';
import './SpinWheel.css';

interface SpinWheelProps {
  onSpinComplete: () => void;
  isSpinning: boolean;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ onSpinComplete, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const onSpinCompleteRef = useRef(onSpinComplete);
  
  // Keep ref updated with latest callback
  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  useEffect(() => {
    if (isSpinning) {
      // Random rotation between 1800-3600 degrees (5-10 full rotations)
      const randomRotation = Math.floor(Math.random() * 1800) + 1800;
      setRotation(prev => prev + randomRotation);

      // Call onSpinComplete after animation finishes
      const timer = setTimeout(() => {
        onSpinCompleteRef.current();
      }, 4000); // 4 seconds animation
      
      return () => clearTimeout(timer);
    }
  }, [isSpinning]);

  return (
    <div className="spin-wheel-container">
      <div className="spin-wheel-frame">
        <div 
          className="spin-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {[...Array(12)].map((_, i) => {
            const isGoldSegment = i % 2 === 0;
            
            return (
              <div
                key={i}
                className="wheel-segment"
                style={{
                  transform: `rotate(${i * 30}deg)`,
                  background: isGoldSegment ? 
                    'linear-gradient(135deg, #B8941E 0%, #D4AF37 30%, #F0D770 50%, #D4AF37 70%, #A67C00 100%)' : 
                    'linear-gradient(135deg, #0D1117 0%, #1A1F2E 30%, #242B3D 50%, #1A1F2E 70%, #0D1117 100%)'
                }}
              >
                {/* Elegant shine overlay */}
                <div className="segment-shine" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: isGoldSegment ? 
                    'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.2) 100%)' :
                    'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, transparent 40%)',
                  pointerEvents: 'none'
                }}></div>
                
                {/* Subtle texture overlay */}
                <div className="segment-texture" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: isGoldSegment ?
                    'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)' :
                    'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }}></div>
              </div>
            );
          })}
          
          {/* Outer decorative ring */}
          <div className="wheel-outer-ring"></div>
          
          {/* Center circle */}
          <div className="wheel-center">
            <div className="wheel-center-ring"></div>
            <div className="wheel-center-inner">
              <div className="center-dot"></div>
            </div>
          </div>
        </div>

        {/* Premium Pointer */}
        <div className="wheel-pointer">
          <div className="pointer-glow"></div>
          <div className="pointer-arrow"></div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
