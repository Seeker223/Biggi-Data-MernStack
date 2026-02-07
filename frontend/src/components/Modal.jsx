import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XMarkIcon,
  InformationCircleIcon,
  TrophyIcon 
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function Modal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  buttons = [],
  customContent 
}) {
  if (!isOpen) return null;

  const iconProps = {
    success: { icon: CheckCircleIcon, color: "text-green-600", bg: "bg-green-100" },
    error: { icon: ExclamationCircleIcon, color: "text-red-600", bg: "bg-red-100" },
    info: { icon: InformationCircleIcon, color: "text-blue-600", bg: "bg-blue-100" },
    trophy: { icon: TrophyIcon, color: "text-yellow-500", bg: "bg-yellow-100" }
  };

  const { icon: Icon, color, bg } = iconProps[type] || iconProps.info;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-2xl w-full max-w-md overflow-hidden ${
          type === "success" ? "border-l-4 border-green-600" : 
          type === "error" ? "border-l-4 border-red-600" : 
          type === "info" ? "border-l-4 border-blue-600" : 
          "border-l-4 border-yellow-500"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-full ${bg} mr-3`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {customContent ? (
            customContent
          ) : (
            <>
              <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
              
              {buttons.length > 0 && (
                <div className="flex flex-col gap-2">
                  {buttons.map((button, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        button.action();
                        onClose();
                      }}
                      className={`py-3 rounded-lg font-semibold transition-colors ${
                        button.variant === "primary"
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : button.variant === "secondary"
                          ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {button.text}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}