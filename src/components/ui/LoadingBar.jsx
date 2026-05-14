function LoadingBar({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-border overflow-hidden z-50">
      <div className="w-1/3 h-full bg-accent animate-pulse"></div>
    </div>
  );
}

export default LoadingBar;
