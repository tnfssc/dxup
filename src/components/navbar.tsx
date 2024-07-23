import { useStore } from '@nanostores/react';
import { useQuery } from '@tanstack/react-query';
import { useMatch, useRouter } from '@tanstack/react-router';
import { ChevronRightIcon } from 'lucide-react';
import { css } from 'styled-system/css';

import { cli } from '~/api';
import { useToast } from '~/hooks/toaster';
import { $project } from '~/stores/project';
import { Button } from '~/ui/button';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { friendlyPath } from '~/utils';

import { NavDrawer } from './drawer';

export const navbarHeightInPx = 57;

export const Navbar = () => {
  const match = useMatch({ from: '/$tool', shouldThrow: false });
  const router = useRouter();
  const toast = useToast();
  const project = useStore($project);
  const pwdQuery = useQuery(cli.pwd({ cwd: project }));
  const projectName = pwdQuery.data?.at(-1) ?? 'Loading...';
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
      <button
        className={css({ cursor: 'pointer', rounded: 'full' })}
        aria-label="Go to home page"
        onClick={() => {
          void router.navigate({ to: '/' });
        }}
      >
        <img src="/icon.svg" alt="dxup logo" height={32} width={32} />
      </button>
      <EasyTooltip tooltip={pwd}>
        <span>{projectName}</span>
        {match?.params.tool && <span> / {match.params.tool}</span>}
      </EasyTooltip>
      <NavDrawer
        title={projectName}
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
