/**
 * OnboardingStep.jsx
 * Individual onboarding step wrapper with animations
 */

import React, { useEffect, useState } from 'react';

/**
 * @component
 * @param {Object} props
 * @param {Object} props.step - Step configuration
 * @param {number} props.stepNumber - Current step number
 * @returns {React.ReactElement}
 */
export default function OnboardingStep({ step, stepNumber }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [stepNumber]);

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? 'opacity-100 transform-gpu' : 'opacity-0'
      }`}
    >
      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
      <p className="text-slate-300 text-sm mb-6">{step.description}</p>

      {/* Content */}
      <div className="text-white">
        {step.content}
      </div>
    </div>
  );
}
