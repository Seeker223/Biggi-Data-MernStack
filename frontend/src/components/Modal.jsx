import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({ isOpen, onClose, type, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`bg-white rounded-2xl p-6 w-[90%] max-w-md shadow-xl ${
        type === "success" 
          ? "border-l-4 border-green-600" 
          : "border-l-4 border-red-600"
      }`}>
        <div className="flex flex-col items-center">
          {type === "success" ? (
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          ) : (
            <ExclamationCircleIcon className="w-10 h-10 text-red-600" />
          )}
          
          <p className="text-gray-900 text-center my-4">{message}</p>
          
          <button
            onClick={onClose}
            className="bg-orange-500 text-white rounded-full px-6 py-2 font-bold hover:bg-orange-600 transition-colors"
          >
            OK
          </button>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}