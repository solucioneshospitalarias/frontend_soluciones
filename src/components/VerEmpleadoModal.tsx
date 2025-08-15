import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, Briefcase, Calendar, CreditCard, UserCheck, UserX } from 'lucide-react';
import { getUserById } from '../services/userService';
import type { User as UserType } from '../types/user';

interface VerEmpleadoModalProps {
    show: boolean;
    onClose: () => void;
    userId: number | null;
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
        } catch (err: any) {
            console.error('Error al obtener usuario:', err);
            setError(err?.response?.data?.message || 'No se pudo cargar la información del empleado');
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

    // Función segura para obtener iniciales
    const getInitials = (name: string) => {
        if (!name || typeof name !== 'string') return 'NN';

        try {
            return name
                .trim()
                .split(' ')
                .filter(word => word.length > 0)
                .map(word => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
        } catch (error) {
            console.error('Error getting initials:', error);
            return 'NN';
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                            <User className="w-6 h-6" />
                        </div>
                        Detalles del Empleado
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-4"></div>
                            <span className="text-gray-600">Cargando información...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-500 mb-4">
                                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            </div>
                            <p className="text-red-600 font-medium mb-4">{error}</p>
                            <button
                                onClick={fetchUser}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                type="button"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : user ? (
                        <div className="space-y-6">
                            {/* Avatar y nombre */}
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                                    {getInitials(user.name || '')}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">{user.name || 'Sin nombre'}</h3>
                                <div className="mt-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${user.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {user.is_active ? (
                                            <>
                                                <UserCheck className="w-4 h-4 mr-1" />
                                                Activo
                                            </>
                                        ) : (
                                            <>
                                                <UserX className="w-4 h-4 mr-1" />
                                                Inactivo
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Información personal */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center text-gray-600 mb-2">
                                        <Mail className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-medium">Email</span>
                                    </div>
                                    <p className="text-gray-900 font-medium break-all">{user.email || '—'}</p>
                                </div>

                                {/* Documento */}
                                {user.document && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Documento</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{user.document}</p>
                                    </div>
                                )}

                                {/* Cargo */}
                                {user.position && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Briefcase className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Cargo</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">
                                            {typeof user.position === 'string'
                                                ? user.position
                                                : (user.position as any)?.name || 'Sin cargo'}
                                        </p>
                                    </div>
                                )}

                                {/* Departamento */}
                                {user.department && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Building className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Departamento</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">
                                            {typeof user.department === 'string'
                                                ? user.department
                                                : (user.department as any)?.name || 'Sin departamento'}
                                        </p>
                                    </div>
                                )}


                                {/* Fecha de contratación */}
                                {user.hire_date && (
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center text-gray-600 mb-2">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span className="text-sm font-medium">Fecha de Contratación</span>
                                        </div>
                                        <p className="text-gray-900 font-medium">{formatDate(user.hire_date)}</p>
                                    </div>
                                )}

                                {/* ID de usuario */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-center text-gray-600 mb-2">
                                        <User className="w-4 h-4 mr-2" />
                                        <span className="text-sm font-medium">ID de Usuario</span>
                                    </div>
                                    <p className="text-gray-900 font-medium">#{user.id}</p>
                                </div>
                            </div>

                            {/* Fechas del sistema */}
                            {(user.created_at || user.updated_at) && (
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-medium text-gray-600 mb-3">Información del Sistema</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        {user.created_at && (
                                            <div>
                                                <span className="text-gray-500">Fecha de registro:</span>
                                                <p className="text-gray-900">{formatDate(user.created_at)}</p>
                                            </div>
                                        )}
                                        {user.updated_at && (
                                            <div>
                                                <span className="text-gray-500">Última actualización:</span>
                                                <p className="text-gray-900">{formatDate(user.updated_at)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-500 font-medium">No se encontró información del empleado</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                        type="button"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerEmpleadoModal;