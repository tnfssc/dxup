import { useQuery } from '@tanstack/react-query';
import { css } from 'styled-system/css';

import '~/App.css';
import { api } from '~/api';
import { useToast } from '~/hooks/toaster';
import { Button } from '~/ui/button';

function App() {
  const asdfList = useQuery(api.asdf.list);
  const toast = useToast();
  return (
    <div className={css({ w: 'screen', h: 'screen', overflow: 'auto', scrollBehavior: 'smooth', scrollbar: 'hidden' })}>
      <Button onClick={() => toast.success({ title: 'Success', description: 'This is a success message' })}>
        Hello
      </Button>
      <pre>{JSON.stringify(asdfList.data, null, 2)}</pre>
    </div>
  );
}

export default App;
