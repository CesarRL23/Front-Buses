import { useAuth } from './useAuth';

export const usePermission = () => {
  const { user } = useAuth();

  /**
   * Checks if the current user has a specific permission.
   * @param url The resource URL (e.g., '/company')
   * @param method The HTTP method (e.g., 'POST')
   */
  const hasPermission = (url: string, method: string): boolean => {
    if (!user || !user.permissions) return false;

    const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
    const normalizedUrl = normalize(url);

    console.log('Checking permission for:', { url, method, normalizedUrl });
    console.log('User permissions:', user.permissions);

    return user.permissions.some(
      (p) => {
        const normalizedPermUrl = normalize(p.url);
        return (
          (normalizedUrl === normalizedPermUrl || normalizedUrl.startsWith(normalizedPermUrl + '/')) && 
          p.method.toUpperCase() === method.toUpperCase()
        );
      }
    );
  };

  return { hasPermission };
};
