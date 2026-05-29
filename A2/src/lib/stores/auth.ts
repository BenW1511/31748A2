// Stores currently logged user for frontend and handles log-in/out
import { writable } from 'svelte/store';

export type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

function createAuthStore() {
  const { subscribe, set } = writable<User | null>(null);

  return {subscribe, 
    login(userData: User){set(userData);},

    async loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success) {set(data.user);} else {set(null);}

      } catch {set(null);}
    },
    async logout() {
      await fetch('/api/auth/logout', {method: 'POST'});
      set(null);
    }
  };
}
export const user = createAuthStore();