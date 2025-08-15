import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle, Calendar, AlertCircle, Plus, FileText
} from 'lucide-react';
import { getUsers } from '../services/userService';
import { getEvaluationStats } from '../services/evaluationService';
import type { User } from '../types/user';
import CrearEmpleadoModal from '../components/CrearEmpleadoModal';

interface Stats {
  totalEmployees: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  overdueEvaluations: number;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    completedEvaluations: 0,
    pendingEvaluations: 0,
    overdueEvaluations: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, evalStats] = await Promise.all([
        getUsers(),
        getEvaluationStats(),
      ]);
      setUsers(userData);
      setStats({
        totalEmployees: userData.length,
        completedEvaluations: evalStats.completedEvaluations,
        pendingEvaluations: evalStats.pendingEvaluations,
        overdueEvaluations: evalStats.overdueEvaluations,
      });
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('No se pudieron cargar los datos. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex flex-col gap-6">
      <CrearEmpleadoModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchData}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido al sistema de gestión de evaluaciones!
        </h1>
        <p className="text-gray-600">
          Monitorea y administra evaluaciones de forma clara y organizada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Empleados" value={stats.totalEmployees} color="from-green-400 to-green-600" icon={<Users className="w-8 h-8 text-white" />} />
        <StatCard label="Realizadas" value={stats.completedEvaluations} color="from-blue-400 to-blue-600" icon={<CheckCircle className="w-8 h-8 text-white" />} />
        <StatCard label="Pendientes" value={stats.pendingEvaluations} color="from-orange-400 to-orange-600" icon={<Calendar className="w-8 h-8 text-white" />} />
        <StatCard label="Atrasadas" value={stats.overdueEvaluations} color="from-red-400 to-red-600" icon={<AlertCircle className="w-8 h-8 text-white" />} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Empleados</h2>
        {loading ? (
          <div className="text-center text-gray-500">Cargando empleados...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-auto max-h-[400px] rounded-xl border border-gray-100">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left border-b border-gray-200">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Cargo</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.position ?? '—'}</td>
                  <td className="py-3 px-4">{user.department ?? '—'}</td>

                  <td className="py-3 px-4">
                    {user.is_active ? (
                      <span className="text-green-600 font-semibold">Activo</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <CTAButton
          icon={<Plus className="w-5 h-5" />}
          label="+ Nuevo Empleado"
          color="from-green-500 to-green-600"
          onClick={() => setShowModal(true)}
        />
        <CTAButton icon={<Plus className="w-5 h-5" />} label="+ Nuevo período de evaluación" color="from-blue-500 to-blue-600" />
        <CTAButton icon={<FileText className="w-5 h-5" />} label="+ Ver reportes" color="from-purple-500 to-purple-600" />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white flex items-center justify-between shadow-sm`}>
    <div>
      <p className="text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
    {icon}
  </div>
);

const CTAButton = ({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`bg-gradient-to-r ${color} hover:brightness-110 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default DashboardPage;
