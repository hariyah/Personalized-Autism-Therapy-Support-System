interface LoadingAnimationProps {
  message?: string;
}

export default function LoadingAnimation({ message = "Generating your activity plan..." }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="relative w-20 h-20 mb-6">
        {/* Spinning circle */}
        <div className="absolute inset-0 border-4 border-pastel-green-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-pastel-green-600 rounded-full animate-spin"></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-4 border-2 border-pastel-green-300 rounded-full animate-pulse"></div>
      </div>
      
      {/* Loading text with animation */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">{message}</p>
        <div className="flex justify-center space-x-1">
          <span className="w-2 h-2 bg-pastel-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-pastel-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-pastel-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}

