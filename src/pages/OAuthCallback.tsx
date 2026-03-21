import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { oauthLogin } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No se recibió token de OAuth.');
      return;
    }

    (async () => {
      try {
        await oauthLogin(token);
        navigate('/dashboard');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Error al completar autenticación OAuth'
        );
      }
    })();
  }, [oauthLogin, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md text-center w-full max-w-md">
        {error ? (
          <>
            <h2 className="text-2xl font-bold text-red-600">Error de OAuth</h2>
            <p className="text-gray-600 mt-4">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Volver a iniciar sesión
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Autenticando...</h2>
            <p className="text-gray-500 mt-2">Por favor espera un momento.</p>
          </>
        )}
      </div>
    </div>
  );
};
