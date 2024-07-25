import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { type ErrorRouteComponent, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Center } from 'styled-system/jsx';

import { Button } from '~/ui/button';
import { Code } from '~/ui/code';
import { Text } from '~/ui/text';

export const RouteError: ErrorRouteComponent = ({ error }) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <Center minH="96">
      <Text>Something went wrong! {error.name}</Text>
      <Code whiteSpace="pre">{error.message}</Code>
      <Button
        onClick={() => {
          void router.invalidate();
        }}
      >
        Reload
      </Button>
    </Center>
  );
};
