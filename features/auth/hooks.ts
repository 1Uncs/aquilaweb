import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi } from '@/features/auth/service';

type LoginInput = { email: string; password: string; organizationId: string; organizationName: string };

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, LoginInput>({
    mutationFn: ({ email, password, organizationId, organizationName }) => loginApi(email, password, organizationId, organizationName),
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await logoutApi();
    },
    onSettled: () => {
      // RN 0.86 InteractionManager deprecated — use idle callback to defer clear after transitions
      const run = () => queryClient.clear();
      if (typeof globalThis.requestIdleCallback === 'function') {
        globalThis.requestIdleCallback(run);
      } else {
        setTimeout(run, 0);
      }
    },
  });
}
