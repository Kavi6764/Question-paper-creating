import { useEffect, useState } from "react";
import { Monitor, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";

const DesktopOnly = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;

    const isMobile =
      /Android|iPhone|iPod|Mobile/i.test(ua);

    const isTablet =
      /iPad|Tablet|PlayBook|Silk|Kindle|Nexus 7|Nexus 10/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const checkScreen = () => {
      setIsBlocked(isMobile || isTablet || window.innerWidth < 1024);
    };
   if (isBlocked) {
     toast.error("This app works only on a laptop or desktop");
   }
  
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 text-red-600 p-4 rounded-full">
              <Monitor size={36} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Desktop Access Only
          </h2>

          {/* Message */}
          <p className="text-gray-600 leading-relaxed mb-4">
            This examination portal is accessible only on a
            <span className="font-medium text-gray-800"> laptop or desktop computer</span>.
          </p>

          {/* Warning */}
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            <AlertTriangle size={16} />
            Mobile & tablet devices are not permitted
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DesktopOnly;
