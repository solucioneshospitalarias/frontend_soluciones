import axios from 'axios';
import type { User, UserCreateDTO } from '../types/user';

export const getUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const response = await axios.get('http://localhost:8080/api/v1/users', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserById = async (id: number): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const response = await axios.get(`http://localhost:8080/api/v1/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createUser = async (data: UserCreateDTO) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const payload = {
    email: data.email,
    document: data.document,
    password: data.password,
    first_name: data.firstName,
    last_name: data.lastName,
    role_id: data.roleID,
    position_id: data.positionID,
    hire_date: data.hireDate,
  };

  const response = await axios.post('http://localhost:8080/api/v1/users', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export const updateUser = async (id: number, data: Partial<User>): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  const response = await axios.put(`http://localhost:8080/api/v1/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Token no disponible');

  await axios.delete(`http://localhost:8080/api/v1/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};