import { useStore } from '@nanostores/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnsiUp } from 'ansi_up';
import { useEffect, useRef, useState } from 'react';
import { Button } from '~/shadcn/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '~/shadcn/drawer';
import logsStore from '~/stores/logs';
import { cn } from '~/utils';

const ansiUp = new AnsiUp();

export const LogsDrawer: React.FC<React.PropsWithChildren> = ({
  children = <Button variant="outline">Open Logs</Button>,
}) => {
  const [, setUpdate] = useState(0);
  const logs = useStore(logsStore.$logs);

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTo({ top: parentRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs, setUpdate]);

  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 1000,
    overscan: 50,
  });

  return (
    <Drawer onOpenChange={() => setUpdate((u) => u + 1)}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full">
          <DrawerHeader className="flex justify-between">
            <DrawerTitle>{logs.length ? 'Logs' : 'No logs to display'}</DrawerTitle>
            <Button size="sm" onClick={() => logsStore.clearLogs()}>
              Clear
            </Button>
          </DrawerHeader>
          <div className="relative mx-4 mb-4 h-64">
            <div className="absolute bottom-0 left-0 right-0 top-0 overflow-auto" ref={parentRef}>
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const l = logs[virtualItem.index]!;
                  return (
                    <div
                      key={`${virtualItem.key}-${l.timestamp}`}
                      className="absolute left-0 top-0 flex w-full items-center hover:bg-secondary"
                      ref={virtualItem.measureElement}
                      data-index={virtualItem.index}
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <code className="mr-4 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</code>
                      <code className="mr-4 text-muted-foreground">{l.name}</code>
                      <code
                        className={cn('flex-1 text-foreground', { 'text-destructive-foreground': l.level === 'error' })}
                        dangerouslySetInnerHTML={{
                          __html: ansiUp.ansi_to_html(l.message),
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
