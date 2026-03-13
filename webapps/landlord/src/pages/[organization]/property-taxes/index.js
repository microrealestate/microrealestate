import { UtilitiesPage } from '../utilities';
import { withAuthentication } from '../../../components/Authentication';

function PropertyTaxesPage() {
  return <UtilitiesPage view="tax" />;
}

export default withAuthentication(PropertyTaxesPage);
