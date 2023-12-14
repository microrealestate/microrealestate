import type { SessionStatus } from '@/types';

const mockedSession: {
  status: SessionStatus;
  email: string;
} = {
  status: 'authenticated',
  email: 'john.doe@mco.com',
};

export default mockedSession;
