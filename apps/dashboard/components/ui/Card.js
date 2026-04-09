// apps/dashboard/components/ui/Card.js
import React from 'react';

export const Card = ({ children, className = '' }) => {
  return (
    <div
      className={`beautiful-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
};
