import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, Filter, X, UserCheck, UserX, Building, Briefcase, Eye, Edit, Trash2 } from 'lucide-react';
import { getUsers } from '../services/userService';
import { referenceService } from '../services/referenceService';
import type { ReferenceData } from '../services/referenceService';
import type { User } from '../types/user';
import CrearEmpleadoModal from '../components/CrearEmpleadoModal';
import VerEmpleadoModal from '../components/VerEmpleadoModal';
import EditarEmpleadoModal from '../components/EditarEmpleadoModal';
import EliminarEmpleadoModal from '../components/EliminarEmpleadoModal';

interface FilterState {
  status: 'all' | 'active' | 'inactive';
  department: string | ''; // Changed to string to match user.department
  position: string | '';   // Changed to string to match user.position
}

const GestionEmpleadosPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [references, setReferences] = useState<ReferenceData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los modales
  const [showCrearModal, setShowCrearModal] = useState<boolean>(false);
  const [showVerModal, setShowVerModal] = useState<boolean>(false);
  const [showEditarModal, setShowEditarModal] = useState<boolean>(false);
  const [showEliminarModal, setShowEliminarModal] = useState<boolean>(false);
  
  // Estados para los empleados seleccionados
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    department: '',
    position: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, refData] = await Promise.all([
        getUsers(),
        referenceService.getFormReferences()
      ]);
      console.log('Users cargados:', userData);
      console.log('References cargadas:', refData);
      setUsers(userData);
      setReferences(refData);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError('No se pudieron cargar los empleados o referencias. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar empleados
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const positionName = user.position || '';
      const departmentName = user.department || '';

      const matchesSearch = 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        positionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        departmentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        filters.status === 'all' ||
        (filters.status === 'active' && user.is_active) ||
        (filters.status === 'inactive' && !user.is_active);

      const matchesDepartment = 
        !filters.department || 
        user.department === filters.department;

      const matchesPosition = 
        !filters.position || 
        user.position === filters.position;

      return matchesSearch && matchesStatus && matchesDepartment && matchesPosition;
    });
  }, [users, searchTerm, filters]);

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length;

  const clearFilters = () => {
    setFilters({
      status: 'all',
      department: '',
      position: ''
    });
    setSearchTerm('');
  };

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    departments: references.departments?.length || 0
  }), [users, references]);

  // Funciones para manejar los modales
  const handleVerEmpleado = (userId: number) => {
    setSelectedUserId(userId);
    setShowVerModal(true);
  };

  const handleEditarEmpleado = (userId: number) => {
    setSelectedUserId(userId);
    setShowEditarModal(true);
  };

  const handleEliminarEmpleado = (user: User) => {
    setSelectedUserForDelete(user);
    setShowEliminarModal(true);
  };

  const handleCloseModals = () => {
    setShowVerModal(false);
    setShowEditarModal(false);
    setShowEliminarModal(false);
    setSelectedUserId(null);
    setSelectedUserForDelete(null);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Modales */}
      <CrearEmpleadoModal
        show={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onCreated={fetchData}
      />
      
      <VerEmpleadoModal
        show={showVerModal}
        onClose={handleCloseModals}
        userId={selectedUserId}
      />
      
      <EditarEmpleadoModal
        show={showEditarModal}
        onClose={handleCloseModals}
        onUpdated={fetchData}
        userId={selectedUserId}
      />
      
      <EliminarEmpleadoModal
        show={showEliminarModal}
        onClose={handleCloseModals}
        onDeleted={fetchData}
        user={selectedUserForDelete}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de Empleados
            </h1>
            <p className="text-gray-600 mt-1">
              Administra el personal de tu organización de manera eficiente
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total Empleados" 
            value={stats.total} 
            icon={<Users className="w-5 h-5" />}
            color="from-blue-500 to-blue-600"
          />
          <StatCard 
            title="Activos" 
            value={stats.active} 
            icon={<UserCheck className="w-5 h-5" />}
            color="from-green-500 to-green-600"
          />
          <StatCard 
            title="Inactivos" 
            value={stats.inactive} 
            icon={<UserX className="w-5 h-5" />}
            color="from-red-500 to-red-600"
          />
          <StatCard 
            title="Departamentos" 
            value={stats.departments} 
            icon={<Building className="w-5 h-5" />}
            color="from-purple-500 to-purple-600"
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, cargo o departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Add Employee Button */}
          <button
            onClick={() => setShowCrearModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Nuevo Empleado
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as FilterState['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los departamentos</option>
                  {references.departments?.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <select
                  value={filters.position}
                  onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los cargos</option>
                  {references.positions?.map(pos => (
                    <option key={pos.id} value={pos.name}>{pos.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {filteredUsers.length} de {users.length} empleados
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Cargando empleados...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-500 mb-4">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-medium mb-2">No se encontraron empleados</p>
            <p className="text-gray-400 text-sm">
              {users.length === 0 
                ? 'Aún no hay empleados registrados' 
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Empleado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contacto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cargo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Departamento</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => {
                    const fullName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    console.log(`User ${user.id}:`, { 
                      position: user.position, 
                      position_id: user.position_id, 
                      department: user.department, 
                      department_id: user.department_id 
                    });
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{fullName}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                            {user.position || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <Building className="w-4 h-4 mr-2 text-gray-400" />
                            {user.department || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? (
                              <>
                                <UserCheck className="w-3 h-3 mr-1" />
                                Activo
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Inactivo
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleVerEmpleado(user.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditarEmpleado(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Editar empleado"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEliminarEmpleado(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar empleado"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 bg-gradient-to-r ${color} rounded-xl text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default GestionEmpleadosPage;