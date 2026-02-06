export function Button({ children, onClick, variant = 'primary' }) {
  const styles = variant === 'primary' 
    ? 'bg-blue-500 text-white hover:bg-blue-600' 
    : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    
  return (
    <button 
      className={`px-4 py-2 rounded-md transition-colors ${styles}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
