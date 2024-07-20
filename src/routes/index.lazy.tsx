import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute } from '@tanstack/react-router';
import { SettingsIcon } from 'lucide-react';

import { type CurrentRuntime, api } from '~/api';
import { useToast } from '~/hooks/toaster';
import { EasyTooltip } from '~/ui/easy-tooltip';
import { IconButton } from '~/ui/icon-button';
import * as Table from '~/ui/table';
import { friendlyPath } from '~/utils';

export const Route = createLazyFileRoute('/')({ component: Page });

const Row: React.FC<CurrentRuntime & { index: number }> = ({ name, version, toolVersionLocation, index }) => {
  const toast = useToast();
  const asdfWhere = useQuery({ ...api.asdf.runtime.where(name, version!), enabled: version !== null });

  const where = version !== null ? (asdfWhere.data ? friendlyPath(asdfWhere.data) : 'Loading...') : '';

  return (
    <Table.Row>
      <Table.Cell align="right">{index + 1}</Table.Cell>
      <Table.Cell>
        <EasyTooltip tooltip={where}>{name}</EasyTooltip>
      </Table.Cell>
      <Table.Cell>
        <EasyTooltip tooltip={toolVersionLocation ?? 'Unset'}>{version ?? 'Unset'}</EasyTooltip>
      </Table.Cell>
      <Table.Cell>
        <EasyTooltip tooltip="Configure">
          <IconButton color="fg.muted" variant="outline" onClick={() => toast.error({ title: 'Not implemented yet' })}>
            <SettingsIcon />
          </IconButton>
        </EasyTooltip>
      </Table.Cell>
    </Table.Row>
  );
};

function Page() {
  const homeDir = useQuery(api.homeDir());
  const asdfList = useQuery(api.asdf.runtime.current(undefined, { cwd: homeDir.data }));

  return (
    <Table.Root>
      <Table.Head>
        <Table.Row>
          <Table.Header textAlign="end">#</Table.Header>
          <Table.Header>Runtime</Table.Header>
          <Table.Header>Version</Table.Header>
          <Table.Header>Actions</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {asdfList.data?.map((runtime, index) => <Row key={runtime.name} {...runtime} index={index} />)}
      </Table.Body>
    </Table.Root>
  );
}
