import React from 'react';

const Skeleton = ({ 
  className = '', 
  variant = 'text',
  animation = 'pulse',
  width,
  height,
  count = 1
}) => {
  const baseClasses = 'bg-secondary-700 rounded';
  
  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };
  
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    rectangular: 'h-32 w-full',
    circular: 'rounded-full',
    button: 'h-10 w-24 rounded-lg',
    avatar: 'h-10 w-10 rounded-full'
  };
  
  const style = {
    width: width || undefined,
    height: height || undefined
  };
  
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClasses} ${animations[animation]} ${variants[variant]} ${className} ${i > 0 ? 'mt-2' : ''}`}
      style={style}
    />
  ));
  
  return count > 1 ? <>{skeletons}</> : skeletons[0];
};

const SkeletonContainer = ({ children, loading, className = '' }) => {
  return loading ? (
    <div className={className}>
      {children}
    </div>
  ) : null;
};

Skeleton.Container = SkeletonContainer;

export default Skeleton;