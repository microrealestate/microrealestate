import express from 'express';
import * as Controllers from './controllers';

export default function tenantRouter() {
  const tenantRouter = express.Router();
  tenantRouter.post('/signin', Controllers.signIn);
  tenantRouter.delete('/signout', Controllers.signOut);
  tenantRouter.get('/signedin', Controllers.signedIn);
  tenantRouter.get('/session', Controllers.getSession);
  return tenantRouter;
}
