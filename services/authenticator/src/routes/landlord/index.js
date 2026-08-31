import { Middlewares, Service } from '@microrealestate/common';
import express from 'express';
import * as Controllers from './controllers';

export default function landlordRouter() {
  const { ACCESS_TOKEN_SECRET } = Service.getInstance().envConfig.getValues();

  const landlordRouter = express.Router();
  landlordRouter.post('/signup', Controllers.signUp);
  landlordRouter.get('/signup/status', Controllers.signUpStatus);
  landlordRouter.post('/signin', Controllers.signIn);
  landlordRouter.post('/refreshtoken', Controllers.refreshToken);
  landlordRouter.delete('/signout', Controllers.signOut);
  landlordRouter.post('/forgotpassword', Controllers.forgotPassword);
  landlordRouter.patch('/resetpassword', Controllers.resetPassword);
  landlordRouter.patch(
    '/changepassword',
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.onlyCallers(['landlord']),
    Middlewares.needCallerEmail(),
    Controllers.changePassword
  );
  landlordRouter.post(
    '/members',
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.onlyCallers(['landlord']),
    Middlewares.needCallerEmail(),
    Controllers.provisionMember
  );
  landlordRouter.delete(
    '/members/:email',
    Middlewares.needAccessToken(ACCESS_TOKEN_SECRET),
    Middlewares.onlyCallers(['landlord']),
    Middlewares.needCallerEmail(),
    Controllers.deleteMember
  );
  landlordRouter.get('/session', Controllers.getSession);
  return landlordRouter;
}
