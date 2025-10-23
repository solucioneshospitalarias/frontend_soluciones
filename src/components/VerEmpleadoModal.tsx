import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Mail, Building, Briefcase, Calendar, CreditCard, User } from 'lucide-react';
import { getUserById } from '../services/userService';
import type { User as UserType } from '../types/user';

interface VerEmpleadoModalProps {
    show: boolean;
    onClose: () => void;
    userId: number | null;
}

// Tipos auxiliares para manejar position y department
interface PositionObject {
    name: string;
    id?: number;
}

interface DepartmentObject {
    name: string;
    id?: number;
}

// Tipo para errores de API
interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

const VerEmpleadoModal: React.FC<VerEmpleadoModalProps> = ({
    show,
    onClose,
    userId
}) => {
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (show && userId) {
            fetchUser();
        } else if (!show) {
            // Limpiar estado cuando se cierra el modal
            setUser(null);
            setError(null);
            setLoading(false);
        }
    }, [show, userId]);

    const fetchUser = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);
        setUser(null);

        try {
            const userData = await getUserById(userId);
            setUser(userData);
        } catch (err) {
            console.error('Error al obtener usuario:', err);
            const apiError = err as ApiError;
            setError(apiError?.response?.data?.message || apiError?.message || 'No se pudo cargar la información del empleado');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setUser(null);
        setError(null);
        setLoading(false);
        onClose();
    };

    // Función segura para formatear fechas
    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '—';

            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '—';
        }
    };

    // Función auxiliar para obtener el nombre del cargo
    const getPositionName = (position: string | PositionObject | undefined): string => {
        if (!position) return 'Sin cargo';
        if (typeof position === 'string') return position;
        return (position as PositionObject).name || 'Sin cargo';
    };

    // Función auxiliar para obtener el nombre del departamento
    const getDepartmentName = (department: string | DepartmentObject | undefined): string => {
        if (!department) return 'Sin departamento';
        if (typeof department === 'string') return department;
        return (department as DepartmentObject).name || 'Sin departamento';
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                            <h2 className="text-2xl font-bold mb-2">
                                {user ? `${user.name || 'Sin nombre'}` : 'Detalles del Empleado'}
                            </h2>
                            {user && (
                                <div className="flex justify-center items-center gap-4 text-sm opacity-90">
                                    <span>{getPositionName(user.position)}</span>
                                    <span>•</span>
                                    <span>{getDepartmentName(user.department)}</span>
                                    <span>•</span>
                                    <span className={`${user.is_active ? 'text-green-300' : 'text-red-300'}`}>
                                        {user.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                            <span className="ml-3 text-gray-600">Cargando información...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}

                    {user && (
                        <div className="space-y-6">
                            {/* Información personal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center text-slate-600 mb-2">
                                        <Mail className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-medium">Email</span>
                                    </div>
                                    <p className="text-slate-900 font-medium break-all">{user.email || '—'}</p>
                                </div>

                                {/* Documento */}
                                {user.document && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center text-slate-600 mb-2">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Documento</span>
                                        </div>
                                        <p className="text-slate-900 font-medium">{user.document}</p>
                                    </div>
                                )}

                                {/* Cargo */}
                                {user.position && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center text-slate-600 mb-2">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Cargo</span>
                                        </div>
                                        <p className="text-slate-900 font-medium">{getPositionName(user.position)}</p>
                                    </div>
                                )}

                                {/* Departamento */}
                                {user.department && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center text-slate-600 mb-2">
                                            <Building className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Departamento</span>
                                        </div>
                                        <p className="text-slate-900 font-medium">{getDepartmentName(user.department)}</p>
                                    </div>
                                )}

                                {/* Fecha de contratación */}
                                {user.hire_date && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                        <div className="flex items-center text-slate-600 mb-2">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Fecha de Contratación</span>
                                        </div>
                                        <p className="text-slate-900 font-medium">{formatDate(user.hire_date)}</p>
                                    </div>
                                )}

                                {/* ID de usuario */}
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <div className="flex items-center text-slate-600 mb-2">
                                        <User className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-medium">ID de Usuario</span>
                                    </div>
                                    <p className="text-slate-900 font-medium">#{user.id}</p>
                                </div>
                            </div>

                            {/* Fechas del sistema */}
                            {(user.created_at || user.updated_at) && (
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Información del Sistema</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {user.created_at && (
                                            <div>
                                                <span className="text-slate-500">Fecha de registro:</span>
                                                <p className="text-slate-900">{formatDate(user.created_at)}</p>
                                            </div>
                                        )}
                                        {user.updated_at && (
                                            <div>
                                                <span className="text-slate-500">Última actualización:</span>
                                                <p className="text-slate-900">{formatDate(user.updated_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!loading && !error && !user && (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                            <p className="text-slate-500 font-medium">No se encontró información del empleado</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 sticky bottom-0">
                    <div className="flex justify-end">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
                            type="button"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerEmpleadoModal;