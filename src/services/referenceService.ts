import axios from 'axios';

export const getReferenceData = async () => {
  const { data } = await axios.get('/api/v1/reference');
  return data as {
    positions: { id: number; name: string }[];
    departments: { id: number; name: string }[];
    roles: { id: number; name: string }[];
  };
};
