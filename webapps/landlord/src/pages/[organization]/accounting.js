import { observer } from 'mobx-react-lite';
import Page from '../../components/Page';
import { withAuthentication } from '../../components/Authentication';

const Accounting = observer(() => {
  return (
    <Page>
      <div>Accounting</div>
    </Page>
  );
});

export default withAuthentication(Accounting);
