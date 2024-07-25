import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { relaunch } from '@tauri-apps/api/process';
import { CheckIcon, ChevronDownIcon, RefreshCcwIcon, XIcon } from 'lucide-react';
import { css } from 'styled-system/css';
import { Box, Center, HStack, VStack } from 'styled-system/jsx';

import { asdfProfileConfig, cli } from '~/api';
import { useToast } from '~/hooks/toaster';
import * as Accordion from '~/ui/accordion';
import { Button } from '~/ui/button';
import { Code } from '~/ui/code';
import { Text } from '~/ui/text';

export const Route = createFileRoute('/doctor')({
  component: Page,
});

function Page() {
  const toast = useToast();
  const asdfQuery = useQuery(cli.asdf.runtime.help());
  const gitQuery = useQuery(cli.git.help());
  const curlQuery = useQuery(cli.curl.help());

  const downloadAsdfMutation = useMutation(cli.downloadAsdf());
  const addAsdfToProfileMutation = useMutation(cli.addAsdfToProfile());

  const installAsdf = useMutation({
    mutationFn: async () => {
      await downloadAsdfMutation.mutateAsync();
      await addAsdfToProfileMutation.mutateAsync();
      await relaunch();
    },
  });

  const allInstalled = !gitQuery.isError && !curlQuery.isError && !asdfQuery.isError;

  const isFetching = asdfQuery.isFetching || gitQuery.isFetching || curlQuery.isFetching;

  return (
    <Center flexDir="column" gap="4" p="4">
      <HStack py="4" px="4" w="full" justify="space-between" alignItems="center">
        <Text>{isFetching ? 'Loading...' : allInstalled ? 'All good!' : 'Some things are not installed'}</Text>
        <Button
          disabled={isFetching}
          variant="outline"
          size="sm"
          onMouseDown={() => {
            void Promise.allSettled([asdfQuery.refetch(), gitQuery.refetch(), curlQuery.refetch()]).then(() =>
              toast.success({ title: 'Refreshed' }),
            );
          }}
        >
          {isFetching ? <RefreshCcwIcon className={css({ animation: 'spin' })} /> : <RefreshCcwIcon />}
          Refresh
        </Button>
      </HStack>
      {isFetching ? null : (
        <Accordion.Root collapsible>
          <Accordion.Item value="git">
            <Accordion.ItemTrigger fontWeight="normal" fontSize="md" px="4">
              <HStack gap="4">
                {gitQuery.isError ? (
                  <>
                    <XIcon />
                    <Code>git</Code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <Code>git</Code> is installed
                  </>
                )}
              </HStack>
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Box ml="14">
                {gitQuery.isError ? (
                  <VStack alignItems="start" gap="4">
                    <Text>
                      Install <Code>git</Code> with your package manager
                    </Text>
                    <Text>
                      macOS: <Code>brew install coreutils git</Code>
                    </Text>
                    <Text>
                      Linux: <Code>apt install git</Code>
                    </Text>
                  </VStack>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="curl">
            <Accordion.ItemTrigger fontWeight="normal" fontSize="md" px="4">
              <HStack gap="4">
                {curlQuery.isError ? (
                  <>
                    <XIcon />
                    <Code>curl</Code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <Code>curl</Code> is installed
                  </>
                )}
              </HStack>
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Box ml="14">
                {curlQuery.isError ? (
                  <VStack alignItems="start" gap="4">
                    <Text>
                      Install <Code>curl</Code> with your package manager
                    </Text>
                    <Text>
                      macOS: <Code>brew install coreutils curl</Code>
                    </Text>
                    <Text>
                      Linux: <Code>apt install curl</Code>
                    </Text>
                  </VStack>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="asdf">
            <Accordion.ItemTrigger fontWeight="normal" fontSize="md" px="4">
              <HStack gap="4">
                {asdfQuery.isError ? (
                  <>
                    <XIcon />
                    <Code>asdf</Code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <Code>asdf</Code> is installed
                  </>
                )}
              </HStack>
              <Accordion.ItemIndicator>
                <ChevronDownIcon />
              </Accordion.ItemIndicator>
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Box ml="14">
                {asdfQuery.isError ? (
                  <VStack alignItems="start" gap="4">
                    <VStack alignItems="start" gap="2">
                      <Text>
                        Download <Code>asdf</Code> using
                      </Text>
                      <Code>git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0</Code>
                    </VStack>
                    <Text>
                      Add the following lines to your <Code>~/.profile</Code>
                    </Text>
                    <VStack alignItems="start" gap="2">
                      <Code whiteSpace="pre">{asdfProfileConfig()}</Code>
                    </VStack>
                    <Text>Restart your computer for the changes to take effect</Text>
                    <Button
                      mt="4"
                      disabled={gitQuery.isError || curlQuery.isError}
                      variant="outline"
                      onMouseDown={() => {
                        toast.promise(installAsdf.mutateAsync(), {
                          loading: {
                            title: 'Installing',
                          },
                          success: {
                            title: 'Installed',
                            description: 'Restart your computer for the changes to take effect',
                            duration: 1_000_000,
                          },
                          error: {
                            title: 'Failed to install',
                          },
                        });
                      }}
                    >
                      or install automatically (beta)
                    </Button>
                  </VStack>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
    </Center>
  );
}
