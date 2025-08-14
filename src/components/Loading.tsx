import Lottie from "lottie-react";
import catAnimation from "../cat.json";
import { useEffect, useState } from "react";

const Loading = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
      <div className="w-[200px] h-[200px]">
        <Lottie animationData={catAnimation} loop={true} />
      </div>
    </div>
  );
};

export default Loading; 