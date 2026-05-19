import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { businessService } from '../services/businessService';
import { Navbar } from '../components/Navbar';

const TOKEN_KEY = 'auth_token';

export const CompleteBirthDate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [person, setPerson] = useState<any>(null);
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const p = await businessService.findPersonByUserId(user.id, token);
        setPerson(p);
      } catch (e) {
        console.warn('No se pudo obtener person:', e);
      }
    })();
  }, [user]);

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    const dob = new Date(dateStr);
    let years = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      years--;
    }
    return years;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
    const computed = calculateAge(e.target.value);
    setAge(computed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!person) return setError('No se encontró persona asociada');
    if (age === null || age === undefined || isNaN(age)) return setError('Introduce una fecha válida');
    setIsLoading(true);
    try {
      await businessService.updatePerson(person.id, { edad: age });
      // Refresh local user state stored in localStorage if necessary, then redirect
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al guardar la edad');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-8 py-8 text-white">
            <h1 className="text-2xl font-bold">Completa tu fecha de nacimiento</h1>
            <p className="mt-2 text-sky-100">Para calcular tu edad y completar tu perfil.</p>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={handleDateChange}
                  className="mt-2 block w-full rounded-lg border-gray-200 shadow-sm p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Edad calculada</label>
                <div className="mt-2 text-lg font-semibold">{age !== null ? `${age} años` : '—'}</div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 py-2 px-6 text-white font-semibold disabled:opacity-50"
                >
                  {isLoading ? 'Guardando...' : 'Guardar edad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteBirthDate;
