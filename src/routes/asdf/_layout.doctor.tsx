import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CheckIcon, RefreshCcwIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { asdfProfileConfig, cli } from '~/api';
import { LoaderIcon } from '~/components/LoaderIcon';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/shadcn/accordion';
import { Button } from '~/shadcn/button';

export const Route = createFileRoute('/asdf/_layout/doctor')({
  component: Page,
});

function Page() {
  const asdfQuery = useQuery(cli.asdf.runtime.help());
  const gitQuery = useQuery(cli.git.help());
  const curlQuery = useQuery(cli.curl.help());

  const downloadAsdfMutation = useMutation(cli.downloadAsdf());
  const addAsdfToProfileMutation = useMutation(cli.addAsdfToProfile());

  const installAsdf = useMutation({
    mutationFn: async () => {
      await downloadAsdfMutation.mutateAsync();
      await addAsdfToProfileMutation.mutateAsync();
    },
  });

  const allInstalled = !gitQuery.isError && !curlQuery.isError && !asdfQuery.isError;

  const isFetching = asdfQuery.isFetching || gitQuery.isFetching || curlQuery.isFetching;

  return (
    <div className="mt-8 flex flex-col justify-center gap-4 p-4">
      <div className="flex w-full items-center justify-between px-4 py-4">
        <p>{isFetching ? 'Loading...' : allInstalled ? 'All good!' : 'Some things are not installed'}</p>
        <Button
          disabled={isFetching}
          variant="outline"
          size="icon"
          onMouseDown={() => {
            void Promise.allSettled([asdfQuery.refetch(), gitQuery.refetch(), curlQuery.refetch()]).then(() =>
              toast.success('Refreshed'),
            );
          }}
        >
          {isFetching ? <LoaderIcon /> : <RefreshCcwIcon />}
        </Button>
      </div>
      {isFetching ? null : (
        <Accordion type="multiple">
          <AccordionItem value="git">
            <AccordionTrigger className="px-4">
              <div className="flex gap-4">
                {gitQuery.isError ? (
                  <>
                    <XIcon />
                    <code>git</code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <code>git</code> is installed
                  </>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="ml-14">
                {gitQuery.isError ? (
                  <div className="flex flex-col items-start gap-4">
                    <p>
                      Install <code>git</code> with your package manager
                    </p>
                    <p>
                      macOS: <code>brew install coreutils git</code>
                    </p>
                    <p>
                      Linux: <code>apt install git</code>
                    </p>
                  </div>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="curl">
            <AccordionTrigger className="px-4">
              <div className="flex gap-4">
                {curlQuery.isError ? (
                  <>
                    <XIcon />
                    <code>curl</code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <code>curl</code> is installed
                  </>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="ml-14">
                {curlQuery.isError ? (
                  <div className="flex flex-col items-start gap-4">
                    <p>
                      Install <code>curl</code> with your package manager
                    </p>
                    <p>
                      macOS: <code>brew install coreutils curl</code>
                    </p>
                    <p>
                      Linux: <code>apt install curl</code>
                    </p>
                  </div>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="asdf">
            <AccordionTrigger className="px-4">
              <div className="flex gap-4">
                {asdfQuery.isError ? (
                  <>
                    <XIcon />
                    <code>asdf</code> is not installed
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    <code>asdf</code> is installed
                  </>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="ml-14">
                {asdfQuery.isError ? (
                  <div className="flex flex-col items-start gap-4">
                    <div className="flex flex-col items-start gap-2">
                      <p>
                        Download <code>asdf</code> using
                      </p>
                      <code>git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0</code>
                    </div>
                    <p>
                      Add the following lines to your <code>~/.profile</code>
                    </p>
                    <div className="flex flex-col items-start gap-2">
                      <code className="whitespace-pre">{asdfProfileConfig()}</code>
                    </div>
                    <p>Restart your computer for the changes to take effect</p>
                    <Button
                      className="mt-4"
                      disabled={installAsdf.isSuccess || gitQuery.isError || curlQuery.isError}
                      variant="outline"
                      onMouseDown={() => {
                        toast.promise(installAsdf.mutateAsync(), {
                          loading: 'Installing',
                          success: 'Installed',
                          error: 'Failed to install',
                        });
                      }}
                    >
                      {installAsdf.isSuccess ? 'Restart your computer' : 'or install automatically (beta)'}
                    </Button>
                  </div>
                ) : (
                  <Button disabled>Installed</Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
