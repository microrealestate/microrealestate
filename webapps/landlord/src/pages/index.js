import { getStoreInstance, setupOrganizationsInStore } from '../store';

import { toJS } from 'mobx';
import { useRouter } from 'next/router';

export default function Index({ organization }) {
  const router = useRouter();

  if (organization) {
    router.push(`/${organization.name}/dashboard`);
  } else {
    router.push('/signin');
  }

  return null;
}

export async function getServerSideProps(context) {
  // redirect if not signed in
  const store = getStoreInstance();

  const { status } = await store.user.refreshTokens(context);
  if (status !== 200) {
    return { props: { organization: null } };
  }

  try {
    await setupOrganizationsInStore();
  } catch {
    return { props: { organization: null } };
  }

  if (!store.user.signedIn) {
    return { props: { organization: null } };
  }

  return {
    props: {
      organization: toJS(store.organization.selected || null)
    }
  };
}
