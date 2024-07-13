import { XIcon } from 'lucide-react';
import { createContext, useContext } from 'react';

import { IconButton } from '~/ui/icon-button';
import * as Toast from '~/ui/toast';

const toaster = Toast.createToaster({
  placement: 'bottom-end',
  overlap: true,
  gap: 16,
});

const ToastContext = createContext<ReturnType<typeof Toast.createToaster>>(toaster);

export const ToastProvider: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <ToastContext.Provider value={toaster}>
      <Toast.Toaster toaster={toaster}>
        {(toast) => (
          <Toast.Root key={toast.id}>
            <Toast.Title>{toast.title}</Toast.Title>
            <Toast.Description>{toast.description}</Toast.Description>
            <Toast.CloseTrigger asChild>
              <IconButton size="sm" variant="link">
                <XIcon />
              </IconButton>
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </Toast.Toaster>
      {props.children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  return useContext(ToastContext);
};
