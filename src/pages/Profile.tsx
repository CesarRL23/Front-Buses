import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { FormInput } from '../components/FormInput';
import { businessService } from '../services/businessService';
import { User as UserIcon, Mail, Phone, Shield, CreditCard as Edit2, Save, X, Calendar } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [person, setPerson] = useState<any>(null);
  const [birthDate, setBirthDate] = useState<string>('');

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    edad: null as number | null,
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('auth_token');
        const p = await businessService.findPersonByUserId(user.id, token);
        if (p) {
          setPerson(p);
          setFormData(prev => ({ ...prev, edad: p.edad ?? null }));
        }
      } catch (e) {
        console.warn('No se pudo obtener person:', e);
      }
    })();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
    const computed = calculateAge(e.target.value);
    setFormData({ ...formData, edad: computed });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');

    try {
      await updateProfile(formData);
      
      // Update person entity with edad if person exists
      if (person) {
        const token = localStorage.getItem('auth_token');
        await businessService.updatePerson(person.id, { edad: formData.edad }, token);
      }
      
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      edad: person?.edad ?? null,
    });
    setBirthDate('');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
            <div className="flex items-center space-x-6">
              <div className="bg-white p-4 rounded-full">
                <UserIcon className="h-16 w-16 text-blue-600" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-blue-100 mt-1">{user?.email}</p>
                <div className="flex gap-2 mt-3">
                  {user?.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20 text-white"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      {role.toUpperCase() === 'ADMIN' 
                        ? 'Administrador' 
                        : role.toUpperCase() === 'CIUDADANO' 
                          ? 'Ciudadano' 
                          : role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Información Personal
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  <Edit2 className="h-5 w-5" />
                  <span>Editar Perfil</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
                  >
                    <X className="h-5 w-5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Save className="h-5 w-5" />
                    <span>{isLoading ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Nombre"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />

                <FormInput
                  label="Apellido"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                />
              </div>

              <FormInput
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                icon={<Mail className="h-5 w-5 text-gray-400" />}
              />

              <FormInput
                label="Teléfono"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+593 99 123 4567"
                icon={<Phone className="h-5 w-5 text-gray-400" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    disabled={!isEditing}
                    title="Fecha de nacimiento"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad
                  </label>
                  <div className={`w-full px-4 py-2 border rounded-lg ${
                    isEditing ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-gray-900 font-medium">
                      {formData.edad !== null && formData.edad !== undefined ? `${formData.edad} años` : 'Sin Informacion'}
                    </p>
                  </div>
                </div>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Configuración de Seguridad
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Autenticación de Dos Factores
                      </p>
                      <p className="text-sm text-gray-600">
                        {user?.twoFactorEnabled
                          ? 'Protección adicional activada'
                          : 'Activa 2FA para mayor seguridad'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.twoFactorEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {user?.twoFactorEnabled ? 'Activado' : 'Desactivado'}
                  </div>
                </div>

                <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition">
                  Cambiar Contraseña
                </button>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Información de la Cuenta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">ID de Usuario</p>
                  <p className="font-mono text-gray-900 mt-1">{user?.id}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Roles Asignados</p>
                  <p className="text-gray-900 mt-1">
                    {user?.roles && user.roles.length > 0
                      ? user.roles.join(', ') 
                      : 'No tienes ningún rol asignado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
