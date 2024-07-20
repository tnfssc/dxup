import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon } from 'lucide-react';
import { css } from 'styled-system/css';

import { api } from '~/api';
import { useToast } from '~/hooks/toaster';
import { Button } from '~/ui/button';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { friendlyPath } from '~/utils';

import { NavDrawer } from './drawer';

export const navbarHeightInPx = 57;

export const Navbar = () => {
  const toast = useToast();
  const homeDir = useQuery(api.homeDir());
  const pwdQuery = useQuery(api.pwd({ cwd: homeDir.data }));
  const project = pwdQuery.data?.at(-1) ?? 'Loading...';
  const pwd = pwdQuery.data ? friendlyPath(pwdQuery.data) : 'Loading...';

  return (
    <div
      className={css({
        w: 'full',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2',
        p: '2',
        borderBottomWidth: 'thin',
        borderBottomColor: 'bg.subtle',
        position: 'absolute',
        bg: 'bg.canvas',
      })}
      style={{ height: navbarHeightInPx }}
    >
      <span className="rounded-full">
        <img src="/icon.svg" alt="dxup logo" height={32} width={32} />
      </span>
      <EasyTooltip tooltip={pwd}>
        <span>{project}</span>
      </EasyTooltip>
      <NavDrawer
        title={project}
        subtitle={pwd}
        footerContent={
          <Button onMouseDown={() => toast.error({ title: 'Not implemented yet' })} variant="outline">
            Open project
            <ChevronRightIcon />
          </Button>
        }
      >
        TODO
      </NavDrawer>
    </div>
  );
};
