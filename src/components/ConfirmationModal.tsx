import React from 'react';
import { X, Loader2, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;  // ← Ajustado: permite async
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onClose,
  onConfirm,
  title,
  message,
  type,
  loading = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  if (!show) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmBg: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          confirmBg: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
          borderColor: 'border-amber-200'
        };
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          confirmBg: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
          borderColor: 'border-green-200'
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmBg: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
          borderColor: 'border-blue-200'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();  // Await por si es async (como en tu caso con loadAllData)
    onClose();  // ← NUEVO: Cierra el modal después de onConfirm
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border ${config.borderColor}`}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${config.iconBg} rounded-full`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {title}
            </h3>
          </div>
          <button 
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {type !== 'success' && type !== 'info' && (
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}
          
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 ${config.confirmBg} text-white py-3 px-6 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;